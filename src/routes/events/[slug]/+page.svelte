<script lang="ts">
	import type { PageData } from '$types';
	import { Event } from '$lib/event';
	import { Matches as MatchesInstance } from '$lib/matches';
	import { Teams } from '$lib/teams';
	import Matches from '$lib/components/tournament/Matches.svelte';
	import { SupabaseDatabaseService } from '$lib/supabaseDatabaseService';
	import { loadInitialData } from '$lib/helper';
	import Standings from '$lib/components/tournament/Standings.svelte';
	import { Tabs, TabItem } from 'flowbite-svelte';
	import { Label, Select } from 'flowbite-svelte';

	export let data: PageData;

	const databaseService = new SupabaseDatabaseService(data?.supabase);
	const tournament = new Event(data.event_id, databaseService);
	const matches = new MatchesInstance(data.event_id, databaseService);
	const teams = new Teams(data.event_id, databaseService);

	const loadingInitialDataPromise = loadInitialData(tournament, $matches, teams);
	let defaultTeam = data.default_team;
</script>

{#await loadingInitialDataPromise}
	loading...
{:then}
	<div class="flex flex-col items-center">
		{tournament?.name}

		<Label class="m-2">
			Select a team:
			<Select
				class="mt-2"
				items={teams.teams.map((team) => {
					return { value: team.name, name: team.name };
				})}
				bind:value={defaultTeam}
			/>
		</Label>
		<Tabs>
			<TabItem open title="matches">
				<Matches {tournament} {matches} {teams} readOnly={true} {defaultTeam} />
			</TabItem>

			<TabItem title="standings">
				<Standings event={tournament} {matches} {teams} />
			</TabItem>
		</Tabs>
	</div>
{/await}
