import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SemanticResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="h-full">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-3 w-16 rounded-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
