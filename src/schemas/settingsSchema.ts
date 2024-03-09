import { z } from 'zod';

export const formSchema = z.object({
	name: z.string().refine((v) => v, { message: 'A event name is required.' })
	// courts: z.number().refine((v) => v, { message: 'A number of courts is required.' }),
	// pools: z.number().refine((v) => v, { message: 'A number of pools is required.' }),
	// ref: z.string().refine((v) => v, { message: 'A ref type is required.' })
	// date: z.string().refine((v) => v, { message: 'A date is required.' }),
	// scoring: z.string().refine((v) => v, { message: 'A scoring type is required.' })
});

export type FormSchema = typeof formSchema;
