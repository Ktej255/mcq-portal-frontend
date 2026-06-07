import { IsolatedAdminSurface } from "@/components/admin/IsolatedAdminSurface";

export default function AdminAnalytics() {
  return (
    <IsolatedAdminSurface
      title="Student Analytics"
      eyebrow="Analytics stays isolated until real student evidence exists"
      detail="The route is reserved for future learner analytics. It intentionally avoids sample charts or placeholder performance percentages before the controlled Geography tester wave produces verified receipts."
      dependency="Live authenticated learner events, cross-session progress sync, and a completed controlled tester wave."
      retainedFor="Real Geography learning-gap, revision, and progression analytics after the first live evidence cycle."
      testId="admin-analytics-isolated"
    />
  );
}
