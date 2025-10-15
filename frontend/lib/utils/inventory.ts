/**
 * Inventory utility functions
 */

import { Item } from "@/lib/api";

/**
 * Check if item is below reorder point
 */
export function isBelowReorderPoint(item: Item): boolean {
  if (!item.reorderPoint) return false;
  return item.quantity <= item.reorderPoint;
}

/**
 * Check if item needs restocking
 */
export function needsRestocking(item: Item): boolean {
  if (!item.parLevel) return false;
  return item.quantity < item.parLevel;
}

/**
 * Calculate suggested reorder quantity
 */
export function suggestedReorderQuantity(item: Item): number | null {
  if (!item.parLevel) return null;
  const deficit = item.parLevel - item.quantity;
  return Math.max(0, deficit);
}

/**
 * Get stock level status
 */
export function getStockStatus(item: Item): {
  status: "out_of_stock" | "critical" | "low" | "adequate" | "overstocked";
  message: string;
  percentage: number;
} {
  const { quantity, parLevel, reorderPoint } = item;

  if (quantity === 0) {
    return {
      status: "out_of_stock",
      message: "Out of stock",
      percentage: 0,
    };
  }

  if (reorderPoint && quantity <= reorderPoint) {
    const percentage = parLevel ? (quantity / parLevel) * 100 : 0;
    return {
      status: "critical",
      message: "Below reorder point",
      percentage,
    };
  }

  if (parLevel) {
    const percentage = (quantity / parLevel) * 100;

    if (quantity < parLevel * 0.5) {
      return {
        status: "low",
        message: "Low stock",
        percentage,
      };
    } else if (quantity >= parLevel * 1.5) {
      return {
        status: "overstocked",
        message: "Overstocked",
        percentage,
      };
    } else {
      return {
        status: "adequate",
        message: "Adequate stock",
        percentage,
      };
    }
  }

  return {
    status: "adequate",
    message: "In stock",
    percentage: 100,
  };
}

/**
 * Calculate waste cost impact
 */
export function calculateWasteCost(quantity: number, unitPrice?: number): number {
  if (!unitPrice) return 0;
  return quantity * unitPrice;
}

/**
 * Get allergen display names
 */
export const allergenLabels: Record<string, string> = {
  DAIRY: "Dairy",
  NUTS: "Tree Nuts",
  PEANUTS: "Peanuts",
  GLUTEN: "Gluten",
  WHEAT: "Wheat",
  SOY: "Soy",
  EGGS: "Eggs",
  FISH: "Fish",
  SHELLFISH: "Shellfish",
  SESAME: "Sesame",
  SULFITES: "Sulfites",
  MUSTARD: "Mustard",
  CELERY: "Celery",
  LUPIN: "Lupin",
};

/**
 * Format allergens for display
 */
export function formatAllergens(allergens: string[]): string {
  if (allergens.length === 0) return "None";
  return allergens.map((a) => allergenLabels[a] || a).join(", ");
}

/**
 * Get storage type label
 */
export function getStorageTypeLabel(storageType: string): string {
  const labels: Record<string, string> = {
    DRY: "Dry Storage",
    CHILL: "Refrigerated (0-5°C)",
    FREEZE: "Frozen (-18°C or below)",
  };
  return labels[storageType] || storageType;
}

/**
 * Get waste reason label
 */
export function getWasteReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    SPOILAGE: "Spoilage",
    OVERPRODUCTION: "Overproduction",
    DAMAGE: "Physical Damage",
    CONTAMINATION: "Contamination",
    OTHER: "Other",
  };
  return labels[reason] || reason;
}

/**
 * Calculate inventory turnover rate
 * (assumes consumedQuantity is tracked over a period)
 */
export function calculateTurnoverRate(
  averageInventory: number,
  consumedQuantity: number,
  periodDays: number = 30
): number {
  if (averageInventory === 0) return 0;
  return (consumedQuantity / averageInventory) * (365 / periodDays);
}
