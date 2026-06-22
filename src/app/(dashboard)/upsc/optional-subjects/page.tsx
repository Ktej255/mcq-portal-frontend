import { OptionalCatalog } from "@/components/upsc/OptionalCatalog";

/**
 * Optional-subjects catalog route (R1.2): all 25 UPSC optionals with
 * completeness status and subject-selection persistence (spec task 5.2).
 *
 * Replaces the older bespoke `OptionalSubjectsCatalog` here. GS Geography at
 * `/upsc/geography` is untouched; this route lives only under
 * `/upsc/optional-subjects`.
 */
export default function OptionalSubjectsPage() {
  return <OptionalCatalog />;
}
