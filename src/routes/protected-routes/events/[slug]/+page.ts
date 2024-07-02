import type { PageLoad } from './$types';
import { superValidate, type Infer, type SuperValidated } from 'sveltekit-superforms';
import { formSchema as settingsSchema, type FormSchema } from '$schemas/settingsSchema';
import { zod } from 'sveltekit-superforms/adapters';
import { initiateEvent } from '$lib/helper.svelte';

export const load: PageLoad = async ({ params, parent, url }) => {
	const { supabase } = await parent();

	let { tournament, matches, teams, bracket } = await initiateEvent(
		params.slug as unknown as number,
		supabase
	);

	if (params.slug === 'create') {
		const form: SuperValidated<Infer<FormSchema>> = await superValidate(zod(settingsSchema));

		return {
			event_id: params.slug,
			form,
			tournament,
			matches,
			teams,
			bracket,
			default_team: url.searchParams.get('team')
		};
	}

	const form: SuperValidated<Infer<FormSchema>> = await superValidate(
		tournament,
		zod(settingsSchema)
	);

	return {
		event_id: params.slug,
		form,
		tournament,
		matches,
		teams,
		bracket,
		default_team: url.searchParams.get('team')
	};
};
