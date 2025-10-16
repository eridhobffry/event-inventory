import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Item } from "@/lib/api";

type SemanticResult = {
  item: Item;
  similarityScore?: number;
  reasoning?: string;
};

type SemanticResultCardProps = SemanticResult & {
  onSelect?: (item: Item) => void;
  className?: string;
};

const CONFIDENCE_LABELS = [
  { min: 0.85, label: "Excellent match", color: "bg-emerald-500" },
  { min: 0.7, label: "Good match", color: "bg-amber-500" },
  { min: 0, label: "Possible match", color: "bg-slate-400" },
];

function getConfidenceLabel(score: number | undefined) {
  if (score === undefined || Number.isNaN(score)) {
    return { label: "Suggested result", color: "bg-slate-300" };
  }

  const tier =
    CONFIDENCE_LABELS.find((entry) => score >= entry.min) ??
    CONFIDENCE_LABELS[CONFIDENCE_LABELS.length - 1];

  return {
    label: tier.label,
    color: tier.color,
  };
}

export function SemanticResultCard({
  item,
  similarityScore,
  reasoning,
  onSelect,
  className,
}: SemanticResultCardProps) {
  const { label, color } = getConfidenceLabel(similarityScore ?? undefined);

  const formattedScore =
    similarityScore !== undefined
      ? `${Math.round(similarityScore * 100)}% match`
      : undefined;

  const content = (
    <Card
      role="button"
      tabIndex={0}
      className={cn(
        "relative flex cursor-pointer flex-col gap-3 border border-border/80 shadow-sm transition hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className,
      )}
      onClick={() => onSelect?.(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(item);
        }
      }}
    >
      <CardContent className="space-y-2 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="font-semibold leading-tight">{item.name}</div>
            <div className="text-sm text-muted-foreground">
              SKU: {item.sku || "N/A"}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant="secondary"
              className={cn(
                "flex items-center gap-1 text-xs font-medium text-white",
                color,
              )}
            >
              {label}
            </Badge>
            {formattedScore ? (
              <span className="text-xs text-muted-foreground">
                {formattedScore}
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">Category:</span>{" "}
            {item.category?.replace(/_/g, " ") || "N/A"}
          </div>
          <div>
            <span className="font-medium text-foreground">Status:</span>{" "}
            {item.status?.replace(/_/g, " ") || "N/A"}
          </div>
          <div>
            <span className="font-medium text-foreground">Location:</span>{" "}
            {item.location || "Not specified"}
          </div>
          <div>
            <span className="font-medium text-foreground">Quantity:</span>{" "}
            {item.quantity} {item.unitOfMeasure?.toLowerCase() || "units"}
          </div>
        </div>

        {item.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {item.description}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );

  if (!reasoning && similarityScore === undefined) {
    return content;
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm leading-relaxed">
          {formattedScore ? (
            <div className="font-medium text-foreground">
              {formattedScore}
            </div>
          ) : null}
          {reasoning ? <p className="mt-1 text-muted-foreground">{reasoning}</p> : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
