import { Badge } from "@/components/ui/badge";

type ItemStatus = "AVAILABLE" | "RESERVED" | "OUT_OF_STOCK" | "MAINTENANCE" | "DAMAGED" | "RETIRED";

interface StatusBadgeProps {
  status: ItemStatus;
  className?: string;
}

const statusConfig: Record<ItemStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  AVAILABLE: {
    label: "Available",
    variant: "default",
  },
  RESERVED: {
    label: "Reserved",
    variant: "secondary",
  },
  OUT_OF_STOCK: {
    label: "Out of Stock",
    variant: "destructive",
  },
  MAINTENANCE: {
    label: "Maintenance",
    variant: "outline",
  },
  DAMAGED: {
    label: "Damaged",
    variant: "destructive",
  },
  RETIRED: {
    label: "Retired",
    variant: "outline",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status || "Unknown",
    variant: "outline" as const,
  };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
