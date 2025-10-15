import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
  contactName: z.string().max(255).optional(),
  contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  contactPhone: z.string().max(50).optional(),
  leadTimeDays: z.number().int().positive("Lead time must be positive").optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const createSupplierSchema = supplierSchema;

export const updateSupplierSchema = supplierSchema.partial();

export type SupplierFormData = z.infer<typeof supplierSchema>;
export type CreateSupplierData = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierData = z.infer<typeof updateSupplierSchema>;
