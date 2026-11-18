export const SUPPORTED_GS_LMS_SUBJECTS = {
  geography: {
    slug: "geography",
    label: "Geography",
  },
} as const;

export type SupportedGsLmsSubject = keyof typeof SUPPORTED_GS_LMS_SUBJECTS;
export type SupportedGsLmsSubjectConfig =
  (typeof SUPPORTED_GS_LMS_SUBJECTS)[SupportedGsLmsSubject];

export function getSupportedGsLmsSubject(
  value: string | string[] | null | undefined,
): SupportedGsLmsSubjectConfig | null {
  if (typeof value !== "string") return null;
  return Object.prototype.hasOwnProperty.call(SUPPORTED_GS_LMS_SUBJECTS, value)
    ? SUPPORTED_GS_LMS_SUBJECTS[value as SupportedGsLmsSubject]
    : null;
}

export function lmsBaseForSlug(subject: SupportedGsLmsSubject): string {
  return `/upsc/${subject}/lms`;
}

export function parsePositiveRouteId(
  value: string | string[] | null | undefined,
): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}
