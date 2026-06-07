import { IsolatedAdminSurface } from "@/components/admin/IsolatedAdminSurface";

export default function ObservabilityPage() {
  return (
    <IsolatedAdminSurface
      title="Legacy Observability"
      eyebrow="Live telemetry is not part of the June Geography pilot"
      detail="The previous trace, job, metric, and governance UI is retained as an internal prototype. It no longer polls unavailable backend endpoints or presents an empty live dashboard as if telemetry were connected."
      dependency="A deliberate observability backend decision, authenticated API endpoints, and a verified deployment target."
      retainedFor="Future infrastructure work after the live Geography identity and continuity boundary is closed."
      testId="admin-observability-isolated"
    />
  );
}
