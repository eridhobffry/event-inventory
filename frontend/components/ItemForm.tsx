"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SupplierSelect } from "@/components/suppliers/SupplierSelect";
import { AllergenMultiSelect } from "@/components/ui/AllergenMultiSelect";
import type {
  Item,
  Category,
  UnitOfMeasure,
  ItemStatus,
  StorageType,
} from "@/lib/api";

const categoryOptions: { value: Category; label: string }[] = [
  { value: "FURNITURE", label: "Furniture" },
  { value: "AV_EQUIPMENT", label: "AV Equipment" },
  { value: "DECOR", label: "Decor" },
  { value: "SUPPLIES", label: "Supplies" },
  { value: "FOOD_BEVERAGE", label: "Food & Beverage" },
  { value: "OTHER", label: "Other" },
];

const unitOfMeasureOptions: { value: UnitOfMeasure; label: string }[] = [
  { value: "EACH", label: "Each" },
  { value: "PAIR", label: "Pair" },
  { value: "SET", label: "Set" },
  { value: "METER", label: "Meter" },
  { value: "BOX", label: "Box" },
  { value: "PACK", label: "Pack" },
  { value: "HOUR", label: "Hour" },
  { value: "KILOGRAM", label: "Kilogram" },
  { value: "GRAM", label: "Gram" },
  { value: "LITER", label: "Liter" },
  { value: "MILLILITER", label: "Milliliter" },
  { value: "SERVING", label: "Serving" },
];

const statusOptions: { value: ItemStatus; label: string }[] = [
  { value: "AVAILABLE", label: "Available" },
  { value: "RESERVED", label: "Reserved" },
  { value: "OUT_OF_STOCK", label: "Out of Stock" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "RETIRED", label: "Retired" },
];

const storageTypeOptions: { value: StorageType; label: string }[] = [
  { value: "DRY", label: "Dry Storage" },
  { value: "CHILL", label: "Refrigerated (0-5°C)" },
  { value: "FREEZE", label: "Frozen (-18°C or below)" },
];

const itemFormSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(255),
    sku: z.string().min(1, "SKU is required").max(255),
    category: z.enum([
      "FURNITURE",
      "AV_EQUIPMENT",
      "DECOR",
      "SUPPLIES",
      "FOOD_BEVERAGE",
      "OTHER",
    ]),
    quantity: z.number().int().min(0, "Quantity must be at least 0"),
    unitOfMeasure: z.enum([
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
    ]),
    unitPrice: z
      .number()
      .positive("Unit price must be greater than 0")
      .optional(),
    status: z.enum([
      "AVAILABLE",
      "RESERVED",
      "OUT_OF_STOCK",
      "MAINTENANCE",
      "DAMAGED",
      "RETIRED",
    ]),
    location: z.string().min(1, "Location is required").max(255),
    bin: z.string().max(255).optional(),
    description: z.string().max(1000).optional(),
    isPerishable: z.boolean().default(false),
    storageType: z.enum(["DRY", "CHILL", "FREEZE"]).optional(),
    parLevel: z
      .number()
      .int()
      .positive("Par level must be greater than 0")
      .optional(),
    reorderPoint: z
      .number()
      .int()
      .positive("Reorder point must be greater than 0")
      .optional(),
    supplierId: z.string().uuid("Invalid supplier ID").optional(),
    isAlcohol: z.boolean().default(false),
    abv: z
      .number()
      .min(0, "ABV cannot be negative")
      .max(100, "ABV cannot exceed 100%")
      .optional(),
    allergens: z.array(z.string()).default([]),
  })
  .refine(
    (data) => {
      if (data.isPerishable) {
        return !!data.storageType;
      }
      return true;
    },
    {
      message: "Storage type is required for perishable items",
      path: ["storageType"],
    }
  )
  .refine(
    (data) => {
      if (data.isAlcohol) {
        return data.abv !== undefined;
      }
      return true;
    },
    {
      message: "ABV is required when the item contains alcohol",
      path: ["abv"],
    }
  )
  .refine(
    (data) => {
      if (data.reorderPoint !== undefined && data.parLevel !== undefined) {
        return data.reorderPoint < data.parLevel;
      }
      return true;
    },
    {
      message: "Reorder point must be less than par level",
      path: ["reorderPoint"],
    }
  );

