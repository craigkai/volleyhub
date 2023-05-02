<!-- Teams that the provided user is a member of -->
<script lang="ts">
	import type { Database } from '../types/supabase';
	import type { PageData } from './$types';

	type memberType = Database['public']['Tables']['teams']['Row'];

	export let data: PageData;
	// Optional member query value, if member is provided then we can limit the
	// teams that we return etc etc.
	export let member: any | null = null;

	var loadedTeams: memberType[] = [];
	async function loadData() {
		if (member) {
			// Select all teams that we are currently a member of
			const { data: teams, error } = await data.supabase
				.from('team')
				.select(
					`name,
                    team_member!inner(
                        profile(
                            name
                        )
                    )`
				)
				.eq('team_member.user_id', data.session.user.id)
				.throwOnError();

			loadedTeams = teams;
		} else {
			// Just load all teams -- Eventually need to check session/active teams
			let { data: teams, error } = await data.supabase.from('team').select();
			if (error) {
				console.error(error);
			} else {
				loadedTeams = teams;
			}
		}
	}

	$: if (data?.session) {
		loadData();
	}
</script>

<ul>
	{#each loadedTeams as team}
		<li>{team.name}</li>
	{/each}
</ul>
