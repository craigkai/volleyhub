<script lang="ts">
	import type { PageData } from '$types';
	import { Event as EventInstance } from '$lib/event';
	import Settings from '$components/Settings.svelte';
	import Bracket from '$components/Bracket.svelte';
	import { Matches as MatchesInstance } from '$lib/matches';
	import { Teams as TeamsInstance } from '$lib/teams';
	import { EventSupabaseDatabaseService } from '$lib/database/event';
	import { MatchesSupabaseDatabaseService } from '$lib/database/matches';
	import { TeamsSupabaseDatabaseService } from '$lib/database/teams';
	import Standings from '$components/Standings.svelte';
	import Matches from '$components/Matches.svelte';
	import Teams from '$components/Teams.svelte';
	import { loadInitialData } from '$lib/helper';
	import { Tabs, TabItem, Spinner } from 'flowbite-svelte';
	import EditMatch from '$components/EditMatch.svelte';
	import { page } from '$app/stores';
	import { Modal } from 'flowbite-svelte';
	import { Brackets } from '$lib/brackets';

	export let data: PageData;
	const eventSupabaseDatabaseService = new EventSupabaseDatabaseService(data?.supabase);
	let tournament = new EventInstance(data.event_id, eventSupabaseDatabaseService);

	const matchesSupabaseDatabaseService = new MatchesSupabaseDatabaseService(data?.supabase);
	let matches = new MatchesInstance(data.event_id, matchesSupabaseDatabaseService);

	const teamsSupabaseDatabaseService = new TeamsSupabaseDatabaseService(data?.supabase);
	let teams = new TeamsInstance(data.event_id, teamsSupabaseDatabaseService);

	let bracket = new Brackets(data.event_id, matchesSupabaseDatabaseService);

	const loadingInitialDataPromise = loadInitialData(tournament, $matches, teams, bracket);
</script>

{#if $page.state.showModal && $page.state.matchId}
	<Modal size="xs" on:close={() => history.back()} open={true} outsideclose autoclose>
		{#if $page.state.type === 'pool'}
			<EditMatch matchId={$page.state.matchId} bind:matches />
		{:else}
			<EditMatch matchId={$page.state.matchId} bind:matches={bracket} />
		{/if}
	</Modal>
{/if}

<div class="flex flex-col items-center">
	{#await loadingInitialDataPromise}
		<div class="h-screen flex flex-col items-center place-content-center">
			<Spinner />
		</div>
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
						<Bracket {tournament} {bracket} {teams} {matches} readOnly={false} />
					</TabItem>
				</Tabs>
			{/if}
		</div>
	{/await}
</div>
