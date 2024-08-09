import { z } from 'zod';

export const formSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	description: z.string().min(1, 'Description is required'),
	courts: z.coerce.number().min(1, 'Number of courts must be at least 1'),
	pools: z.coerce.number().min(1, 'Number of pool play games must be at least 1'),
	refs: z.string().min(1, 'Referee option is required'),
	scoring: z.string().min(1, 'Scoring method is required'),
	date: z.string().optional(),
	id: z.coerce.number().optional(),
	owner: z.string().optional()
});

export type FormSchema = typeof formSchema;
