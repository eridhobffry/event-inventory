"use client";

import Link from "next/link";
import { AlertTriangle, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Item } from "@/lib/api";
import { suggestedReorderQuantity } from "@/lib/utils/inventory";
import { formatCurrency } from "@/lib/utils/formatters";

interface LowStockWidgetProps {
  items: Item[];
  isLoading?: boolean;
}

function needsReorder(item: Item): boolean {
  if (item.reorderPoint === undefined) {
    return false;
  }
  return item.quantity <= item.reorderPoint;
}

export function LowStockWidget({
  items,
  isLoading = false,
}: LowStockWidgetProps) {
  const lowStockItems = items
    .filter(needsReorder)
    .sort((a, b) => {
      const aRatio = a.reorderPoint
        ? a.quantity / a.reorderPoint
        : Number.POSITIVE_INFINITY;
      const bRatio = b.reorderPoint
        ? b.quantity / b.reorderPoint
        : Number.POSITIVE_INFINITY;
      return aRatio - bRatio;
    })
    .slice(0, 5);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
          Low Stock Alerts
        </CardTitle>
        <Link href="/items">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            View Inventory
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : lowStockItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            All par levels look good.
          </p>
        ) : (
          <div className="space-y-3">
            {lowStockItems.map((item) => {
              const reorderQuantity = suggestedReorderQuantity(item);
              return (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="block"
                >
                  <div className="flex flex-col gap-1 rounded-lg border p-3 transition-colors hover:bg-accent">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        {item.supplier?.name && (
                          <p className="text-xs text-muted-foreground truncate">
                            Supplier: {item.supplier.name}
                          </p>
                        )}
                      </div>
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Low stock
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span>
                        Qty: {item.quantity} /{" "}
                        {item.parLevel ?? item.reorderPoint ?? "—"}
                      </span>
                      <span>
                        Reorder point: {item.reorderPoint ?? "—"}
                      </span>
                      <span>
                        Suggested reorder:{" "}
                        {reorderQuantity !== null ? reorderQuantity : "—"}
                      </span>
                      <span>
                        Unit price:{" "}
                        {item.unitPrice
                          ? formatCurrency(Number(item.unitPrice))
                          : "—"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
