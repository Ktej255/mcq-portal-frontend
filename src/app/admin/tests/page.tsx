import { IsolatedAdminSurface } from "@/components/admin/IsolatedAdminSurface";

export default function AdminTests() {
  return (
    <IsolatedAdminSurface
      title="Legacy Test Management"
      eyebrow="Legacy test management is not exposed for the Geography pilot"
      detail="The original MCQ portal test-management route remains available for internal review only. The June Geography path uses day-specific fresh MCQ readiness and quality gates instead of the legacy batch workflow."
      dependency="A founder decision on whether the legacy exam backend belongs in the public UPSC product."
      retainedFor="Internal inspection while the fresh UPSC MCQ command path becomes the student-facing standard."
      testId="admin-tests-isolated"
    />
  );
}
