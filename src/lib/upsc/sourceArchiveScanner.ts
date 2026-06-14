import { readdir, stat } from "fs/promises";
import path from "path";

import {
  sourceArchiveTrackRules,
  type SourceArchiveFileHit,
  type SourceArchiveIntakeResponse,
} from "@/lib/upsc/sourceArchiveIntake";

const maxFilesToScan = 6000;
const sampleLimit = 8;

function normalizeExtension(filePath: string) {
  return path.extname(filePath).toLowerCase() || "no extension";
}

function toRelative(rootPath: string, filePath: string) {
  return path.relative(rootPath, filePath).split(path.sep).join("/");
}

function fileTextForMatching(file: SourceArchiveFileHit) {
  return `${file.name} ${file.relativePath}`.toLowerCase().replace(/[_\-()[\]{}.,/\\]+/g, " ");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function keywordMatches(haystack: string, keyword: string) {
  const needle = keyword.toLowerCase().trim();
  if (!needle) return false;

  if (needle.length <= 3 && /^[a-z0-9]+$/.test(needle)) {
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(needle)}($|[^a-z0-9])`).test(haystack);
  }

  return haystack.includes(needle);
}

function pushLimited<T>(items: T[], item: T, limit: number) {
  if (items.length < limit) items.push(item);
}

export async function scanSourceArchive(rootPath: string): Promise<SourceArchiveIntakeResponse> {
  const rootStats = await stat(rootPath).catch(() => null);
  if (!rootStats?.isDirectory()) {
    return {
      ok: false,
      rootPath,
      rootExists: false,
      generatedAt: new Date().toISOString(),
      totalFiles: 0,
      totalDirectories: 0,
      totalBytes: 0,
      extensions: [],
      topFolders: [],
      recentFiles: [],
      tracks: sourceArchiveTrackRules.map((rule) => ({ ...rule, hitCount: 0, sampleFiles: [] })),
      message: "Source archive root was not found. Configure UPSC_SOURCE_ARCHIVE_ROOT or connect the local drive.",
    };
  }

  const stack = [rootPath];
  const files: SourceArchiveFileHit[] = [];
  const extensionCounts = new Map<string, number>();
  const folderCounts = new Map<string, number>();
  let totalDirectories = 0;
  let totalBytes = 0;

  while (stack.length && files.length < maxFilesToScan) {
    const current = stack.pop();
    if (!current) continue;

    const entries = await readdir(current, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        totalDirectories += 1;
        stack.push(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;

      const fileStats = await stat(fullPath).catch(() => null);
      if (!fileStats?.isFile()) continue;

      const relativePath = toRelative(rootPath, fullPath);
      const extension = normalizeExtension(entry.name);
      const pathParts = relativePath.split("/");
      const topFolder = pathParts.length > 1 ? pathParts[0] : "root";
      const fileHit: SourceArchiveFileHit = {
        name: entry.name,
        relativePath,
        extension,
        sizeBytes: fileStats.size,
        lastModified: fileStats.mtime.toISOString(),
      };

      files.push(fileHit);
      totalBytes += fileStats.size;
      extensionCounts.set(extension, (extensionCounts.get(extension) ?? 0) + 1);
      folderCounts.set(topFolder, (folderCounts.get(topFolder) ?? 0) + 1);
    }
  }

  const tracks = sourceArchiveTrackRules.map((rule) => {
    const hits = files
      .filter((file) => {
        const haystack = fileTextForMatching(file);
        return rule.keywords.some((keyword) => keywordMatches(haystack, keyword));
      })
      .sort((left, right) => Date.parse(right.lastModified) - Date.parse(left.lastModified));

    return {
      ...rule,
      hitCount: hits.length,
      sampleFiles: hits.slice(0, sampleLimit),
    };
  });

  const recentFiles: SourceArchiveFileHit[] = [];
  files
    .slice()
    .sort((left, right) => Date.parse(right.lastModified) - Date.parse(left.lastModified))
    .forEach((file) => pushLimited(recentFiles, file, 12));

  return {
    ok: true,
    rootPath,
    rootExists: true,
    generatedAt: new Date().toISOString(),
    totalFiles: files.length,
    totalDirectories,
    totalBytes,
    extensions: Array.from(extensionCounts.entries())
      .map(([extension, count]) => ({ extension, count }))
      .sort((left, right) => right.count - left.count),
    topFolders: Array.from(folderCounts.entries())
      .map(([name, fileCount]) => ({ name, fileCount }))
      .sort((left, right) => right.fileCount - left.fileCount),
    recentFiles,
    tracks,
    message:
      files.length >= maxFilesToScan
        ? `Scan stopped at ${maxFilesToScan} files. Narrow the archive root for a full index.`
        : "Morning Batch source archive scanned for proof-intake candidates.",
  };
}
