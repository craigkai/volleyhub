import type { PageLoad } from './$types';
import { superValidate, type Infer, type SuperValidated } from 'sveltekit-superforms';
import { formSchema as settingsSchema, type FormSchema } from '$schemas/settingsSchema';
import { zod } from 'sveltekit-superforms/adapters';
import { initiateEvent } from '$lib/helper.svelte';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params, parent, url, data }) => {
	const { supabase } = await parent();

	const eventId = params.slug === 'create' ? 'create' : parseInt(params.slug, 10);

	// Validate eventId
	if (eventId !== 'create' && (isNaN(eventId) || eventId <= 0)) {
		error(400, 'Invalid eventId: must be a positive integer or "create".');
	}

	if (eventId === 'create') {
		const form: SuperValidated<Infer<FormSchema>> = await superValidate(zod(settingsSchema));

		return {
			// Only logged in users can create events
			readOnly: !data.user?.id,
			event_id: params.slug,
			form,
			defaultTeam: url.searchParams.get('team')
		};
	}

	let res;
	try {
		res = await initiateEvent(eventId, supabase);
	} catch (err) {
		console.error('Error initiating event:', err);
		error(500, 'Failed to load event');
	}

	if (!res) {
		error(404, 'Event not found');
	}

	const { tournament, matches, teams, bracket } = res;

	const isOwner = data.user?.id && data.user?.id === tournament?.owner;

	const readOnly = !isOwner;

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
