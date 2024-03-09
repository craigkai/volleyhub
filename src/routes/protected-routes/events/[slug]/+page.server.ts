import { superValidate } from 'sveltekit-superforms';
import { formSchema as settingsSchema } from '$schemas/settingsSchema';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
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

		const event_id = event.params.slug as unknown as number;

		const eventSupabaseDatabaseService = new EventSupabaseDatabaseService(event.locals.supabase);
		let tournament = new Event(event_id, eventSupabaseDatabaseService);
		tournament.id = Number(tournament.id);

		try {
			await tournament.update(Number(event_id), tournament);

			return {
				form
			};
		} catch (error) {
			form.valid = false;

			const validationError = fromZodError(error);

			form.message = validationError.message;

			return fail(400, {
				form
			});
		}
	}
};
