import { z } from 'zod';

export const CoordinatesSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  altitude: z.number().finite().optional(),
});

export type CoordinatesDTO = z.infer<typeof CoordinatesSchema>;
