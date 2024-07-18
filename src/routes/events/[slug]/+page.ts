import type { PageLoad } from './$types';
import { superValidate, type Infer, type SuperValidated } from 'sveltekit-superforms';
import { formSchema as settingsSchema, type FormSchema } from '$schemas/settingsSchema';
import { zod } from 'sveltekit-superforms/adapters';
import { initiateEvent } from '$lib/helper.svelte';

export const load: PageLoad = async ({ params, parent, url, data }) => {
	const { supabase } = await parent();

	const { tournament, matches, teams, bracket } = await initiateEvent(
		params.slug as unknown as number,
		supabase
	);

	const isOwner = data.user?.id && data.user?.id === tournament?.owner;

	const readOnly = !isOwner;

	if (params.slug === 'create') {
		const form: SuperValidated<Infer<FormSchema>> = await superValidate(zod(settingsSchema));

		return {
			// Only logged in users can create events
			readOnly: !data.user?.id,
			event_id: params.slug,
			form,
			tournament,
			matches,
			teams,
			bracket,
			defaultTeam: url.searchParams.get('team')
		};
	}

	const form: SuperValidated<Infer<FormSchema>> = await superValidate(
		tournament,
		zod(settingsSchema)
	);

	return {
		readOnly,
		event_id: params.slug,
		form,
		tournament,
		matches,
		teams,
		bracket,
		defaultTeam: url.searchParams.get('team')
	};
};
