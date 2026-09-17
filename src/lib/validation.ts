import { z } from "zod";
import { isValidTimezone } from "./timezone";

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.email("Enter a valid email").max(254).toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email").max(254).toLowerCase(),
  password: z.string().min(1, "Password is required").max(200),
});

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format");
const timeString = z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format");

export const createWeddingSchema = z.object({
  coupleNames: z
    .string()
    .trim()
    .min(1, "Event name is required")
    .max(120),
  weddingDate: dateString,
  location: z.string().trim().min(1, "Location is required").max(160),
  timezone: z
    .string()
    .refine(isValidTimezone, "Choose a valid timezone"),
  revealDate: dateString,
  revealTime: timeString,
});

export const updateWeddingSchema = createWeddingSchema.partial().extend({
  moderationEnabled: z.boolean().optional(),
  showAttribution: z.boolean().optional(),
  allowGuestDownloads: z.boolean().optional(),
  welcomeMessage: z.string().trim().max(300).nullable().optional(),
  maxPhotosPerGuest: z.coerce.number().int().min(1).max(100).optional(),
});

export const guestJoinSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(60)
    .transform((v) => v || "A guest"),
});

export const reportSchema = z.object({
  reason: z.string().trim().min(1, "Tell us what's wrong").max(500),
});
