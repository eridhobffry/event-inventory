import { Badge } from "@/components/ui/badge";
import { getExpiryStatus } from "@/lib/utils/date";
import { AlertCircle, AlertTriangle, Clock } from "lucide-react";

interface BatchExpiryBadgeProps {
  expirationDate: string;
  showIcon?: boolean;
}

export function BatchExpiryBadge({ expirationDate, showIcon = true }: BatchExpiryBadgeProps) {
  const { status, message } = getExpiryStatus(expirationDate);

  const config = {
    expired: {
      variant: "destructive" as const,
      icon: AlertCircle,
      className: "bg-red-500 text-white",
    },
    critical: {
      variant: "destructive" as const,
      icon: AlertTriangle,
      className: "bg-red-500 text-white",
    },
    warning: {
      variant: "secondary" as const,
      icon: Clock,
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    },
    good: {
      variant: "secondary" as const,
      icon: Clock,
      className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    },
  };

  const { variant, icon: Icon, className } = config[status];

  return (
    <Badge variant={variant} className={className}>
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {message}
    </Badge>
  );
}
