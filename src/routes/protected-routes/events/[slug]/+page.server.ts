import { superValidate } from 'sveltekit-superforms';
import { formSchema as settingsSchema } from '$schemas/settingsSchema';
import { eventsInsertSchema, eventsUpdateSchema } from '$schemas/supabase';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { Event } from '$lib/event';
import { EventSupabaseDatabaseService } from '$lib/database/event';
import type { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

export const load: PageServerLoad = async ({ params }) => {
	return {
		event_id: params.slug,
		form: await superValidate(zod(settingsSchema))
	};
};

export const actions: Actions = {
	settings: async (event) => {
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
		const eventSupabaseDatabaseService = new EventSupabaseDatabaseService(event.locals.supabase);
		let tournament = new Event(event_id, eventSupabaseDatabaseService);

		try {
			await tournament.update(event_id, form.data);
			form.data.name = tournament.name ?? '';

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

	create: async (event) => {
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
		let tournament = new Event(event_id as unknown as number, eventSupabaseDatabaseService);

		let newId: number;
		try {
			const res = await tournament.create(form.data);
			newId = res.id;
		} catch (error) {
			form.valid = false;

			const validationError = fromZodError(error as ZodError<typeof eventsInsertSchema>);
			form.message = validationError.message;

			return fail(400, {
				form
			});
		}
		redirect(303, `/protected-routes/events/${newId}`);
	},

	delete: async (event) => {
		const event_id = Number(event.params.slug);

		const eventSupabaseDatabaseService = new EventSupabaseDatabaseService(event.locals.supabase);
		let tournament = new Event(event_id, eventSupabaseDatabaseService);

		// TODO: How do we handle delete failure?
		await tournament.delete();

		redirect(303, '/protected-routes/dashboard');
	}
};
