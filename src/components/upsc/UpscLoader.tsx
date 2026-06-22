/**
 * Shared loading state for the student UPSC section.
 * Replaces the three different ad-hoc loaders (shell spinner, mission-control
 * box, subject rooms) with one warm-palette spinner.
 */
export function UpscLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#f7f4ee]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#1a3a2a]" />
        <p className="animate-pulse text-sm font-semibold text-[#5d675f]">{message}</p>
      </div>
    </div>
  );
}
