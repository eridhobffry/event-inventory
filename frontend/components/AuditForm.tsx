"use client";

import { useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useItems } from "@/hooks/useItems";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const auditFormSchema = z.object({
  itemId: z.string().min(1, "Please select an item"),
  actualQuantity: z.coerce.number().int().min(0, "Quantity must be at least 0"),
  expectedQuantity: z.coerce
    .number()
    .int()
    .min(0, "Quantity must be at least 0"),
  notes: z.string().max(1000).optional(),
});

type AuditFormValues = z.infer<typeof auditFormSchema>;

interface AuditFormProps {
  onSubmit: (data: AuditFormValues) => void;
  isSubmitting?: boolean;
  defaultItemId?: string;
}

export function AuditForm({
  onSubmit,
  isSubmitting = false,
  defaultItemId,
}: AuditFormProps) {
  const { data: itemsData } = useItems({ limit: 100 });

  const form = useForm<AuditFormValues>({
    resolver: zodResolver(auditFormSchema),
    defaultValues: {
      itemId: defaultItemId || "",
      actualQuantity: 0,
      expectedQuantity: 0,
      notes: "",
    },
  });

  // Auto-fill expected quantity when item is selected
  const selectedItemId = form.watch("itemId");
  const selectedItem = itemsData?.data.find(
    (item) => item.id === selectedItemId
  );

  // Update expected quantity when item changes
  useEffect(() => {
    if (selectedItem && form.getValues("expectedQuantity") === 0) {
      form.setValue("expectedQuantity", selectedItem.quantity);
    }
  }, [selectedItem, form]);

  const discrepancy =
    form.watch("actualQuantity") - form.watch("expectedQuantity");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="itemId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an item to audit" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {itemsData?.data.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} (Current: {item.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose the item you want to audit
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedItem && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p className="text-sm font-medium">Selected Item Details</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Category:</span>{" "}
                {selectedItem.category.replace(/_/g, " ")}
              </div>
              <div>
                <span className="text-muted-foreground">Location:</span>{" "}
                {selectedItem.location}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="expectedQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Quantity</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
                <FormDescription>From records</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="actualQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actual Quantity</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
                <FormDescription>Physical count</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {discrepancy !== 0 && (
          <div
            className={`p-4 rounded-lg ${
              discrepancy > 0
                ? "bg-blue-50 text-blue-900"
                : "bg-orange-50 text-orange-900"
            }`}
          >
            <p className="font-medium">
              Discrepancy Detected: {discrepancy > 0 ? "+" : ""}
              {discrepancy} items
            </p>
            <p className="text-sm mt-1">
              {discrepancy > 0
                ? "More items found than expected"
                : "Fewer items found than expected"}
            </p>
          </div>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any observations or comments about this audit..."
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Additional details about the audit
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating Audit..." : "Create Audit Log"}
        </Button>
      </form>
    </Form>
  );
}
