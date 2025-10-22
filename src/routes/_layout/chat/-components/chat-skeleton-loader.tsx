import { cn } from "@/lib/utils";

export const ChatSkeletonLoader = () => {
  return (
    <div className="shimmer flex h-full w-full">
      {/* Center Chat Area */}
      <div className="flex w-full flex-col items-center justify-between px-4 py-6">
        {/* Chat messages skeleton */}
        <div className="flex w-full flex-1 flex-col gap-8 overflow-y-auto">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-14 rounded-md",
                i % 2 === 0
                  ? "w-2/3 self-start bg-secondary"
                  : "w-1/2 self-end bg-muted-foreground/20",
              )}
            />
          ))}
        </div>
        {/* Input box skeleton */}
        <div className="mt-4 flex w-full items-center gap-2">
          <div className="h-10 flex-1 rounded-lg bg-gray-200" />
          <div className="h-10 w-10 rounded-lg bg-gray-300" />
        </div>
      </div>
    </div>
  );
};
