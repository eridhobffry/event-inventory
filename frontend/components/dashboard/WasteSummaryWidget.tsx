"use client";

import Link from "next/link";
import { Loader2, Trash2, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WasteSummary } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";

interface WasteSummaryWidgetProps {
  summary: WasteSummary | null;
  isLoading?: boolean;
}

export function WasteSummaryWidget({
  summary,
  isLoading = false,
}: WasteSummaryWidgetProps) {
  const hasData = !!summary && summary.totalWaste > 0;
  const topReason = summary?.wasteByReason[0];
  const topItem = summary?.topWastedItems[0];

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-muted-foreground" />
          Waste (30 Days)
        </CardTitle>
        <Link href="/waste">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            Review Logs
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading waste summary...</span>
          </div>
        ) : !hasData ? (
          <p className="text-sm text-muted-foreground">
            No waste recorded in the last 30 days.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Total Waste</p>
                <p className="text-xl font-semibold">
                  {formatNumber(summary!.totalWaste)}
                </p>
                <p className="text-xs text-muted-foreground">
                  units discarded
                </p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Cost Impact</p>
                <p className="text-xl font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(summary!.totalCostImpact)}
                </p>
                <p className="text-xs text-muted-foreground">
                  estimated loss
                </p>
              </div>
            </div>

            {topReason && (
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                  Top Reason: {topReason.reason}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatNumber(topReason.quantity)} units (
                  {formatCurrency(topReason.costImpact)}) across{" "}
                  {topReason.count} entries
                </p>
              </div>
            )}

            {topItem && (
              <div className="rounded-lg border p-3 text-sm">
                <div className="font-medium">{topItem.itemName}</div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(topItem.totalQuantity)} units •{" "}
                  {formatCurrency(topItem.totalCostImpact)} impact
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
