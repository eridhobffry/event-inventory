import { z } from "zod";

export const wasteReasonEnum = z.enum([
  "SPOILAGE",
  "OVERPRODUCTION",
  "DAMAGE",
  "CONTAMINATION",
  "OTHER",
]);

const batchIdSchema = z
  .union([z.string().uuid("Invalid batch ID"), z.literal("")])
  .transform((value) => (value === "" ? undefined : value));

export const wasteLogSchema = z.object({
  itemId: z.string().uuid("Invalid item ID"),
  eventId: z.string().uuid("Invalid event ID"),
  batchId: batchIdSchema.optional(),
  quantity: z.number().int().positive("Quantity must be positive"),
  reason: wasteReasonEnum,
  notes: z.string().optional(),
});

export type WasteLogFormData = z.infer<typeof wasteLogSchema>;
export type WasteReason = z.infer<typeof wasteReasonEnum>;
