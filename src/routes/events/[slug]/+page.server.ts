import { superValidate } from 'sveltekit-superforms';
import { formSchema as settingsSchema } from '$schemas/settingsSchema';
import { formSchema as teamsSchema } from '$schemas/teamsSchema';
import { eventsUpdateSchema } from '$schemas/supabase';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { Event } from '$lib/event.svelte';
import { EventSupabaseDatabaseService } from '$lib/database/event';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { TeamsSupabaseDatabaseService } from '$lib/database/teams';
import { Teams } from '$lib/teams.svelte';

export const load: PageServerLoad = async ({ locals }) => {
	const { data } = await locals.supabase.auth.getUser();

	return {
		user: data?.user
	};
};

export const actions: Actions = {
	updateEvent: async (event) => {
		const form = await superValidate(event, zod4(settingsSchema));
		if (!form.valid) return fail(400, { form });

		const eventId = Number(event.params.slug);
		if (!event.params.slug) throw new Error('Slug is undefined');

		const eventSupabaseDatabaseService = new EventSupabaseDatabaseService(event.locals.supabase);
		const tournament = new Event(eventSupabaseDatabaseService);

		try {
			const updatedTournament = await tournament.update(eventId, form.data);
			const parsedData = eventsUpdateSchema.parse(updatedTournament);
			form.data = parsedData as typeof form.data;
			return { form };
		} catch (error) {
			form.valid = false;
			console.error(error);

			if (error instanceof ZodError) {
				const validationError = fromZodError(error);
				form.message = validationError.message;
			} else if (error instanceof Error) {
				form.message = error.message;
			} else {
				form.message = 'An unexpected error occurred.';
			}

			return fail(400, { form });
		}
	},

	createEvent: async (event) => {
		const form = await superValidate(event, zod4(settingsSchema));
		if (!form.valid) return fail(400, { form });

		const eventSupabaseDatabaseService = new EventSupabaseDatabaseService(event.locals.supabase);
		const tournament = new Event(eventSupabaseDatabaseService);

		let newId: number;

		try {
			const res = await tournament.create(form.data);
			if (res?.id) {
				newId = res.id;
			} else {
				form.valid = false;
				form.message = 'Failed to create event';
				return fail(400, { form });
			}
		} catch (error) {
			form.valid = false;
			console.error(error);

			if (error instanceof ZodError) {
				const validationError = fromZodError(error);
				form.message = validationError.message;
			} else if (error instanceof Error) {
				form.message = error.message;
			} else {
				form.message = 'An unexpected error occurred.';
			}

			return fail(400, { form });
		}

		redirect(303, `/events/${newId}`);
	},

	deleteEvent: async (event) => {
		const eventId = Number(event.params.slug);
		const eventSupabaseDatabaseService = new EventSupabaseDatabaseService(event.locals.supabase);
		const tournament = new Event(eventSupabaseDatabaseService);

		try {
			await tournament.load(eventId);
			await tournament.delete();
		} catch (error) {
			console.error(error);
			return fail(400, {});
		}

		redirect(303, '/protected-routes/dashboard');
	},

	createTeam: async (event) => {
		const form = await superValidate(event, zod4(teamsSchema));
		if (!form.valid) return fail(400, { form });

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
			console.error(error);

			if (error instanceof ZodError) {
				const validationError = fromZodError(error);
				form.message = validationError.message;
			} else if (error instanceof Error) {
				form.message = error.message;
			} else {
				form.message = 'An unexpected error occurred.';
			}

			return fail(400, { form });
		}
	}
};
