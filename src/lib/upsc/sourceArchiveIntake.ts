export const defaultUpscSourceArchiveRoot = "D:\\Graphology\\Paid Students\\Mians ready Dec 2025\\Morning Batch";

export type SourceArchiveTrackId =
  | "ir-multilateral"
  | "science-new-domains"
  | "polity-legal-ethics"
  | "environment-current"
  | "geography-maps"
  | "ancient-tn-board"
  | "economy-maintenance"
  | "medieval-reduction";

export type SourceArchiveTrackRule = {
  id: SourceArchiveTrackId;
  label: string;
  decision: "Build from scratch" | "Depth upgrade" | "Patch and tag" | "Maintain" | "Reduce";
  keywords: string[];
  nextAction: string;
};

export type SourceArchiveFileHit = {
  name: string;
  relativePath: string;
  extension: string;
  sizeBytes: number;
  lastModified: string;
};

export type SourceArchiveTrackResult = SourceArchiveTrackRule & {
  hitCount: number;
  sampleFiles: SourceArchiveFileHit[];
};

export type SourceArchiveFolderSummary = {
  name: string;
  fileCount: number;
};

export type SourceArchiveExtensionSummary = {
  extension: string;
  count: number;
};

export type SourceArchiveIntakeResponse = {
  ok: boolean;
  rootPath: string;
  rootExists: boolean;
  generatedAt: string;
  totalFiles: number;
  totalDirectories: number;
  totalBytes: number;
  extensions: SourceArchiveExtensionSummary[];
  topFolders: SourceArchiveFolderSummary[];
  recentFiles: SourceArchiveFileHit[];
  tracks: SourceArchiveTrackResult[];
  message?: string;
};

export const sourceArchiveTrackRules: SourceArchiveTrackRule[] = [
  {
    id: "ir-multilateral",
    label: "IR / Multilateral Bodies",
    decision: "Build from scratch",
    keywords: ["ir", "international", "multilateral", "asean", "bimstec", "g20", "sco", "quad", "united nations"],
    nextAction: "Create source rows before releasing IR body, summit and India-link MCQs.",
  },
  {
    id: "science-new-domains",
    label: "S&T New Domains",
    decision: "Build from scratch",
    keywords: ["science", "technology", "ai", "artificial intelligence", "blockchain", "quantum", "semiconductor", "space"],
    nextAction: "Find candidate files for AI, blockchain, quantum, semiconductor, defence and space capsules.",
  },
  {
    id: "polity-legal-ethics",
    label: "Polity Legal + Ethics",
    decision: "Depth upgrade",
    keywords: ["polity", "constitution", "act", "bill", "supreme court", "judgement", "governance", "ethics"],
    nextAction: "Attach act text, judgement and caselet proof to legal-current MCQ batches.",
  },
  {
    id: "environment-current",
    label: "Environment Current Layer",
    decision: "Patch and tag",
    keywords: ["environment", "species", "biodiversity", "climate", "forest", "wetland", "conservation"],
    nextAction: "Tag report, species and policy files to current-layer environment questions.",
  },
  {
    id: "geography-maps",
    label: "Geography International Map Layer",
    decision: "Patch and tag",
    keywords: ["geography", "map", "atlas", "river", "location", "country", "india map", "geo"],
    nextAction: "Separate static geography strength from the international map-current layer.",
  },
  {
    id: "ancient-tn-board",
    label: "Ancient History TN Board Layer",
    decision: "Depth upgrade",
    keywords: ["ancient", "tn", "tamil nadu", "tamilakam", "sangam", "art and culture", "culture"],
    nextAction: "Confirm Ancient and Art/Culture files that can support TN Board/source-depth traps.",
  },
  {
    id: "economy-maintenance",
    label: "Economy Maintenance Patch",
    decision: "Maintain",
    keywords: ["economy", "bank", "rbi", "bond", "tax", "budget", "irdai", "treds", "finance"],
    nextAction: "Keep regulator and instrument files proof-locked without rebuilding the whole Economy base.",
  },
  {
    id: "medieval-reduction",
    label: "Medieval History Effort Reduction",
    decision: "Reduce",
    keywords: ["medieval", "bhakti", "sufi", "mughal", "sultanate"],
    nextAction: "Keep only a maintenance sheet and reallocate expansion time to IR, S&T and legal-current gaps.",
  },
];
