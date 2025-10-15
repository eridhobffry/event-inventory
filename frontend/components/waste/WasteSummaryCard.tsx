import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WasteSummary } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";
import { getWasteReasonLabel } from "@/lib/utils/inventory";
import { TrendingDown, DollarSign, AlertCircle } from "lucide-react";

interface WasteSummaryCardProps {
  summary: WasteSummary;
  period?: string;
}

const reasonColors: Record<string, string> = {
  SPOILAGE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  OVERPRODUCTION: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  DAMAGE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  CONTAMINATION: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export function WasteSummaryCard({ summary, period = "30 days" }: WasteSummaryCardProps) {
  const topReason = summary.wasteByReason[0];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Overall Statistics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Waste</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(summary.totalWaste)}</div>
          <p className="text-xs text-muted-foreground">items in last {period}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cost Impact</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(summary.totalCostImpact)}
          </div>
          <p className="text-xs text-muted-foreground">total loss in last {period}</p>
        </CardContent>
      </Card>

      {/* Waste by Reason */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Waste by Reason</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.wasteByReason.length === 0 ? (
            <p className="text-sm text-muted-foreground">No waste data available</p>
          ) : (
            <div className="space-y-3">
              {summary.wasteByReason.map((item) => {
                const percentage =
                  summary.totalWaste > 0 ? (item.quantity / summary.totalWaste) * 100 : 0;

                return (
                  <div key={item.reason} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={reasonColors[item.reason] || reasonColors.OTHER}
                        >
                          {getWasteReasonLabel(item.reason)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {item.count} {item.count === 1 ? "incident" : "incidents"}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatNumber(item.quantity)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(item.costImpact)}
                        </div>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 dark:bg-red-600"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Wasted Items */}
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <CardTitle className="text-base">Top Wasted Items</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {summary.topWastedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No waste data available</p>
          ) : (
            <div className="space-y-3">
              {summary.topWastedItems.slice(0, 5).map((item, index) => (
                <div key={item.itemId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.itemName}</p>
                      <p className="text-xs text-muted-foreground">SKU: {item.itemSku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatNumber(item.totalQuantity)}</div>
                    <div className="text-xs text-red-600 dark:text-red-400">
                      {formatCurrency(item.totalCostImpact)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
