// Generated by ts-to-zod
import { z } from 'zod';
import { Json } from './supabase';

export const jsonSchema: z.ZodSchema<Json> = z.lazy(() =>
	z
		.union([
			z.string(),
			z.number(),
			z.boolean(),
			z.record(z.union([jsonSchema, z.undefined()])),
			z.array(jsonSchema)
		])
		.nullable()
);

export const eventsRowSchema = z.object({
	courts: z.number().nullable(),
	created_at: z.string(),
	date: z.string().nullable(),
	id: z.number(),
	name: z.string(),
	owner: z.string(),
	pools: z.number().nullable(),
	refs: z.string().nullable(),
	scoring: z.string().nullable()
});

export const eventsInsertSchema = z.object({
	courts: z.number().optional().nullable(),
	created_at: z.string().optional(),
	date: z.string().optional().nullable(),
	id: z.number().optional(),
	name: z.string(),
	owner: z.string(),
	pools: z.number().optional().nullable(),
	refs: z.string().optional().nullable(),
	scoring: z.string().optional().nullable()
});

export const eventsUpdateSchema = z.object({
	courts: z.number().optional().nullable(),
	created_at: z.string().optional(),
	date: z.string().optional().nullable(),
	id: z.number().optional(),
	name: z.string().optional(),
	owner: z.string().optional(),
	pools: z.number().optional().nullable(),
	refs: z.string().optional().nullable(),
	scoring: z.string().optional().nullable()
});

export const matchStateSchema = z.union([z.literal('COMPLETE'), z.literal('INCOMPLETE')]);

export const matchesInsertSchema = z.object({
	child_id: z.number().optional().nullable(),
	court: z.number().optional(),
	created_at: z.string().optional(),
	event_id: z.number(),
	id: z.number().optional(),
	ref: z.number().optional().nullable(),
	round: z.number().optional(),
	state: matchStateSchema.optional(),
	team1: z.number().optional().nullable(),
	team1_score: z.number().optional().nullable(),
	team2: z.number().optional().nullable(),
	team2_score: z.number().optional().nullable(),
	type: z.string().optional()
});

export const matchesUpdateSchema = z.object({
	child_id: z.number().optional().nullable(),
	court: z.number().optional(),
	created_at: z.string().optional(),
	event_id: z.number().optional(),
	id: z.number().optional(),
	ref: z.number().optional().nullable(),
	round: z.number().optional(),
	state: matchStateSchema.optional(),
	team1: z.number().optional().nullable(),
	team1_score: z.number().optional().nullable(),
	team2: z.number().optional().nullable(),
	team2_score: z.number().optional().nullable(),
	type: z.string().optional()
});

export const teamsRowSchema = z.object({
	created_at: z.string().nullable(),
	event_id: z.number().nullable(),
	id: z.number(),
	name: z.string(),
	state: z.string().nullable()
});

export const teamsInsertSchema = z.object({
	created_at: z.string().optional().nullable(),
	event_id: z.number().optional().nullable(),
	id: z.number().optional(),
	name: z.string(),
	state: z.string().optional().nullable()
});

export const teamsUpdateSchema = z.object({
	created_at: z.string().optional().nullable(),
	event_id: z.number().optional().nullable(),
	id: z.number().optional(),
	name: z.string().optional(),
	state: z.string().optional().nullable()
});

export const stageTypeSchema = z.union([
	z.literal('ROUND_ROBIN'),
	z.literal('SINGLE_ELIMINATION'),
	z.literal('DOUBLE_ELIMINATION')
]);

export const matchesRowSchema = z.object({
	child_id: z.number().nullable(),
	court: z.number(),
	created_at: z.string(),
	event_id: z.number(),
	id: z.number(),
	ref: z.number().nullable(),
	round: z.number(),
	state: matchStateSchema,
	team1: z.number().nullable(),
	team1_score: z.number().nullable(),
	team2: z.number().nullable(),
	team2_score: z.number().nullable(),
	type: z.string()
});
