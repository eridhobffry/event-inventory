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
import { Textarea } from "@/components/ui/textarea";
import { batchSchema, BatchFormData } from "@/lib/validations/batch";

interface BatchFormProps {
  eventId: string;
  itemName: string;
  unitOfMeasure: string;
  onSubmit: (data: BatchFormData) => void;
  isSubmitting?: boolean;
}

export function BatchForm({
  eventId,
  itemName,
  unitOfMeasure,
  onSubmit,
  isSubmitting = false,
}: BatchFormProps) {
  const form = useForm<BatchFormData>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      eventId,
      quantity: 0,
      lotNumber: "",
      expirationDate: "",
      receivedAt: new Date().toISOString().split("T")[0],
      manufacturedAt: "",
      notes: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Receiving inventory for:</p>
          <p className="text-lg font-bold">{itemName}</p>
        </div>

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="0"
                  inputMode="numeric"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value) || 0)
                  }
                />
              </FormControl>
              <FormDescription>
                Amount received ({unitOfMeasure.toLowerCase()})
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lotNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lot Number (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., LOT-2025-001" {...field} />
              </FormControl>
              <FormDescription>
                Supplier batch or lot number for traceability
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expirationDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expiration Date (Optional)</FormLabel>
              <FormControl>
                <Input type="date" autoComplete="off" {...field} />
              </FormControl>
              <FormDescription>
                For perishable items - used for FIFO ordering
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="receivedAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Received Date</FormLabel>
              <FormControl>
                <Input type="date" autoComplete="off" {...field} />
              </FormControl>
              <FormDescription>
                Date this batch was received (defaults to today)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="manufacturedAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Manufacturing Date (Optional)</FormLabel>
              <FormControl>
                <Input type="date" autoComplete="off" {...field} />
              </FormControl>
              <FormDescription>
                Date this batch was manufactured
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes about this batch..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Receiving..." : "Receive Batch"}
        </Button>
      </form>
    </Form>
  );
}
