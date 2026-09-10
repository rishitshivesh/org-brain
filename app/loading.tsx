import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-full bg-background/40">
      <div className="border-b bg-background/70 px-5 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-[1680px] space-y-3">
          <Skeleton className="h-6 w-28 rounded-md" />
          <Skeleton className="h-9 w-56 rounded-lg" />
          <Skeleton className="h-4 w-full max-w-xl rounded" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1680px] space-y-5 p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-56 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
