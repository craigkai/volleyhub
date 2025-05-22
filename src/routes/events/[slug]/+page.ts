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
			readOnly: !data.user?.id,
			eventId: params.slug,
			form,
			defaultTeam: url.searchParams.get('team'),
			teams: {
				eventId: 'create',
				teams: [],
				create: async () => {},
				update: async () => {},
				delete: async () => {}
			},
			matches: null,
			bracket: null
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
		{
			...tournament,
			name: tournament.name,
			date: tournament.date,
			pools: tournament.pools,
			courts: tournament.courts,
			scoring: tournament.scoring,
			refs: tournament.refs
		},
		zod(settingsSchema)
	);

	return {
		readOnly,
		eventId: params.slug,
		form,
		tournament,
		matches,
		teams,
		bracket,
		defaultTeam: url.searchParams.get('team')
	};
};
