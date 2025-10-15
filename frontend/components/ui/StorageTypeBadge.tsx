import { Badge } from "@/components/ui/badge";
import { StorageType } from "@/lib/api";
import { Snowflake, Refrigerator, Package } from "lucide-react";

interface StorageTypeBadgeProps {
  storageType: StorageType;
  showIcon?: boolean;
}

export function StorageTypeBadge({ storageType, showIcon = true }: StorageTypeBadgeProps) {
  const config = {
    DRY: {
      label: "Dry Storage",
      variant: "secondary" as const,
      icon: Package,
      className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    },
    CHILL: {
      label: "Refrigerated",
      variant: "secondary" as const,
      icon: Refrigerator,
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    },
    FREEZE: {
      label: "Frozen",
      variant: "secondary" as const,
      icon: Snowflake,
      className: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    },
  };

  const { label, className, icon: Icon } = config[storageType];

  return (
    <Badge variant="secondary" className={className}>
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {label}
    </Badge>
  );
}
