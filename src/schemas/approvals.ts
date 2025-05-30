// src/schemas/approval.ts
import { z } from 'zod';

export const approvalSchema = z.object({
	userId: z.string().uuid(),
	action: z.enum(['approve', 'reject'])
});

export type ApprovalForm = z.infer<typeof approvalSchema>;
