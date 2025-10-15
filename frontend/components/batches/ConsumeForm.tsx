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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { consumeBatchSchema, ConsumeBatchData } from "@/lib/validations/batch";
import { AlertCircle } from "lucide-react";

interface ConsumeFormProps {
  eventId: string;
  itemName: string;
  currentQuantity: number;
  unitOfMeasure: string;
  onSubmit: (data: ConsumeBatchData) => void;
  isSubmitting?: boolean;
  hasOpenBatches: boolean;
}

export function ConsumeForm({
  eventId,
  itemName,
  currentQuantity,
  unitOfMeasure,
  onSubmit,
  isSubmitting = false,
  hasOpenBatches,
}: ConsumeFormProps) {
  const form = useForm<ConsumeBatchData>({
    resolver: zodResolver(consumeBatchSchema),
    defaultValues: {
      eventId,
      quantity: 0,
    },
  });

  const watchedQuantity = form.watch("quantity");
  const isOverConsumption = watchedQuantity > currentQuantity;
  const isSubmitDisabled =
    isSubmitting ||
    isOverConsumption ||
    watchedQuantity === 0 ||
    !hasOpenBatches;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Consuming inventory from:</p>
          <p className="text-lg font-bold">{itemName}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Current quantity: {currentQuantity} {unitOfMeasure.toLowerCase()}
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Stock will be consumed using FIFO (First In, First Out) method.
            Oldest batches and those expiring soonest will be used first.
          </AlertDescription>
        </Alert>

        {!hasOpenBatches && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No open batches are available to consume. Receive new inventory before consuming stock.
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity to Consume</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max={currentQuantity}
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Amount to consume ({unitOfMeasure.toLowerCase()})
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {isOverConsumption && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Quantity exceeds current inventory. Maximum: {currentQuantity}
            </AlertDescription>
          </Alert>
        )}

        {watchedQuantity > 0 && !isOverConsumption && (
          <div className="rounded-lg border bg-green-50 dark:bg-green-950 p-4">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              Preview
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Will consume {watchedQuantity} {unitOfMeasure.toLowerCase()} from oldest batches first
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Remaining: {currentQuantity - watchedQuantity} {unitOfMeasure.toLowerCase()}
            </p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitDisabled}
          className="w-full"
        >
          {isSubmitting ? "Consuming..." : "Consume Stock"}
        </Button>
      </form>
    </Form>
  );
}
