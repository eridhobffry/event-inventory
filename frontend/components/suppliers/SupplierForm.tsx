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
import { Switch } from "@/components/ui/switch";
import { Supplier } from "@/lib/api";
import {
  supplierSchema,
  SupplierFormData,
} from "@/lib/validations/supplier";

interface SupplierFormProps {
  defaultValues?: Partial<Supplier>;
  onSubmit: (data: SupplierFormData) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function SupplierForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save Supplier",
}: SupplierFormProps) {
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      contactName: defaultValues?.contactName || "",
      contactEmail: defaultValues?.contactEmail || "",
      contactPhone: defaultValues?.contactPhone || "",
      leadTimeDays: defaultValues?.leadTimeDays || undefined,
      notes: defaultValues?.notes || "",
      isActive: defaultValues?.isActive ?? true,
    },
  });

  const handleFormSubmit = (values: SupplierFormData) => {
    const normalized: SupplierFormData = {
      ...values,
      contactName: values.contactName?.trim()
        ? values.contactName.trim()
        : undefined,
      contactEmail: values.contactEmail?.trim()
        ? values.contactEmail.trim()
        : undefined,
      contactPhone: values.contactPhone?.trim()
        ? values.contactPhone.trim()
        : undefined,
      notes: values.notes?.trim() ? values.notes.trim() : undefined,
      leadTimeDays:
        typeof values.leadTimeDays === "number" ? values.leadTimeDays : undefined,
    };

    onSubmit(normalized);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Fresh Food Co." {...field} />
              </FormControl>
              <FormDescription>
                The name of the supplier company
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Person (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., John Smith" {...field} />
              </FormControl>
              <FormDescription>
                Primary contact at the supplier
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="contact@supplier.com"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Contact email address
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Contact phone number
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="leadTimeDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lead Time (Days)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="7"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Typical delivery lead time in days
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
                  placeholder="Additional notes about this supplier..."
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Any additional information about the supplier
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Enable this supplier for selection in item forms
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
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
