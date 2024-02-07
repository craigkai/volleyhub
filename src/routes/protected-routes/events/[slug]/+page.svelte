<script lang="ts">
	import type { PageData } from '$types';
	import { Event as EventInstance } from '$lib/event';
	import Settings from '$lib/components/tournament/Settings.svelte';
	import Bracket from '$lib/components/tournament/Bracket.svelte';
	import { Matches as MatchesInstance } from '$lib/matches';
	import { Teams as TeamsInstance } from '$lib/teams';
	import { EventSupabaseDatabaseService } from '$lib/database/event';
	import { MatchesSupabaseDatabaseService } from '$lib/database/matches';
	import { TeamsSupabaseDatabaseService } from '$lib/database/teams';
	import Standings from '$lib/components/tournament/Standings.svelte';
	import Matches from '$lib/components/tournament/Matches.svelte';
	import Teams from '$lib/components/tournament/Teams.svelte';
	import { loadInitialData } from '$lib/helper';
	import { Tabs, TabItem, Spinner } from 'flowbite-svelte';

	export let data: PageData;
	const eventSupabaseDatabaseService = new EventSupabaseDatabaseService(data?.supabase);
	let tournament = new EventInstance(data.event_id, eventSupabaseDatabaseService);

	const matchesSupabaseDatabaseService = new MatchesSupabaseDatabaseService(data?.supabase);
	let matches = new MatchesInstance(data.event_id, matchesSupabaseDatabaseService);

	const teamsSupabaseDatabaseService = new TeamsSupabaseDatabaseService(data?.supabase);
	let teams = new TeamsInstance(data.event_id, teamsSupabaseDatabaseService);

	const loadingInitialDataPromise = loadInitialData(tournament, $matches, teams);
</script>

<div class="flex flex-col items-center">
	{#await loadingInitialDataPromise}
		<Spinner />
	{:then}
		<Settings bind:tournament event_id={data.event_id} />

		<div class="m-2">
			{#if data?.event_id !== 'create' && tournament}
				<Tabs>
					<TabItem open title="teams">
						<Teams bind:teams />
					</TabItem>

					<TabItem title="matches">
						<Matches bind:tournament bind:matches {teams} defaultTeam="" />
					</TabItem>

					<TabItem title="standings">
						<Standings event={tournament} {matches} {teams} defaultTeam="" />
					</TabItem>
					<TabItem title="Bracket">
						<Bracket {tournament} {matches} {teams} />
					</TabItem>
				</Tabs>
			{/if}
		</div>
	{/await}
</div>
