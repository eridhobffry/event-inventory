/**
 * Export Utilities for Inventory Management
 * Best practices for 2025: Real-time data, comprehensive fields, proper encoding
 */

import { Item } from "@/lib/api";
import { format } from "date-fns";

/**
 * Convert items array to CSV format
 * Includes all essential inventory management fields
 */
export function convertItemsToCSV(items: Item[]): string {
  // Define CSV headers based on 2025 best practices
  const headers = [
    "SKU",
    "Name",
    "Category",
    "Status",
    "Quantity",
    "Unit of Measure",
    "Unit Price (EUR)",
    "Total Value (EUR)",
    "Location",
    "Bin",
    "Description",
    "Is Perishable",
    "Storage Type",
    "Par Level",
    "Reorder Point",
    "Supplier",
    "Is Alcohol",
    "ABV (%)",
    "Allergens",
    "Last Audit",
    "Created At",
    "Updated At",
    "Event ID",
  ];

  // Helper function to escape CSV values
  const escapeCSV = (value: string | number | boolean | null | undefined): string => {
    if (value === null || value === undefined) return "";
    
    const stringValue = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Helper function to format currency
  const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return "";
    const numValue = typeof value === 'number' ? value : Number(value);
    if (isNaN(numValue)) return "";
    return numValue.toFixed(2);
  };

  // Helper function to calculate total value
  const calculateTotalValue = (quantity: number, unitPrice?: number): string => {
    if (!unitPrice) return "";
    return (quantity * unitPrice).toFixed(2);
  };

  // Build CSV rows
  const rows = items.map((item) => {
    return [
      escapeCSV(item.sku),
      escapeCSV(item.name),
      escapeCSV(item.category.replace(/_/g, " ")),
      escapeCSV(item.status),
      escapeCSV(item.quantity),
      escapeCSV(item.unitOfMeasure),
      formatCurrency(item.unitPrice),
      calculateTotalValue(item.quantity, item.unitPrice),
      escapeCSV(item.location),
      escapeCSV(item.bin || ""),
      escapeCSV(item.description || ""),
      escapeCSV(item.isPerishable ? "Yes" : "No"),
      escapeCSV(item.storageType || ""),
      escapeCSV(item.parLevel || ""),
      escapeCSV(item.reorderPoint || ""),
      escapeCSV(item.supplier?.name || ""),
      escapeCSV(item.isAlcohol ? "Yes" : "No"),
      escapeCSV(item.abv || ""),
      escapeCSV(item.allergens?.join("; ") || ""),
      escapeCSV(item.lastAudit ? format(new Date(item.lastAudit), "yyyy-MM-dd HH:mm:ss") : ""),
      escapeCSV(format(new Date(item.createdAt), "yyyy-MM-dd HH:mm:ss")),
      escapeCSV(format(new Date(item.updatedAt), "yyyy-MM-dd HH:mm:ss")),
      escapeCSV(item.eventId),
    ].join(",");
  });

  // Combine headers and rows
  return [headers.join(","), ...rows].join("\n");
}

/**
 * Download CSV file
 * Uses proper encoding (UTF-8 with BOM) for Excel compatibility
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add UTF-8 BOM for Excel compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  
  // Create download link
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Export items to CSV file
 * Main export function with timestamp in filename
 */
export function exportItemsToCSV(items: Item[], eventName?: string): void {
  const csvContent = convertItemsToCSV(items);
  const timestamp = format(new Date(), "yyyy-MM-dd_HHmmss");
  const eventPrefix = eventName ? `${eventName.replace(/[^a-z0-9]/gi, "_")}_` : "";
  const filename = `${eventPrefix}inventory_export_${timestamp}.csv`;
  
  downloadCSV(csvContent, filename);
}

/**
 * Export filtered items with summary statistics
 * Includes a summary row at the top
 */
export function exportItemsWithSummary(items: Item[], eventName?: string): void {
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = items.reduce((sum, item) => {
    return sum + (item.quantity * (item.unitPrice || 0));
  }, 0);
  const perishableCount = items.filter(item => item.isPerishable).length;
  const lowStockCount = items.filter(item => {
    return item.reorderPoint && item.quantity <= item.reorderPoint;
  }).length;

  // Create summary section
  const summary = [
    "INVENTORY EXPORT SUMMARY",
    `Export Date: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`,
    `Event: ${eventName || "All Events"}`,
    `Total Items: ${totalItems}`,
    `Total Quantity: ${totalQuantity}`,
    `Total Value: €${totalValue.toFixed(2)}`,
    `Perishable Items: ${perishableCount}`,
    `Low Stock Items: ${lowStockCount}`,
    "",
    "",
  ].join("\n");

  const csvContent = convertItemsToCSV(items);
  const fullContent = summary + csvContent;
  
  const timestamp = format(new Date(), "yyyy-MM-dd_HHmmss");
  const eventPrefix = eventName ? `${eventName.replace(/[^a-z0-9]/gi, "_")}_` : "";
  const filename = `${eventPrefix}inventory_detailed_export_${timestamp}.csv`;
  
  downloadCSV(fullContent, filename);
}
