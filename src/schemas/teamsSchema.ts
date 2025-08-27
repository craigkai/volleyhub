import { z } from 'zod';

// Sanitization helpers
const sanitizeString = (str: string) => str.trim().replace(/[<>\"'&]/g, '');
const MAX_TEAM_NAME_LENGTH = 50;
const MIN_TEAM_NAME_LENGTH = 1;

// Enhanced team name validation
const teamNameSchema = z
	.string()
	.min(MIN_TEAM_NAME_LENGTH, `Team name must be at least ${MIN_TEAM_NAME_LENGTH} character`)
	.max(MAX_TEAM_NAME_LENGTH, `Team name cannot exceed ${MAX_TEAM_NAME_LENGTH} characters`)
	.transform(sanitizeString)
	.refine((name) => name.length > 0, {
		message: 'Team name cannot be empty after removing invalid characters'
	})
	.refine((name) => !/^\s*$/.test(name), { message: 'Team name cannot be only whitespace' })
	.refine((name) => !/^[0-9]+$/.test(name), { message: 'Team name cannot be only numbers' })
	.refine((name) => !/(script|javascript|eval|alert|confirm|prompt)/i.test(name), {
		message: 'Team name contains prohibited content'
	});

export const formSchema = z.object({
	name: teamNameSchema,
	event_id: z.coerce
		.number()
		.int('Event ID must be an integer')
		.positive('Event ID must be positive')
		.max(2147483647, 'Event ID is too large'), // PostgreSQL int4 max
	id: z.coerce
		.number()
		.int('ID must be an integer')
		.positive('ID must be positive')
		.max(2147483647, 'ID is too large')
		.optional()
});

export type FormSchema = typeof formSchema;

// Additional validation schemas for different contexts
export const teamUpdateSchema = formSchema.partial().extend({
	id: z.coerce.number().int().positive('ID is required for updates')
});

export const teamBulkSchema = z.object({
	teams: z
		.array(formSchema)
		.min(2, 'At least 2 teams required')
		.max(64, 'Maximum 64 teams allowed'),
	event_id: z.coerce.number().int().positive()
});

export const teamSearchSchema = z.object({
	query: z.string().min(1).max(100).transform(sanitizeString),
	event_id: z.coerce.number().int().positive().optional()
});

export type TeamUpdateSchema = typeof teamUpdateSchema;
export type TeamBulkSchema = typeof teamBulkSchema;
export type TeamSearchSchema = typeof teamSearchSchema;
