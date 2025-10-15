import { WasteLog, WasteSummary } from "@/lib/api";

export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function createEmptyWasteSummary(): WasteSummary {
  return {
    totalWaste: 0,
    totalCostImpact: 0,
    wasteByReason: [],
    topWastedItems: [],
  };
}

export function buildWasteSummary(logs: WasteLog[]): WasteSummary {
  if (logs.length === 0) {
    return createEmptyWasteSummary();
  }

  let totalWaste = 0;
  let totalCostImpact = 0;

  const wasteByReasonMap = new Map<
    WasteSummary["wasteByReason"][number]["reason"],
    {
      reason: WasteSummary["wasteByReason"][number]["reason"];
      quantity: number;
      costImpact: number;
      count: number;
    }
  >();

  const wasteByItemMap = new Map<
    string,
    {
      itemId: string;
      itemName: string;
      itemSku: string;
      totalQuantity: number;
      totalCostImpact: number;
    }
  >();

  for (const log of logs) {
    totalWaste += log.quantity;
    totalCostImpact += log.costImpact ?? 0;

    const currentReason = wasteByReasonMap.get(log.reason) ?? {
      reason: log.reason,
      quantity: 0,
      costImpact: 0,
      count: 0,
    };

    currentReason.quantity += log.quantity;
    currentReason.costImpact += log.costImpact ?? 0;
    currentReason.count += 1;
    wasteByReasonMap.set(log.reason, currentReason);

    const itemId = log.itemId;
    const itemName = log.item?.name ?? "Unknown Item";
    const itemSku = log.item?.sku ?? "—";

    const currentItem = wasteByItemMap.get(itemId) ?? {
      itemId,
      itemName,
      itemSku,
      totalQuantity: 0,
      totalCostImpact: 0,
    };

    currentItem.totalQuantity += log.quantity;
    currentItem.totalCostImpact += log.costImpact ?? 0;
    wasteByItemMap.set(itemId, currentItem);
  }

  const wasteByReason = Array.from(wasteByReasonMap.values()).sort(
    (a, b) => b.quantity - a.quantity
  );

  const topWastedItems = Array.from(wasteByItemMap.values())
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 10);

  return {
    totalWaste,
    totalCostImpact,
    wasteByReason: wasteByReason.map((entry) => ({
      reason: entry.reason,
      quantity: entry.quantity,
      costImpact: entry.costImpact,
      count: entry.count,
    })),
    topWastedItems: topWastedItems.map((entry) => ({
      itemId: entry.itemId,
      itemName: entry.itemName,
      itemSku: entry.itemSku,
      totalQuantity: entry.totalQuantity,
      totalCostImpact: entry.totalCostImpact,
    })),
  };
}