type ItemFormValues = z.infer<typeof itemFormSchema>;

interface ItemFormProps {
  defaultValues?: Partial<Item>;
  onSubmit: (data: ItemFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const parseNumberInput = (value: string): number | undefined => {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return undefined;
  }
  return parsed;
};

export function ItemForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save Item",
}: ItemFormProps) {
  const coerceNumber = (value: unknown) =>
    typeof value === "number" && !Number.isNaN(value) ? value : undefined;

  const coerceString = (value: unknown) =>
    typeof value === "string" && value.length > 0 ? value : undefined;

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      sku: defaultValues?.sku || "",
      category:
        (defaultValues?.category as ItemFormValues["category"]) ?? "FURNITURE",
      quantity: defaultValues?.quantity ?? 0,
      unitOfMeasure:
        (defaultValues?.unitOfMeasure as ItemFormValues["unitOfMeasure"]) ||
        "EACH",
      unitPrice:
        defaultValues?.unitPrice !== undefined
          ? Number(defaultValues.unitPrice)
          : undefined,
      status:
        (defaultValues?.status as ItemFormValues["status"]) || "AVAILABLE",
      location: defaultValues?.location || "",
      bin: defaultValues?.bin || "",
      description: defaultValues?.description || "",
      isPerishable: defaultValues?.isPerishable ?? false,
      storageType: defaultValues?.storageType ?? undefined,
      parLevel: coerceNumber(defaultValues?.parLevel ?? undefined),
      reorderPoint: coerceNumber(defaultValues?.reorderPoint ?? undefined),
      supplierId: coerceString(defaultValues?.supplierId ?? undefined),
      isAlcohol: defaultValues?.isAlcohol ?? false,
      abv: coerceNumber(
        defaultValues?.abv !== undefined ? Number(defaultValues.abv) : undefined
      ),
      allergens: defaultValues?.allergens ?? [],
    },
  });

  const category = form.watch("category");
  const isPerishable = form.watch("isPerishable");
  const isAlcohol = form.watch("isAlcohol");

  const [isFnbSectionOpen, setIsFnbSectionOpen] = useState(() => {
    if (defaultValues?.category === "FOOD_BEVERAGE") return true;
    if (defaultValues?.isPerishable || defaultValues?.isAlcohol) return true;
    if (defaultValues?.supplierId) return true;
    if ((defaultValues?.allergens?.length || 0) > 0) return true;
    if (defaultValues?.parLevel || defaultValues?.reorderPoint) return true;
    return false;
  });

  const shouldForceOpen = useMemo(
    () => category === "FOOD_BEVERAGE" || isPerishable || isAlcohol,
    [category, isPerishable, isAlcohol]
  );

  useEffect(() => {
    if (category === "FOOD_BEVERAGE") {
      setIsFnbSectionOpen(true);
    }
  }, [category]);

  useEffect(() => {
    if (isPerishable) {
      setIsFnbSectionOpen(true);
    } else {
      form.setValue("storageType", undefined);
    }
  }, [isPerishable, form]);

  useEffect(() => {
    if (isAlcohol) {
      setIsFnbSectionOpen(true);
    } else {
      form.setValue("abv", undefined);
    }
  }, [isAlcohol, form]);

  const handleFormSubmit = (values: ItemFormValues) => {
    const cleaned: ItemFormValues = {
      ...values,
      unitPrice: values.unitPrice ?? undefined,
      storageType: values.isPerishable ? values.storageType : undefined,
      parLevel: values.parLevel ?? undefined,
      reorderPoint: values.reorderPoint ?? undefined,
      supplierId: values.supplierId || undefined,
      abv: values.isAlcohol ? values.abv ?? undefined : undefined,
      allergens: values.allergens ?? [],
    };

    onSubmit(cleaned);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Folding Chair" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive name for the inventory item
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU</FormLabel>
              <FormControl>
                <Input placeholder="e.g., CHAIR-001" {...field} />
              </FormControl>
              <FormDescription>
                Unique stock keeping unit identifier
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose the category that best fits this item
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={field.value ?? ""}
                  onChange={(event) =>
                    field.onChange(parseNumberInput(event.target.value))
                  }
                />
              </FormControl>
              <FormDescription>Current quantity in inventory</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="unitOfMeasure"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit of Measure</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {unitOfMeasureOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>How this item is counted</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="unitPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit Price (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={field.value ?? ""}
                  onChange={(event) =>
                    field.onChange(parseNumberInput(event.target.value))
                  }
                />
              </FormControl>
              <FormDescription>Price per unit</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Current availability status</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Warehouse A" {...field} />
              </FormControl>
              <FormDescription>Where this item is stored</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bin (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Shelf 3, Row B" {...field} />
              </FormControl>
              <FormDescription>Specific shelf or bin location</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional details about this item..."
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Any additional information about the item
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div
          className="rounded-lg border"
          role="group"
          aria-labelledby="fnb-section-label"
        >
          <button
            type="button"
            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
            onClick={() =>
              setIsFnbSectionOpen((prev) => (shouldForceOpen ? true : !prev))
            }
            aria-expanded={isFnbSectionOpen || shouldForceOpen}
            aria-controls="fnb-section-content"
          >
            <div className="space-y-1">
              <p id="fnb-section-label" className="text-sm font-medium">
                Food &amp; Beverage Details
              </p>
              <p className="text-sm text-muted-foreground">
                Manage perishables, suppliers, and compliance metadata
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isFnbSectionOpen || shouldForceOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>
          {(isFnbSectionOpen || shouldForceOpen) && (
            <div
              id="fnb-section-content"
              className="space-y-6 border-t px-4 py-6"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="isPerishable"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <div className="flex items-start justify-between rounded-md border px-4 py-3">
                        <div className="space-y-1 pr-4">
                          <FormLabel className="text-base">
                            Perishable Item
                          </FormLabel>
                          <FormDescription>
                            Track storage requirements and expiration monitoring
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(value) => {
                              field.onChange(value);
                              if (value) setIsFnbSectionOpen(true);
                            }}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isAlcohol"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <div className="flex items-start justify-between rounded-md border px-4 py-3">
                        <div className="space-y-1 pr-4">
                          <FormLabel className="text-base">
                            Contains Alcohol
                          </FormLabel>
                          <FormDescription>
                            Enable compliance tracking for alcohol content
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(value) => {
                              field.onChange(value);
                              if (value) setIsFnbSectionOpen(true);
                            }}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {isPerishable && (
                <FormField
                  control={form.control}
                  name="storageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!isPerishable}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select storage type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {storageTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Recommended storage environment for this item
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="parLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Par Level (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(parseNumberInput(event.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Target quantity to have on hand at all times
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reorderPoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reorder Point (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(parseNumberInput(event.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Trigger level for reordering inventory
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier (Optional)</FormLabel>
                    <FormControl>
                      <SupplierSelect
                        value={field.value}
                        onChange={(value) => field.onChange(value)}
                        placeholder="Select supplier..."
                      />
                    </FormControl>
                    <FormDescription>
                      Link this item to a preferred supplier for reordering
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isAlcohol && (
                <FormField
                  control={form.control}
                  name="abv"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alcohol by Volume (ABV)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="e.g., 12.5"
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(parseNumberInput(event.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Alcohol percentage as listed on the product label
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="allergens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allergens (Optional)</FormLabel>
                    <AllergenMultiSelect
                      value={field.value || []}
                      onChange={(value) => {
                        field.onChange(value);
                        setIsFnbSectionOpen(true);
                      }}
                    />
                    <FormDescription>
                      List any allergen warnings associated with this item
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
