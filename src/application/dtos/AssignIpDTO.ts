import { z } from 'zod';

export const AssignIpSchema = z.object({
  clientId: z.string().uuid(),
  accessPointId: z.string().uuid(),
  networkId: z.string().uuid(),
  ipAddressId: z.string().uuid().optional(),
});

export type AssignIpDTO = z.infer<typeof AssignIpSchema>;
