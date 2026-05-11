import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function ExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-background">
        {children}
      </div>
    </ProtectedRoute>
  );
}
