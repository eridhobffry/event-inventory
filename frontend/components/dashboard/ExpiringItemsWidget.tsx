"use client";

import Link from "next/link";
import { Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Item } from "@/lib/api";
import { daysUntilExpiry, formatDate } from "@/lib/utils/date";

interface ExpiringItemsWidgetProps {
  items: Item[];
  isLoading?: boolean;
}

export function ExpiringItemsWidget({
  items,
  isLoading = false,
}: ExpiringItemsWidgetProps) {
  const expiringItems = items
    .flatMap((item) => {
      const openBatches =
        item.batches?.filter(
          (batch) => batch.isOpen && batch.expirationDate
        ) ?? [];

      if (openBatches.length === 0) {
        return [];
      }

      const sortedBatches = [...openBatches].sort((a, b) => {
        const aDays = daysUntilExpiry(a.expirationDate!);
        const bDays = daysUntilExpiry(b.expirationDate!);
        return aDays - bDays;
      });

      const soonestBatch = sortedBatches[0];
      const daysRemaining = daysUntilExpiry(soonestBatch.expirationDate!);

      if (daysRemaining < 0 || daysRemaining > 7) {
        return [];
      }

      return [
        {
          item,
          batch: soonestBatch,
          daysRemaining,
        },
      ];
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 5);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Expiring Soon
        </CardTitle>
        <Link href="/items">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : expiringItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No items expiring in the next 7 days.
          </p>
        ) : (
          <div className="space-y-3">
            {expiringItems.map(({ item, batch, daysRemaining }) => (
              <Link
                key={batch.id}
                href={`/items/${item.id}`}
                className="block"
              >
                <div className="flex flex-col gap-1 rounded-lg border p-3 transition-colors hover:bg-accent">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Lot {batch.lotNumber || batch.id.slice(0, 8)} •{" "}
                        {formatDate(batch.expirationDate!)}
                      </p>
                    </div>
                    <Badge
                      variant={daysRemaining <= 3 ? "destructive" : "secondary"}
                      className="flex items-center gap-1"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {daysRemaining <= 0
                        ? "Expires today"
                        : `${daysRemaining} day${
                            daysRemaining === 1 ? "" : "s"
                          }`}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Qty: {batch.quantity} / {batch.initialQuantity}{" "}
                      {item.unitOfMeasure.toLowerCase()}
                    </span>
                    {item.supplier?.name && (
                      <span>Supplier: {item.supplier.name}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
