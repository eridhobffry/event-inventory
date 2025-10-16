import type { ComponentType } from "react";
import { CircleCheck, MapPin, PackageSearch, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type QueryTokenType = "category" | "status" | "location" | "keyword";

export type QueryToken = {
  type: QueryTokenType;
  label: string;
  value: string;
};

type QueryParseDisplayProps = {
  tokens: QueryToken[];
  className?: string;
};

const TYPE_CONFIG: Record<
  QueryTokenType,
  { icon: ComponentType<{ className?: string }>; variant: "default" | "secondary" | "outline" }
> = {
  category: { icon: Tag, variant: "secondary" },
  status: { icon: CircleCheck, variant: "default" },
  location: { icon: MapPin, variant: "outline" },
  keyword: { icon: PackageSearch, variant: "outline" },
};

export function QueryParseDisplay({ tokens, className }: QueryParseDisplayProps) {
  if (!tokens.length) return null;

  return (
    <div
      className={cn(
        "mb-6 rounded-lg border border-border/80 bg-muted/30 p-4 text-sm shadow-sm",
        className,
      )}
    >
      <p className="mb-3 font-medium text-foreground">AI understood:</p>
      <div className="flex flex-wrap gap-2">
        {tokens.map((token) => {
          const config = TYPE_CONFIG[token.type];
          const Icon = config.icon;
          return (
            <Badge
              key={`${token.type}-${token.value}`}
              variant={config.variant}
              className="flex items-center gap-1.5 whitespace-nowrap text-xs"
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="font-medium">{token.label}:</span>
              <span className="uppercase tracking-wide">{token.value}</span>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
