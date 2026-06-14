import { defaultStudentProfile, saveStudentProfile } from "@/lib/upsc/studentProfile";

export const upscMasterPassStorageKey = "sarit-upsc-master-pass-v1";
export const upscMasterPassActivatedEvent = "sarit-upsc-master-pass-activated";

export function activateUpscMasterPass(email?: string | null, options: { notify?: boolean } = {}) {
  const activatedAt = new Date().toISOString();
  const profile = saveStudentProfile({
    ...defaultStudentProfile,
    level: "advanced",
    preparationStage: "multiple-attempts",
    studyWindow: "180",
    learningStyle: "mixed",
    weakSignal: "mcq-traps",
    studyTime: "morning",
    attemptHistory: "two-plus-attempts",
    learningPattern: "deep-work",
    mindState: "calm",
    updatedAt: activatedAt,
  });

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      upscMasterPassStorageKey,
      JSON.stringify({
        email: email ?? null,
        activatedAt,
        profileLevel: profile.level,
      })
    );
    if (options.notify ?? true) {
      window.dispatchEvent(new Event(upscMasterPassActivatedEvent));
    }
  }

  return profile;
}
