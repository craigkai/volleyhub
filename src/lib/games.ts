import type { SupabaseClient } from "@supabase/supabase-js";

/*
Get all the games for a league, by default only returns active teams games.
*/
export async function getGames(handle: SupabaseClient, league: string, active: boolean = true) {
    let { data: teams, error } = await handle.from('games').select(`
    `);
    if (error) {
        console.error(error);
    } else {
        loadedTeams = teams;
        state.set({ "teams": teams });
    }
}
