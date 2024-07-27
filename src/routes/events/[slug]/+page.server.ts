import { superValidate } from 'sveltekit-superforms';
import { formSchema as settingsSchema } from '$schemas/settingsSchema';
import { formSchema as teamsSchema } from '$schemas/teamsSchema';
import { eventsInsertSchema, eventsUpdateSchema, teamsInsertSchema } from '$schemas/supabase';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad, Actions } from './$types';
import { fail, isHttpError, redirect, error } from '@sveltejs/kit';
import { Event } from '$lib/event.svelte';
import { EventSupabaseDatabaseService } from '$lib/database/event.svelte';
import type { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { Teams } from '$lib/teams.svelte';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		user: locals.user
	};
};

export const actions: Actions = {
	updateEvent: async (event) => {
		const form = await superValidate(event, zod(settingsSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const event_id = Number(event.params.slug);

		if (!event.params.slug) {
			throw new Error('Slug is undefined');
		}
		const tournament = new Event();
		try {
			await tournament.load(event_id);
		} catch (error) {
			return fail(404, {
				form
			});
		}

		try {
			await tournament.update(event_id, form.data);
			// @ts-ignore
			form.data = eventsUpdateSchema.parse(tournament);

			return {
				form
			};
		} catch (error) {
			form.valid = false;

			const validationError = fromZodError(error as ZodError<typeof eventsUpdateSchema>);
			form.message = validationError.message;

			return fail(400, {
				form
			});
		}
	},

	createEvent: async (event) => {
		const form = await superValidate(event, zod(settingsSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const event_id = event.params.slug;

		if (!event.params.slug) {
			throw new Error('Slug is undefined');
		}

		const eventSupabaseDatabaseService = new EventSupabaseDatabaseService(event.locals.supabase);
		const tournament = new Event();
		try {
			await tournament.load(event_id as unknown as number, eventSupabaseDatabaseService);
		} catch (error) {
			return fail(404, {
				form
			});
		}

		let newId: number;
		try {
			const res = await tournament.create(form.data);
			if (!res || !res.id) {
				error(500, 'Failed to create event');
			}
			newId = res.id;
		} catch (err) {
			form.valid = false;

			const validationError = fromZodError(err as ZodError<typeof eventsInsertSchema>);
			form.message = validationError.message;

			return fail(400, {
				form
			});
		}

		redirect(303, `/events/${newId}`);
	},

	deleteEvent: async (event) => {
		const event_id = Number(event.params.slug);

		const tournament = new Event();
		try {
			await tournament.load(event_id as unknown as number);
		} catch (err) {
			if (isHttpError(err)) {
				return error(400, err.body.message);
			} else {
				error(500, JSON.stringify(err));
			}
		}

		// TODO: How do we handle delete failure?
		try {
			await tournament.delete();
		} catch (err) {
			if (isHttpError(err)) {
				error(err.status, err.body.message);
			} else {
				error(500, JSON.stringify(err));
			}
		}

		redirect(303, '/protected-routes/dashboard');
	},

	createTeam: async (event) => {
		const form = await superValidate(event, zod(teamsSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const event_id = Number(event.params.slug);

		const teams = new Teams();
		try {
			teams.load(event_id);
		} catch (err) {
			error(500, JSON.stringify(err));
		}

		try {
			const newTeam: Partial<TeamRow> = {
				name: form.data.name,
				event_id
			};
			await teams.create(newTeam);
			return { form };
		} catch (err) {
			form.valid = false;

			const validationError = fromZodError(err as ZodError<typeof teamsInsertSchema>);
			form.message = validationError.message;

			return fail(400, {
				form
			});
		}
	}
};
