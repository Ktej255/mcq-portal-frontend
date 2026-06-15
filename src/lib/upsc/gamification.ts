import { readStudentProfile, saveStudentProfile, type StudentProfile } from "./studentProfile";

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji representing the badge
  color: string; // Tailored color code (e.g. border/text HSL or hex)
}

export const BADGE_DEFINITIONS: Record<string, BadgeDefinition> = {
  "onboarding-complete": {
    id: "onboarding-complete",
    title: "First Steps",
    description: "Successfully completed the UPSC onboarding orientation and custom roadmap setup.",
    icon: "🗺️",
    color: "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]",
  },
  "first-recall-clear": {
    id: "first-recall-clear",
    title: "Feynman Apprentice",
    description: "Successfully cleared your first speech-recall gate with the AI Teacher.",
    icon: "🗣️",
    color: "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]",
  },
  "perfect-mcq": {
    id: "perfect-mcq",
    title: "Trap Dodger",
    description: "Achieved a perfect 100% score on a core UPSC MCQ statement evaluation.",
    icon: "🎯",
    color: "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]",
  },
  "retro-complete": {
    id: "retro-complete",
    title: "Insight Builder",
    description: "Completed your first Sunday AI-Guided Retrospective, saving reasoning patterns.",
    icon: "📝",
    color: "border-[#3b82f6] bg-[#dbeafe] text-[#1e40af]",
  },
  "streak-3": {
    id: "streak-3",
    title: "Consistent Catalyst",
    description: "Maintained a 3-day study and active recall command streak.",
    icon: "🔥",
    color: "border-[#a855f7] bg-[#f3e8ff] text-[#6b21a8]",
  },
  "streak-7": {
    id: "streak-7",
    title: "Grit Commander",
    description: "Maintained a 7-day study streak, bypassing family/health buffer delays.",
    icon: "👑",
    color: "border-[#3b82f6] bg-[#dbeafe] text-[#1e40af]",
  },
};

export interface EarnResult {
  addedPoints: number;
  addedCoins: number;
  unlockedBadge?: BadgeDefinition;
  profile: StudentProfile;
}

/**
 * Awards points and coins to the student and checks for new badge unlocks.
 */
export function awardGamificationRewards(
  action: "onboarding" | "recall-clear" | "mcq-complete" | "perfect-score" | "written-upload" | "streak-3" | "streak-7" | "retro-complete"
): EarnResult {
  const profile = readStudentProfile() || {
    level: "beginner",
    preparationStage: "not-started",
    studyWindow: "120",
    learningStyle: "mixed",
    weakSignal: "retention",
    studyTime: "morning",
    attemptHistory: "no-attempt",
    learningPattern: "deep-work",
    mindState: "calm",
    updatedAt: new Date().toISOString(),
    points: 0,
    coins: 0,
    unlockedBadges: [],
  } as any;

  let addedPoints = 0;
  let addedCoins = 0;
  let badgeIdToUnlock: string | null = null;

  switch (action) {
    case "onboarding":
      addedPoints = 100;
      addedCoins = 20;
      badgeIdToUnlock = "onboarding-complete";
      break;
    case "recall-clear":
      addedPoints = 50;
      addedCoins = 10;
      badgeIdToUnlock = "first-recall-clear";
      break;
    case "mcq-complete":
      addedPoints = 40;
      addedCoins = 8;
      break;
    case "perfect-score":
      addedPoints = 100;
      addedCoins = 20;
      badgeIdToUnlock = "perfect-mcq";
      break;
    case "written-upload":
      addedPoints = 60;
      addedCoins = 12;
      break;
    case "retro-complete":
      addedPoints = 80;
      addedCoins = 15;
      badgeIdToUnlock = "retro-complete";
      break;
    case "streak-3":
      addedPoints = 150;
      addedCoins = 30;
      badgeIdToUnlock = "streak-3";
      break;
    case "streak-7":
      addedPoints = 400;
      addedCoins = 80;
      badgeIdToUnlock = "streak-7";
      break;
  }

  // Update numbers
  const currentPoints = profile.points || 0;
  const currentCoins = profile.coins || 0;
  const unlockedBadges = profile.unlockedBadges || [];

  const nextPoints = currentPoints + addedPoints;
  const nextCoins = currentCoins + addedCoins;
  let unlockedBadge: BadgeDefinition | undefined = undefined;

  const updatedBadges = [...unlockedBadges];
  if (badgeIdToUnlock && !unlockedBadges.includes(badgeIdToUnlock)) {
    updatedBadges.push(badgeIdToUnlock);
    unlockedBadge = BADGE_DEFINITIONS[badgeIdToUnlock];
  }

  const updatedProfile: StudentProfile = {
    ...profile,
    points: nextPoints,
    coins: nextCoins,
    unlockedBadges: updatedBadges,
    updatedAt: new Date().toISOString(),
  } as any;

  // Persist updated profile
  saveStudentProfile(updatedProfile);

  return {
    addedPoints,
    addedCoins,
    unlockedBadge,
    profile: updatedProfile,
  };
}
