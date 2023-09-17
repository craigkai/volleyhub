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

	$: if (data?.supabase) {
		loadData();
	}
</script>

<ul>
	{#each ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as day}
		{@const teamsForToday = loadedTeams.filter((t) => t.day === day)}
		<div class="bg-purple-200">
			{day}:
			{#if teamsForToday.length > 0}
				{@const levels = Object.keys(
					teamsForToday.reduce((accumulator, currentValue) => {
						accumulator[currentValue.level] = 1;
						return accumulator;
					}, {})
				)}
				{#each levels as level}
					{@const teamsForLevel = teamsForToday.filter((t) => t.level === level)}
					<div class="bg-green-200 m-2 p-2">
						{level}:
						<div class="m-2 bg-blue-200 p-2">
							{#each teamsForLevel as team}
								<li>{team.name}</li>
							{/each}
						</div>
					</div>
				{/each}
			{/if}
		</div>
	{/each}
</ul>
