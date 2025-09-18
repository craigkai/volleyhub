import { z } from 'zod';

// Constants for validation
const MAX_NAME_LENGTH = 100;
const MIN_NAME_LENGTH = 0;
const MAX_DESCRIPTION_LENGTH = 500;
const MIN_DESCRIPTION_LENGTH = 0;
const MAX_COURTS = 20;
const MIN_COURTS = 1;
const MAX_POOLS = 50;
const MIN_POOLS = 1;

// Sanitization helpers
const sanitizeString = (str: string) => str.trim().replace(/[<>\"'&]/g, '');
const sanitizeDescription = (str: string) => str.trim().replace(/[<>]/g, '');

// Valid enum values
const VALID_REF_OPTIONS = ['teams', 'officials', 'none'] as const;
const VALID_SCORING_METHODS = ['rally', 'sideout', 'custom'] as const;

// Enhanced validation schemas
const tournamentNameSchema = z
	.string()
	.min(MIN_NAME_LENGTH, `Tournament name must be at least ${MIN_NAME_LENGTH} characters`)
	.max(MAX_NAME_LENGTH, `Tournament name cannot exceed ${MAX_NAME_LENGTH} characters`)
	.transform(sanitizeString)
	.refine((name) => name.length >= MIN_NAME_LENGTH, {
		message: 'Tournament name too short after removing invalid characters'
	})
	.refine((name) => !/^\s*$/.test(name), { message: 'Tournament name cannot be only whitespace' })
	.refine(
		(name) => !/(script|javascript|eval|alert|confirm|prompt|iframe|object|embed)/i.test(name),
		{
			message: 'Tournament name contains prohibited content'
		}
	);

const descriptionSchema = z
	.string()
	.min(MIN_DESCRIPTION_LENGTH, `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`)
	.max(MAX_DESCRIPTION_LENGTH, `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`)
	.transform(sanitizeDescription)
	.refine((desc) => desc.length >= MIN_DESCRIPTION_LENGTH, {
		message: 'Description too short after removing invalid characters'
	});

const courtsSchema = z.coerce
	.number()
	.int('Number of courts must be a whole number')
	.min(MIN_COURTS, `Must have at least ${MIN_COURTS} court`)
	.max(MAX_COURTS, `Cannot exceed ${MAX_COURTS} courts`);

const poolsSchema = z.coerce
	.number()
	.int('Number of pool games must be a whole number')
	.min(MIN_POOLS, `Must have at least ${MIN_POOLS} pool game`)
	.max(MAX_POOLS, `Cannot exceed ${MAX_POOLS} pool games`);

const refsSchema = z
	.string()
	.min(1, 'Referee option is required')
	.refine((refs) => VALID_REF_OPTIONS.includes(refs as any), {
		message: `Referee option must be one of: ${VALID_REF_OPTIONS.join(', ')}`
	});

const scoringSchema = z
	.string()
	.min(1, 'Scoring method is required')
	.refine((scoring) => VALID_SCORING_METHODS.includes(scoring as any), {
		message: `Scoring method must be one of: ${VALID_SCORING_METHODS.join(', ')}`
	});

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
	description: z.string().max(500, 'Description too long'),
	courts: z.coerce.number().int().min(1).max(20),
	pools: z.coerce.number().int().min(1).max(50),
	refs: z.enum(['teams', 'provided']),
	scoring: z.enum(['points', 'wins']),
	date: z.string().optional(),
	id: z.coerce.number().int().positive().optional(),
	owner: z.string().uuid().optional()
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
