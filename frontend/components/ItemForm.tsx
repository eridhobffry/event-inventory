"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Item } from "@/lib/api";

const itemFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  category: z.enum(
    ["FURNITURE", "AV_EQUIPMENT", "DECOR", "SUPPLIES", "OTHER"],
    {
      required_error: "Please select a category",
    }
  ),
  quantity: z.coerce.number().int().min(0, "Quantity must be at least 0"),
  location: z.string().min(1, "Location is required").max(255),
  description: z.string().max(1000).optional(),
});

type ItemFormValues = z.infer<typeof itemFormSchema>;

interface ItemFormProps {
  defaultValues?: Partial<Item>;
  onSubmit: (data: ItemFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const categoryOptions = [
  { value: "FURNITURE", label: "Furniture" },
  { value: "AV_EQUIPMENT", label: "AV Equipment" },
  { value: "DECOR", label: "Decor" },
  { value: "SUPPLIES", label: "Supplies" },
  { value: "OTHER", label: "Other" },
];

export function ItemForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save Item",
}: ItemFormProps) {
  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      category: defaultValues?.category || undefined,
      quantity: defaultValues?.quantity || 0,
      location: defaultValues?.location || "",
      description: defaultValues?.description || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <Input type="number" min="0" placeholder="0" {...field} />
              </FormControl>
              <FormDescription>Current quantity in inventory</FormDescription>
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

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
