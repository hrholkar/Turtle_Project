import { z } from 'zod';

const SPECIES = ['green', 'loggerhead', 'leatherback', 'hawksbill', 'kemp_ridley', 'olive_ridley', 'flatback', 'unknown'] as const;
const GENDERS = ['male', 'female', 'unknown'] as const;

export const createTurtleSchema = z.object({
  species: z.enum(SPECIES).default('unknown'),
  gender: z.enum(GENDERS).default('unknown'),
  birthLocation: z.string().optional(),
  birthDate: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  firstSightingDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  notes: z.string().max(2000).optional(),
});

export const updateTurtleSchema = z.object({
  species: z.enum(SPECIES).optional(),
  gender: z.enum(GENDERS).optional(),
  birthLocation: z.string().optional(),
  birthDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
}).partial();

export const turtleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  species: z.enum(SPECIES).optional(),
  gender: z.enum(GENDERS).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['latestSightingDate', 'firstSightingDate', 'totalSightings', 'createdAt']).default('latestSightingDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateTurtleInput = z.infer<typeof createTurtleSchema>;
export type UpdateTurtleInput = z.infer<typeof updateTurtleSchema>;
export type TurtleQuery = z.infer<typeof turtleQuerySchema>;
