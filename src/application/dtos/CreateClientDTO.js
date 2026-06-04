import { z } from 'zod';
export const CreateClientSchema = z.object({
    fullName: z.string().min(3),
    phoneNumber: z.string().min(6),
    clientType: z.enum(['residential', 'business', 'enterprise', 'iot']),
    accessPointId: z.string().uuid(),
});
