<script lang="ts">
	import type { PageData } from '$types';
	import { Event as EventInstance } from '$lib/event';
	import Settings from '$lib/components/tournament/Settings.svelte';
	import { Matches as MatchesInstance } from '$lib/matches';
	import { Teams as TeamsInstance } from '$lib/teams';
	import Standings from '$lib/components/tournament/Standings.svelte';
	import Matches from '$lib/components/tournament/Matches.svelte';
	import Teams from '$lib/components/tournament/Teams.svelte';
	import { loadInitialData } from '$lib/helper';
	import { SupabaseDatabaseService } from '$lib/supabaseDatabaseService';
	import { Tabs, TabItem } from 'flowbite-svelte';

	export let data: PageData;
	const databaseService = new SupabaseDatabaseService(data?.supabase);
	let tournament = new EventInstance(data.event_id, databaseService);
	let matches = new MatchesInstance(data.event_id, databaseService);
	let teams = new TeamsInstance(data.event_id, databaseService);

	const loadingInitialDataPromise = loadInitialData(tournament, $matches, teams);
</script>

{#await loadingInitialDataPromise}
	loading...
{:then}
	<div class="flex flex-col items-center">
		<Settings bind:tournament event_id={data.event_id} />

		<div class="m-2">
			{#if data?.event_id !== 'create' && tournament}
				<Teams bind:teams />
			{/if}
		</div>
		{#if data?.event_id !== 'create' && tournament}
			<Tabs>
				<TabItem open title="matches">
					<Matches bind:tournament bind:matches {teams} />
				</TabItem>

				<TabItem title="standings">
					<Standings event={tournament} {matches} {teams} />
				</TabItem>
			</Tabs>
		{/if}
	</div>
{/await}
