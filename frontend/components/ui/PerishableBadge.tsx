import { Badge } from "@/components/ui/badge";
import { Leaf, Wine } from "lucide-react";

interface PerishableBadgeProps {
  isPerishable?: boolean;
  isAlcohol?: boolean;
  showIcon?: boolean;
}

export function PerishableBadge({ isPerishable, isAlcohol, showIcon = true }: PerishableBadgeProps) {
  if (!isPerishable && !isAlcohol) return null;

  return (
    <div className="flex gap-1">
      {isPerishable && (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        >
          {showIcon && <Leaf className="mr-1 h-3 w-3" />}
          Perishable
        </Badge>
      )}
      {isAlcohol && (
        <Badge
          variant="secondary"
          className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
        >
          {showIcon && <Wine className="mr-1 h-3 w-3" />}
          Alcohol
        </Badge>
      )}
    </div>
  );
}
