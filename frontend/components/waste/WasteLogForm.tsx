"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { wasteLogSchema, WasteLogFormData } from "@/lib/validations/waste";
import { getWasteReasonLabel } from "@/lib/utils/inventory";
import { formatCurrency } from "@/lib/utils/formatters";
import { ItemBatch } from "@/lib/api";

interface WasteLogFormProps {
  itemId: string;
  itemName: string;
  eventId: string;
  unitOfMeasure: string;
  unitPrice?: number;
  batches?: ItemBatch[];
  onSubmit: (data: WasteLogFormData) => void;
  isSubmitting?: boolean;
}

const wasteReasons = [
  "SPOILAGE",
  "OVERPRODUCTION",
  "DAMAGE",
  "CONTAMINATION",
  "OTHER",
] as const;

export function WasteLogForm({
  itemId,
  itemName,
  eventId,
  unitOfMeasure,
  unitPrice,
  batches,
  onSubmit,
  isSubmitting = false,
}: WasteLogFormProps) {
  const form = useForm<WasteLogFormData>({
    resolver: zodResolver(wasteLogSchema),
    defaultValues: {
      itemId,
      eventId,
      quantity: 0,
      reason: "SPOILAGE",
      notes: "",
      batchId: undefined,
    },
  });

  const watchedQuantity = form.watch("quantity");
  const estimatedCost = unitPrice ? watchedQuantity * unitPrice : null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Logging waste for:</p>
          <p className="text-lg font-bold">{itemName}</p>
        </div>

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity Wasted</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Amount wasted ({unitOfMeasure.toLowerCase()})
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {wasteReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {getWasteReasonLabel(reason)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Why was this item wasted?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {batches && batches.length > 0 && (
          <FormField
            control={form.control}
            name="batchId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Batch (Optional)</FormLabel>
                <Select
                  onValueChange={(value) =>
                    field.onChange(value === "" ? undefined : value)
                  }
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">No specific batch</SelectItem>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.lotNumber || `Batch ${batch.id.slice(0, 8)}`} - {batch.quantity}{" "}
                        {unitOfMeasure.toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Link to a specific batch if known
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional details about the waste..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {estimatedCost !== null && watchedQuantity > 0 && (
          <div className="rounded-lg border bg-red-50 dark:bg-red-950 p-4">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">
              Estimated Cost Impact
            </p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
              {formatCurrency(estimatedCost)}
            </p>
          </div>
        )}

        <Button type="submit" disabled={isSubmitting || watchedQuantity === 0} className="w-full">
          {isSubmitting ? "Logging..." : "Log Waste"}
        </Button>
      </form>
    </Form>
  );
}
