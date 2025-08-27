import { z } from 'zod';

// Constants for match validation
const MAX_SCORE = 999;
const MIN_SCORE = 0;
const MAX_SETS = 5;
const MIN_SETS = 1;
const MAX_ROUND = 100;
const MIN_ROUND = 0;
const MAX_COURT = 50;
const MIN_COURT = 0;

// Valid match states
const VALID_MATCH_STATES = ['INCOMPLETE', 'COMPLETE', 'CANCELLED', 'IN_PROGRESS'] as const;

// Score validation schema
const scoreSchema = z.coerce
	.number()
	.int('Score must be a whole number')
	.min(MIN_SCORE, `Score cannot be negative`)
	.max(MAX_SCORE, `Score cannot exceed ${MAX_SCORE}`);

// Team ID validation
const teamIdSchema = z.coerce
	.number()
	.int('Team ID must be an integer')
	.positive('Team ID must be positive')
	.max(2147483647, 'Team ID is too large');

// Round validation
const roundSchema = z.coerce
	.number()
	.int('Round must be an integer')
	.min(MIN_ROUND, `Round must be at least ${MIN_ROUND}`)
	.max(MAX_ROUND, `Round cannot exceed ${MAX_ROUND}`);

// Court validation
const courtSchema = z.coerce
	.number()
	.int('Court must be an integer')
	.min(MIN_COURT, `Court must be at least ${MIN_COURT}`)
	.max(MAX_COURT, `Court cannot exceed ${MAX_COURT}`);

// Match state validation
const stateSchema = z.string().refine((state) => VALID_MATCH_STATES.includes(state as any), {
	message: `Match state must be one of: ${VALID_MATCH_STATES.join(', ')}`
});

// Individual set score validation
const setScoreSchema = z
	.object({
		team1: scoreSchema,
		team2: scoreSchema,
		set_number: z.coerce
			.number()
			.int()
			.min(1, 'Set number must be at least 1')
			.max(MAX_SETS, `Set number cannot exceed ${MAX_SETS}`)
	})
	.refine(
		(set) => {
			// Volleyball scoring rules validation
			const { team1, team2 } = set;

			// Basic win condition (first to reach certain points with 2-point margin)
			if (Math.max(team1, team2) >= 25) {
				return Math.abs(team1 - team2) >= 2;
			}

			// Allow incomplete sets (both scores < 25)
			return true;
		},
		{
			message: 'Invalid volleyball set score - winner must lead by at least 2 points'
		}
	);

// Main match validation schema
export const matchSchema = z
	.object({
		id: z.coerce
			.number()
			.int('Match ID must be an integer')
			.positive('Match ID must be positive')
			.optional(),

		event_id: z.coerce
			.number()
			.int('Event ID must be an integer')
			.positive('Event ID must be positive')
			.max(2147483647, 'Event ID is too large'),

		team1: teamIdSchema.nullable(),
		team2: teamIdSchema.nullable(),

		team1_score: scoreSchema.default(0),
		team2_score: scoreSchema.default(0),

		round: roundSchema,
		court: courtSchema,

		state: stateSchema.default('INCOMPLETE'),

		referee: teamIdSchema.nullable().optional(),

		start_time: z.string().datetime({ message: 'Start time must be a valid datetime' }).optional(),

		end_time: z.string().datetime({ message: 'End time must be a valid datetime' }).optional(),

		notes: z
			.string()
			.max(1000, 'Notes cannot exceed 1000 characters')
			.transform((notes) => notes?.trim().replace(/[<>]/g, '') || '')
			.optional()
	})
	.refine(
		(match) => {
			// Ensure both teams are different
			if (match.team1 && match.team2) {
				return match.team1 !== match.team2;
			}
			return true;
		},
		{
			message: 'Team 1 and Team 2 must be different teams',
			path: ['team2']
		}
	)
	.refine(
		(match) => {
			// If match is complete, both teams must be assigned
			if (match.state === 'COMPLETE') {
				return match.team1 !== null && match.team2 !== null;
			}
			return true;
		},
		{
			message: 'Complete matches must have both teams assigned',
			path: ['state']
		}
	)
	.refine(
		(match) => {
			// End time must be after start time
			if (match.start_time && match.end_time) {
				return new Date(match.end_time) > new Date(match.start_time);
			}
			return true;
		},
		{
			message: 'End time must be after start time',
			path: ['end_time']
		}
	);

// Match creation schema (for new matches)
export const createMatchSchema = matchSchema.omit({ id: true });

// Match update schema (partial updates allowed)
export const updateMatchSchema = matchSchema.partial().extend({
	id: z.coerce.number().int().positive('Match ID is required for updates')
});

// Score update schema (for live scoring)
export const scoreUpdateSchema = z
	.object({
		match_id: z.coerce.number().int().positive('Match ID is required'),
		team1_score: scoreSchema,
		team2_score: scoreSchema,
		state: stateSchema.optional()
	})
	.refine(
		(update) => {
			// At least one team should have scored if updating scores
			return update.team1_score > 0 || update.team2_score > 0;
		},
		{
			message: 'At least one team must have a score greater than 0'
		}
	);

// Bulk match creation schema
export const bulkMatchSchema = z.object({
	event_id: z.coerce.number().int().positive(),
	matches: z
		.array(createMatchSchema)
		.min(1, 'At least 1 match required')
		.max(1000, 'Maximum 1000 matches allowed'),
	overwrite_existing: z.boolean().default(false)
});

// Match search/filter schema
export const matchSearchSchema = z.object({
	event_id: z.coerce.number().int().positive().optional(),
	team_id: teamIdSchema.optional(),
	round: roundSchema.optional(),
	court: courtSchema.optional(),
	state: stateSchema.optional(),
	date_from: z.string().datetime().optional(),
	date_to: z.string().datetime().optional()
});

// Match statistics schema
export const matchStatsSchema = z.object({
	match_id: z.coerce.number().int().positive(),
	include_sets: z.boolean().default(false),
	include_timeline: z.boolean().default(false)
});

export type MatchSchema = typeof matchSchema;
export type CreateMatchSchema = typeof createMatchSchema;
export type UpdateMatchSchema = typeof updateMatchSchema;
export type ScoreUpdateSchema = typeof scoreUpdateSchema;
export type BulkMatchSchema = typeof bulkMatchSchema;
export type MatchSearchSchema = typeof matchSearchSchema;
export type MatchStatsSchema = typeof matchStatsSchema;
export type SetScoreSchema = typeof setScoreSchema;
