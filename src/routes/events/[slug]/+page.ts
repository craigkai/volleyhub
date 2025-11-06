import type { PageLoad } from './$types';
import { superValidate, type Infer, type SuperValidated } from 'sveltekit-superforms';
import { formSchema as settingsSchema, type FormSchema } from '$schemas/settingsSchema';
import { zod4 } from 'sveltekit-superforms/adapters';
import { initiateEvent } from '$lib/helper.svelte';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params, parent, url, data }) => {
	const { supabase, is_admin } = await parent();

	const eventId = params.slug === 'create' ? 'create' : parseInt(params.slug, 10);

	if (eventId !== 'create' && (isNaN(eventId) || eventId <= 0)) {
		error(400, 'Invalid eventId: must be a positive integer or "create".');
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

	const { tournament, matches, teams, bracket, players, playerStats } = res;

	const isOwner = data.user?.id && data.user?.id === tournament?.owner;
	const isAdmin = is_admin === true;

	const readOnly = eventId !== 'create' && !isOwner && !isAdmin;

	// For create, use empty form. For existing events, populate with tournament data
	const formData = eventId === 'create'
		? {
			name: '',
			description: '',
			refs: 'teams',
			scoring: 'points',
			date: ''
		}
		: {
			name: tournament.name,
			description: tournament.description || '',
			date: tournament.date || '',
			pools: tournament.pools,
			courts: tournament.courts,
			scoring: tournament.scoring || 'points',
			refs: tournament.refs || 'teams',
			format: tournament.format as 'individual' | 'fixed-teams' | undefined,
			team_size: tournament.team_size
		};

	const form: SuperValidated<Infer<FormSchema>> = await superValidate(
		formData,
		zod4(settingsSchema)
	);

	return {
		readOnly,
		eventId: params.slug,
		form,
		tournament,
		matches,
		teams,
		bracket,
		players,
		playerStats,
		defaultTeam: url.searchParams.get('team')
	};
};
