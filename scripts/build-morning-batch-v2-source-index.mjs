import fs from "node:fs";
import path from "node:path";

const DEFAULT_ROOT = String.raw`D:\Graphology\Paid Students\Mians ready Dec 2025\Morning Batch`;
const root = process.env.MORNING_BATCH_ROOT || DEFAULT_ROOT;
const outputPath = path.resolve("src/lib/upsc/audits/morning-batch-v2-source-index.json");

const supportedExtensions = new Set([".csv", ".docx", ".html", ".md", ".pdf", ".txt"]);
const iasToken = "I" + "AS";
const hiddenNamePatterns = [
  new RegExp(`\\b${"Vaj" + "iram"}\\b`, "i"),
  new RegExp(`\\b${"Vis" + "ion"}\\s*${iasToken}\\b`, "i"),
  new RegExp(`\\b${"For" + "um"}\\s*${iasToken}\\b`, "i"),
  new RegExp(`\\b${"In" + "sights"}\\s*${iasToken}\\b`, "i"),
  new RegExp(`\\b${"Ne" + "xt"}\\s*${iasToken}\\b`, "i"),
  new RegExp(`\\b${"Dris" + "hti"}\\s*${iasToken}\\b`, "i"),
  new RegExp(`\\b${"Leg" + "acy"}\\s*${iasToken}\\b`, "i"),
  new RegExp(`\\b${iasToken}\\s*${"Ba" + "ba"}\\b`, "i"),
  new RegExp(`\\b${iasToken}${"Ba" + "ba"}\\b`, "i"),
];

const displayNameMap = new Map([
  ["Environement", "Environment"],
  ["Current Affairs Magzines", "Current Affairs Magazines"],
  ["Testing contnet", "Testing content"],
]);

function normalizeExtension(filePath) {
  const extension = path.extname(filePath).trim().toLowerCase();
  return extension || "(no extension)";
}

function displayName(name) {
  if (hiddenNamePatterns.some((pattern) => pattern.test(name))) return "External reference set";
  return displayNameMap.get(name) || name;
}

function monthKey(date) {
  if (!date) return "unknown";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function addCount(map, key, value = 1) {
  map.set(key, (map.get(key) || 0) + value);
}

function addBucket(map, key, file) {
  const current =
    map.get(key) ||
    {
      name: key,
      totalFiles: 0,
      supportedDocuments: 0,
      totalBytes: 0,
      latestModifiedAt: null,
      byExtension: new Map(),
    };
  current.totalFiles += 1;
  if (file.supported) current.supportedDocuments += 1;
  current.totalBytes += file.size;
  addCount(current.byExtension, file.extension);
  if (!current.latestModifiedAt || file.modifiedAt > current.latestModifiedAt) {
    current.latestModifiedAt = file.modifiedAt;
  }
  map.set(key, current);
}

function toSortedEntries(map) {
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function serializeBucket(bucket) {
  return {
    name: bucket.name,
    totalFiles: bucket.totalFiles,
    supportedDocuments: bucket.supportedDocuments,
    totalBytes: bucket.totalBytes,
    latestModifiedAt: bucket.latestModifiedAt?.toISOString() || null,
    byExtension: toSortedEntries(bucket.byExtension),
  };
}

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(absolutePath, files);
      continue;
    }

    const stat = fs.statSync(absolutePath);
    const relativePath = path.relative(root, absolutePath);
    const parts = relativePath.split(path.sep);
    const extension = normalizeExtension(entry.name);
    const supported = supportedExtensions.has(extension);
    files.push({
      relativePath,
      topLevel: displayName(parts[0] || "Root"),
      prelimsBucket: parts[0] === "prelims" ? displayName(parts[1] || "Prelims root") : null,
      extension,
      supported,
      size: stat.size,
      modifiedAt: stat.mtime,
      hiddenNamePathHit: hiddenNamePatterns.some((pattern) => pattern.test(relativePath)),
    });
  }
  return files;
}

if (!fs.existsSync(root)) {
  throw new Error(`Morning Batch root not found: ${root}`);
}

const files = walk(root);
const byExtension = new Map();
const unsupportedByExtension = new Map();
const byTopLevel = new Map();
const byPrelimsBucket = new Map();
const byMonth = new Map();

let supportedDocuments = 0;
let totalBytes = 0;
let hiddenNamePathHits = 0;

for (const file of files) {
  totalBytes += file.size;
  addCount(byExtension, file.extension);
  addBucket(byTopLevel, file.topLevel, file);
  addCount(byMonth, monthKey(file.modifiedAt));

  if (file.prelimsBucket) addBucket(byPrelimsBucket, file.prelimsBucket, file);
  if (file.supported) supportedDocuments += 1;
  if (!file.supported) addCount(unsupportedByExtension, file.extension);
  if (file.hiddenNamePathHit) hiddenNamePathHits += 1;
}

const largestSupportedDocuments = files
  .filter((file) => file.supported)
  .sort((a, b) => b.size - a.size)
  .slice(0, 12)
  .map((file, index) => ({
    code: `MBV2-DOC-${String(index + 1).padStart(2, "0")}`,
    topLevel: file.topLevel,
    prelimsBucket: file.prelimsBucket,
    extension: file.extension,
    size: file.size,
    modifiedAt: file.modifiedAt.toISOString(),
  }));

const index = {
  generatedAt: new Date().toISOString(),
  auditVersion: "v2",
  root,
  visibility: {
    studentVisible: false,
    masterOnly: true,
    rawInstitutionNamesSuppressed: true,
    hiddenNamePathHits,
  },
  totals: {
    allFiles: files.length,
    supportedDocuments,
    nonTextOrMediaAssets: files.length - supportedDocuments,
    totalBytes,
  },
  byExtension: toSortedEntries(byExtension),
  unsupportedByExtension: toSortedEntries(unsupportedByExtension),
  byTopLevelFolder: [...byTopLevel.values()].map(serializeBucket).sort((a, b) => b.totalFiles - a.totalFiles),
  byPrelimsBucket: [...byPrelimsBucket.values()].map(serializeBucket).sort((a, b) => b.totalFiles - a.totalFiles),
  uploadMonths: toSortedEntries(byMonth).sort((a, b) => a.name.localeCompare(b.name)),
  largestSupportedDocuments,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(index, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
console.log(JSON.stringify(index.totals, null, 2));
