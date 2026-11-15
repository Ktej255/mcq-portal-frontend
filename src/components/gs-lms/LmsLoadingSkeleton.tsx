interface LmsLoadingSkeletonProps {
  variant: "tree" | "content" | "cards" | "list";
}

export function LmsLoadingSkeleton({ variant }: LmsLoadingSkeletonProps) {
  if (variant === "tree") {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
        <div className="h-5 bg-gray-200 rounded w-1/2 ml-6 animate-pulse" />
        <div className="h-5 bg-gray-200 rounded w-2/3 ml-6 animate-pulse" />
        <div className="h-5 bg-gray-200 rounded w-5/6 animate-pulse" />
      </div>
    );
  }

  if (variant === "content") {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-7 bg-gray-200 rounded w-2/3 animate-pulse" />
        <div className="h-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-24 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div className="grid grid-cols-2 gap-4 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-full animate-pulse" />
        <div className="h-5 bg-gray-200 rounded w-5/6 animate-pulse" />
        <div className="h-5 bg-gray-200 rounded w-4/6 animate-pulse" />
        <div className="h-5 bg-gray-200 rounded w-full animate-pulse" />
        <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
        <div className="h-5 bg-gray-200 rounded w-5/6 animate-pulse" />
      </div>
    );
  }

  throw new Error(`Unsupported loading skeleton variant: ${variant}`);
}
