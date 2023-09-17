// Handle our team related code
import type { Database } from '../types/supabase';
import { state } from '$lib/stores';
import { get } from 'svelte/store';

type memberType = Database['public']['Tables']['teams']['Row'];

/*
Handle checking our store first and then making a request if we have no
session values.
*/
export async function getAllTeams(handle: any, member?: string) {
    let loadedTeams: memberType[] = [];

    let currentState = get(state);

    // TODO! Cache this result in store and check store
    if (member) {
        console.log("HERE")
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
        let { data: teams, error } = await handle.from('team').select();
        if (error) {
            console.error(error);
        } else {
            loadedTeams = teams;
            state.set({ "teams": teams });
        }
    }
    return loadedTeams;
}
