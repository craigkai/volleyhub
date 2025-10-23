import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

export const playerRowSchema = z.object({
	id: z.number(),
	created_at: z.string(),
	name: z.string(),
	event_id: z.number().nullable(),
	email: z.string().nullable(),
	phone: z.string().nullable(),
	gender: z.string().nullable(),
	skill_level: z.number().nullable(),
	state: z.string().nullable()
});

export const playerInsertSchema = z.object({
	id: z.number().optional(),
	created_at: z.string().optional(),
	name: z
		.string()
		.min(1, 'Name is required')
		.max(100, 'Name must be less than 100 characters')
		.transform((val) => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] })),
	event_id: z.number().optional().nullable(),
	email: z
		.string()
		.email('Invalid email format')
		.optional()
		.nullable()
		.or(z.literal(''))
		.transform((val) => (val === '' ? null : val)),
	phone: z.string().optional().nullable(),
	gender: z.enum(['male', 'female', 'other']).optional().nullable(),
	skill_level: z.number().min(1).max(10).optional().nullable(),
	state: z.string().optional().nullable().default('active')
});

export const playerUpdateSchema = z.object({
	id: z.number().optional(),
	created_at: z.string().optional(),
	name: z
		.string()
		.min(1, 'Name is required')
		.max(100, 'Name must be less than 100 characters')
		.transform((val) => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] }))
		.optional(),
	event_id: z.number().optional().nullable(),
	email: z
		.string()
		.email('Invalid email format')
		.optional()
		.nullable()
		.or(z.literal(''))
		.transform((val) => (val === '' ? null : val)),
	phone: z.string().optional().nullable(),
	gender: z.enum(['male', 'female', 'other']).optional().nullable(),
	skill_level: z.number().min(1).max(10).optional().nullable(),
	state: z.string().optional().nullable()
});

export const playerStatsRowSchema = z.object({
	id: z.number(),
	player_id: z.number(),
	event_id: z.number(),
	match_id: z.number(),
	points_scored: z.number(),
	points_allowed: z.number(),
	win: z.boolean(),
	created_at: z.string()
});

export const playerStatsInsertSchema = z.object({
	id: z.number().optional(),
	player_id: z.number(),
	event_id: z.number(),
	match_id: z.number(),
	points_scored: z.number().min(0).default(0),
	points_allowed: z.number().min(0).default(0),
	win: z.boolean().default(false),
	created_at: z.string().optional()
});

export const playerTeamRowSchema = z.object({
	id: z.number(),
	player_id: z.number(),
	team_id: z.number(),
	position: z.string().nullable(),
	created_at: z.string()
});

export const playerTeamInsertSchema = z.object({
	id: z.number().optional(),
	player_id: z.number(),
	team_id: z.number(),
	position: z.string().optional().nullable(),
	created_at: z.string().optional()
});
