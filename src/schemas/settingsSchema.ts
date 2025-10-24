import { z } from 'zod';

// Sanitization helpers
const sanitizeString = (str: string) => str.trim().replace(/[<>\"'&]/g, '');

const dateSchema = z
	.string()
	.optional()
	.refine((date) => !date || !isNaN(Date.parse(date)), {
		message: 'Invalid date format'
	})
	.refine((date) => !date || new Date(date) >= new Date(Date.now() - 24 * 60 * 60 * 1000), {
		message: 'Tournament date cannot be more than 1 day in the past'
	});

// Simplified schema for sveltekit-superforms compatibility
export const formSchema = z.object({
	name: z.string().min(1, 'Tournament name is required').max(100, 'Tournament name too long'),
	description: z.string().max(1000, 'Description too long'),
	courts: z.coerce.number().int().min(1).max(20),
	pools: z.coerce.number().int().min(1).max(50),
	refs: z.enum(['teams', 'provided']),
	scoring: z.enum(['points', 'wins']),
	date: z.string().optional(),
	tournament_type: z
		.enum(['fixed-teams', 'mix-and-match'])
		.default('fixed-teams'),
	team_size: z.coerce.number().int().min(2).max(6).default(2),
	id: z.coerce.number().int().positive().optional(),
	owner: z.uuid().optional()
});

export type FormSchema = typeof formSchema;

// Additional validation schemas
export const tournamentUpdateSchema = formSchema.partial().extend({
	id: z.coerce.number().int().positive('ID is required for updates')
});

export const tournamentSearchSchema = z.object({
	query: z.string().min(1).max(100).transform(sanitizeString),
	owner: z.string().uuid().optional(),
	date_from: dateSchema,
	date_to: dateSchema
});

export const tournamentStatsSchema = z.object({
	tournament_id: z.coerce.number().int().positive(),
	include_teams: z.boolean().default(true),
	include_matches: z.boolean().default(true),
	include_standings: z.boolean().default(false)
});

export type TournamentUpdateSchema = typeof tournamentUpdateSchema;
export type TournamentSearchSchema = typeof tournamentSearchSchema;
export type TournamentStatsSchema = typeof tournamentStatsSchema;
