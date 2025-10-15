"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Item } from "@/lib/api";

interface SupplierPerformanceWidgetProps {
  items: Item[];
  isLoading?: boolean;
}

export function SupplierPerformanceWidget({
  items,
  isLoading = false,
}: SupplierPerformanceWidgetProps) {
  const supplierStats = items.reduce<
    Record<
      string,
      {
        supplierName: string;
        itemCount: number;
        perishableCount: number;
        totalQuantity: number;
      }
    >
  >((acc, item) => {
    const key = item.supplier?.id || "unassigned";
    const name = item.supplier?.name || "Unassigned";

    if (!acc[key]) {
      acc[key] = {
        supplierName: name,
        itemCount: 0,
        perishableCount: 0,
        totalQuantity: 0,
      };
    }

    acc[key].itemCount += 1;
    acc[key].totalQuantity += item.quantity;
    if (item.isPerishable) {
      acc[key].perishableCount += 1;
    }

    return acc;
  }, {});

  const sortedSuppliers = Object.values(supplierStats)
    .sort((a, b) => b.itemCount - a.itemCount)
    .slice(0, 5);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          Supplier Performance
        </CardTitle>
        <Link href="/suppliers">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            Manage Suppliers
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : sortedSuppliers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No suppliers linked to inventory items yet.
          </p>
        ) : (
          <div className="space-y-3">
            {sortedSuppliers.map((supplier) => {
              const perishableRatio =
                supplier.itemCount > 0
                  ? Math.round(
                      (supplier.perishableCount / supplier.itemCount) * 100
                    )
                  : 0;

              return (
                <div
                  key={supplier.supplierName}
                  className="rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{supplier.supplierName}</p>
                      <p className="text-xs text-muted-foreground">
                        {supplier.itemCount} item
                        {supplier.itemCount === 1 ? "" : "s"} •{" "}
                        {supplier.totalQuantity} units
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {perishableRatio}% perishable mix
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
