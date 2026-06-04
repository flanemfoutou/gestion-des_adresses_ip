import { z } from 'zod';
export const AssignIpSchema = z.object({
    clientId: z.string().uuid(),
    accessPointId: z.string().uuid(),
    networkId: z.string().uuid(),
});
