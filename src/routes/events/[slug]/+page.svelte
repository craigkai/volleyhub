<script lang="ts">
	import type { PageData } from '$types';
	import { Event } from '$lib/event';
	import { Matches as MatchesInstance } from '$lib/matches';
	import { Teams } from '$lib/teams';
	import Matches from '$components/Matches.svelte';
	import Bracket from '$components/Bracket.svelte';
	import { EventSupabaseDatabaseService } from '$lib/database/event';
	import { MatchesSupabaseDatabaseService } from '$lib/database/matches';
	import { TeamsSupabaseDatabaseService } from '$lib/database/teams';
	import { loadInitialData } from '$lib/helper';
	import Standings from '$components/Standings.svelte';
	import { Tabs, TabItem, Label, Select, Spinner } from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { pushState } from '$app/navigation';
	import { onMount, tick } from 'svelte';
	import { Brackets } from '$lib/brackets';

	export let data: PageData;

	const eventSupabaseDatabaseService = new EventSupabaseDatabaseService(data?.supabase);
	const tournament = new Event(data.event_id, eventSupabaseDatabaseService);

	const matchesSupabaseDatabaseService = new MatchesSupabaseDatabaseService(data?.supabase);
	let matches = new MatchesInstance(data.event_id, matchesSupabaseDatabaseService);

	const teamsSupabaseDatabaseService = new TeamsSupabaseDatabaseService(data?.supabase);
	const teams = new Teams(data.event_id, teamsSupabaseDatabaseService);

	const bracket = new Brackets(data.event_id, matchesSupabaseDatabaseService);

	const loadingInitialDataPromise = loadInitialData(tournament, $matches, teams, bracket);
	let defaultTeam = data.default_team;

	let historyReady = false;
	onMount(async () => {
		await tick();
		historyReady = true;
	});

	function updateHistory() {
		if (browser && historyReady) {
			$page.url.searchParams.set('team', defaultTeam);
			const url = $page.url.href;
			pushState(url, '');
		}
	}

	$: defaultTeam, updateHistory();
</script>

<div class="flex flex-col items-center">
	{#await loadingInitialDataPromise}
		<div class="h-screen flex flex-col items-center place-content-center">
			<Spinner />
		</div>
	{:then}
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
				<Bracket {tournament} {bracket} {teams} {matches} />
			</TabItem>
		</Tabs>
	{/await}
</div>
