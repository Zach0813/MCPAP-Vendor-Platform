import { z } from 'zod';

/**
 * Vendor application schema — used by both the client form (react-hook-form
 * resolver) and the /api/applications route handler for server-side validation.
 *
 * Keep field names camelCase here; the route handler maps to snake_case
 * column names before inserting into Supabase.
 */
export const applicationSchema = z.object({
  vendorName: z.string().min(2, 'Please enter your business name').max(120),
  contactName: z.string().min(2, 'Please enter your name').max(120),
  email: z.string().email('Please enter a valid email'),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .or(z.literal('')),
  businessDescription: z
    .string()
    .min(20, 'Tell us a little more (at least 20 characters)')
    .max(2000, 'Please keep it under 2000 characters'),
  category: z.enum(
    ['plants', 'pots-decor', 'art', 'food', 'apparel', 'workshop', 'other'],
    { errorMap: () => ({ message: 'Pick a category' }) }
  ),
  website: z
    .string()
    .trim()
    .url('Please enter a valid URL (include https://)')
    .optional()
    .or(z.literal('')),
  socialLinks: z
    .object({
      instagram: z.string().trim().optional().or(z.literal('')),
      facebook: z.string().trim().optional().or(z.literal('')),
      tiktok: z.string().trim().optional().or(z.literal('')),
    })
    .optional(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
