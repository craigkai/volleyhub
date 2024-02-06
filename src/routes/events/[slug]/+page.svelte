<script lang="ts">
	import type { PageData } from '$types';
	import { Event } from '$lib/event';
	import { Matches as MatchesInstance } from '$lib/matches';
	import { Teams } from '$lib/teams';
	import Matches from '$lib/components/tournament/Matches.svelte';
	import Bracket from '$lib/components/tournament/Bracket.svelte';
	import { EventSupabaseDatabaseService } from '$lib/database/event';
	import { MatchesSupabaseDatabaseService } from '$lib/database/matches';
	import { TeamsSupabaseDatabaseService } from '$lib/database/teams';
	import { loadInitialData } from '$lib/helper';
	import Standings from '$lib/components/tournament/Standings.svelte';
	import { Tabs, TabItem } from 'flowbite-svelte';
	import { Label, Select } from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { pushState } from '$app/navigation';

	export let data: PageData;

	const eventSupabaseDatabaseService = new EventSupabaseDatabaseService(data?.supabase);
	const tournament = new Event(data.event_id, eventSupabaseDatabaseService);

	const matchesSupabaseDatabaseService = new MatchesSupabaseDatabaseService(data?.supabase);
	let matches = new MatchesInstance(data.event_id, matchesSupabaseDatabaseService);

	const teamsSupabaseDatabaseService = new TeamsSupabaseDatabaseService(data?.supabase);
	const teams = new Teams(data.event_id, teamsSupabaseDatabaseService);

	const loadingInitialDataPromise = loadInitialData(tournament, $matches, teams);
	let defaultTeam = data.default_team;

	function updateHistory() {
		if (browser) {
			$page.url.searchParams.set('team', defaultTeam);
			const url = $page.url.href;
			pushState(url, '');
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
