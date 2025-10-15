import { z } from "zod";

const dateInputSchema = z
  .string()
  .trim()
  .refine(
    (value) => !Number.isNaN(Date.parse(value)),
    "Enter a valid date"
  );

const optionalDateInputSchema = z
  .union([z.literal(""), dateInputSchema])
  .optional();

export const batchSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
  quantity: z.number().int().positive("Quantity must be positive"),
  lotNumber: z.string().max(255).optional(),
  expirationDate: optionalDateInputSchema,
  receivedAt: optionalDateInputSchema,
  manufacturedAt: optionalDateInputSchema,
  notes: z.string().optional(),
});

export const consumeBatchSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
  quantity: z.number().int().positive("Quantity must be positive"),
});

export type BatchFormData = z.infer<typeof batchSchema>;
export type ConsumeBatchData = z.infer<typeof consumeBatchSchema>;
