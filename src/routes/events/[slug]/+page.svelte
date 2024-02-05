<script lang="ts">
	import type { PageData } from '$types';
	import { Event } from '$lib/event';
	import { Matches as MatchesInstance } from '$lib/matches';
	import { Teams } from '$lib/teams';
	import Matches from '$lib/components/tournament/Matches.svelte';
	import Bracket from '$lib/components/tournament/Bracket.svelte';
	import { SupabaseDatabaseService } from '$lib/supabaseDatabaseService';
	import { loadInitialData } from '$lib/helper';
	import Standings from '$lib/components/tournament/Standings.svelte';
	import { Tabs, TabItem } from 'flowbite-svelte';
	import { Label, Select } from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	export let data: PageData;

	const databaseService = new SupabaseDatabaseService(data?.supabase);
	const tournament = new Event(data.event_id, databaseService);
	let matches = new MatchesInstance(data.event_id, databaseService);
	const teams = new Teams(data.event_id, databaseService);

	const loadingInitialDataPromise = loadInitialData(tournament, $matches, teams);
	let defaultTeam = data.default_team;

	function updateHistory() {
		if (browser) {
			$page.url.searchParams.set('team', defaultTeam);
			const url = $page.url.href;
			window.history.replaceState({}, '', url);
		}
	}

	$: defaultTeam, updateHistory();
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
				items={teams.teams
					.map((team) => {
						return { value: team.name, name: team.name };
					})
					.concat([{ value: '', name: 'none' }])}
				bind:value={defaultTeam}
			/>
		</Label>
		<Tabs>
			<TabItem open title="matches">
				<Matches {tournament} {matches} {teams} readOnly={true} {defaultTeam} />
			</TabItem>

			<TabItem title="standings">
				<Standings event={tournament} bind:matches {teams} {defaultTeam} />
			</TabItem>

			<TabItem title="Bracket">
				<Bracket {tournament} {matches} {teams} />
			</TabItem>
		</Tabs>
	</div>
{/await}
