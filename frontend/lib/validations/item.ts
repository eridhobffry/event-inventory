import { z } from "zod";

export const categoryEnum = z.enum([
  "FURNITURE",
  "AV_EQUIPMENT",
  "DECOR",
  "SUPPLIES",
  "FOOD_BEVERAGE",
  "OTHER",
]);

export const unitOfMeasureEnum = z.enum([
  "EACH",
  "PAIR",
  "SET",
  "METER",
  "BOX",
  "PACK",
  "HOUR",
  "KILOGRAM",
  "GRAM",
  "LITER",
  "MILLILITER",
  "SERVING",
]);

export const itemStatusEnum = z.enum([
  "AVAILABLE",
  "RESERVED",
  "OUT_OF_STOCK",
  "MAINTENANCE",
  "DAMAGED",
  "RETIRED",
]);

export const storageTypeEnum = z.enum(["DRY", "CHILL", "FREEZE"]);

export const itemSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  sku: z.string().min(1, "SKU is required").max(255),
  category: categoryEnum,
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  unitOfMeasure: unitOfMeasureEnum.default("EACH"),
  unitPrice: z.number().positive().optional(),
  status: itemStatusEnum.default("AVAILABLE"),
  location: z.string().min(1, "Location is required").max(255),
  bin: z.string().max(255).optional(),
  description: z.string().optional(),
  eventId: z.string().uuid("Invalid event ID"),

  // === PHASE 2: Food & Beverage Fields ===
  // Perishable Management
  isPerishable: z.boolean().default(false),
  storageType: storageTypeEnum.optional(),

  // Procurement
  parLevel: z.number().int().positive().optional(),
  reorderPoint: z.number().int().positive().optional(),
  supplierId: z.string().uuid("Invalid supplier ID").optional(),

  // Compliance
  isAlcohol: z.boolean().default(false),
  abv: z.number().min(0).max(100).optional(),
  allergens: z.array(z.string()).default([]),
}).refine(
  (data) => {
    // If isAlcohol is true, abv should be provided
    if (data.isAlcohol && data.abv === undefined) {
      return false;
    }
    return true;
  },
  {
    message: "ABV is required when item is alcoholic",
    path: ["abv"],
  }
).refine(
  (data) => {
    // If reorderPoint is set, it should be less than parLevel
    if (data.reorderPoint !== undefined && data.parLevel !== undefined) {
      return data.reorderPoint < data.parLevel;
    }
    return true;
  },
  {
    message: "Reorder point must be less than par level",
    path: ["reorderPoint"],
  }
).refine(
  (data) => {
    // If isPerishable is true, storageType should be provided
    if (data.isPerishable && !data.storageType) {
      return false;
    }
    return true;
  },
  {
    message: "Storage type is required for perishable items",
    path: ["storageType"],
  }
);

export const createItemSchema = itemSchema;

export const updateItemSchema = itemSchema.partial().omit({ eventId: true });

export type ItemFormData = z.infer<typeof itemSchema>;
export type CreateItemData = z.infer<typeof createItemSchema>;
export type UpdateItemData = z.infer<typeof updateItemSchema>;
export type Category = z.infer<typeof categoryEnum>;
export type UnitOfMeasure = z.infer<typeof unitOfMeasureEnum>;
export type ItemStatus = z.infer<typeof itemStatusEnum>;
export type StorageType = z.infer<typeof storageTypeEnum>;
