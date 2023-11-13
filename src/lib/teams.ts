// Handle our team related code
import { state } from '$lib/stores';
import { get } from 'svelte/store';
import type { Database } from '../types/supabase';

/*
 * Handle checking our store first and then making a request if we have no session values.
 *
 * @param handle - Our Supabase db connection
 * @param league - League the team(s) belong to
 * @param member - String value for a member ID if only want the teams a profile is a member for
 * @param active - By default only active teams are retrieved, pass FALSE to retrieve all teams
 * @returns A list of teams
 */
export async function getAllTeams(
	handle: any,
	league: string,
	member?: string,
	active: boolean = true
): Promise<Database[]> {
	let loadedTeams: memberType[] = [];

	let currentState: any = get(state);
	// TODO! Cache this result in store and check store
	if (member) {
		// Select all teams that we are currently a member of
		const { data: teams } = await handle
			.from('team')
			.select(
				`name,
                team_member!inner(
                    profile(
                        name
                    )
                )`
			)
			.eq('team_member.user_id', member)
			.throwOnError();

		loadedTeams = teams;
	} else {
		if (currentState?.teams) {
			return currentState.teams;
		}
		// Just load all teams -- Eventually need to check session/active teams
		let query = handle.from('team').select('*').eq('league', league);
		if (active) {
			query = query.eq('state', 'active');
		}

		let { data: teams, error } = await query;

		if (error) {
			console.error(error);
		} else {
			loadedTeams = teams;
			state.set({
				league: {
					teams: teams,
					...currentState?.[league]
				},
				...currentState
			});
		}
	}
	return loadedTeams;
}
