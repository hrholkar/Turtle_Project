import { z } from 'zod';

export const createSightingSchema = z.object({
  turtleId: z.string().min(1),
  location: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  sightingDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).default(() => new Date().toISOString()),
  notes: z.string().max(2000).optional(),
});

export const identifySchema = z.object({
  location:    z.string().optional(),
  latitude:    z.coerce.number().min(-90).max(90).optional(),
  longitude:   z.coerce.number().min(-180).max(180).optional(),
  sightingDate: z.string().optional(),
  notes:       z.string().max(2000).optional(),
  image_side:  z.enum(['AUTO', 'LEFT', 'RIGHT']).default('AUTO'),
});

export const approvePendingSchema = z.object({
  turtleId: z.string().optional(), // If provided, link to existing turtle
  species: z.enum(['green', 'loggerhead', 'leatherback', 'hawksbill', 'kemp_ridley', 'olive_ridley', 'flatback', 'unknown']).default('unknown'),
  gender: z.enum(['male', 'female', 'unknown']).default('unknown'),
  birthLocation: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateSightingInput = z.infer<typeof createSightingSchema>;
export type IdentifyInput = z.infer<typeof identifySchema>;
export type ApprovePendingInput = z.infer<typeof approvePendingSchema>;
