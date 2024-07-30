import { superValidate } from 'sveltekit-superforms';
import { formSchema as settingsSchema } from '$schemas/settingsSchema';
import { formSchema as teamsSchema } from '$schemas/teamsSchema';
import { eventsInsertSchema, eventsUpdateSchema, teamsInsertSchema } from '$schemas/supabase';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { Event } from '$lib/event.svelte';
import { EventSupabaseDatabaseService } from '$lib/database/event';
import type { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { TeamsSupabaseDatabaseService } from '$lib/database/teams';
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

		const eventId = Number(event.params.slug);

		if (!event.params.slug) {
			throw new Error('Slug is undefined');
		}
		const eventSupabaseDatabaseService = new EventSupabaseDatabaseService(event.locals.supabase);
		const tournament = new Event(eventSupabaseDatabaseService);

		try {
			const updatedTournament = await tournament.update(eventId, form.data);

			// Parse the updated tournament data
			const parsedData = eventsUpdateSchema.parse(updatedTournament);

			// Update the form data with the parsed and updated values
			form.data = parsedData;
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

		const eventSupabaseDatabaseService = new EventSupabaseDatabaseService(event.locals.supabase);
		const tournament = new Event(eventSupabaseDatabaseService);

		let newId: number;

		try {
			const res = await tournament.create(form.data);
			if (res.id) {
				newId = res.id;
				redirect(303, `/events/${newId}`);
			} else {
				form.valid = false;
				form.message = 'Failed to create event';

				return fail(400, {
					form
				});
			}
		} catch (error) {
			form.valid = false;

			const validationError = fromZodError(error as ZodError<typeof eventsInsertSchema>);
			form.message = validationError.message;

			return fail(400, {
				form
			});
		}
	},

	deleteEvent: async (event) => {
		const eventId = Number(event.params.slug);

		const eventSupabaseDatabaseService = new EventSupabaseDatabaseService(event.locals.supabase);
		const tournament = new Event(eventSupabaseDatabaseService);
		try {
			await tournament.load(eventId);

			// TODO: How do we handle delete failure?
			await tournament.delete();
		} catch (error) {
			return fail(400, {});
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

		const eventId = Number(event.params.slug);

		const teamsSupabaseDatabaseService = new TeamsSupabaseDatabaseService(event.locals.supabase);
		const teams = new Teams(teamsSupabaseDatabaseService);

		try {
			const newTeam: Partial<TeamRow> = {
				name: form.data.name,
				event_id: eventId
			};
			await teams.create(newTeam);
			return { form };
		} catch (error) {
			form.valid = false;

			const validationError = fromZodError(error as ZodError<typeof teamsInsertSchema>);
			form.message = validationError.message;

			return fail(400, {
				form
			});
		}
	}
};
