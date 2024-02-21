<script lang="ts">
	import type { PageData } from '$types';
	import Settings from '$components/Settings.svelte';
	import Bracket from '$components/Bracket.svelte';
	import Standings from '$components/Standings.svelte';
	import Matches from '$components/Matches.svelte';
	import Teams from '$components/Teams.svelte';
	import { loadInitialData } from '$lib/helper';
	import { Tabs, TabItem, Spinner } from 'flowbite-svelte';
	import EditMatch from '$components/EditMatch.svelte';
	import { page } from '$app/stores';
	import { Modal } from 'flowbite-svelte';
	import { initiateEvent } from '$lib/helper';

	export let data: PageData;
	let { supabase, event_id } = data;

	let { tournament, matches, teams, bracket } = initiateEvent(event_id, supabase);

	async function reloadEventInstances() {
		if ($page.state.eventCreated) {
			// Use const instead of let to declare the variables
			const {
				tournament: newTournament,
				matches: newMatches,
				teams: newTeams,
				bracket: newBracket
			} = initiateEvent($page.state.eventCreated, supabase);

			await loadInitialData(newTournament, newMatches, newTeams, newBracket);

			// Update the variables with the new values
			tournament = newTournament;
			matches = newMatches;
			teams = newTeams;
			bracket = newBracket;

			await loadInitialData(tournament, matches, teams, bracket);
		}
	}

	$: $page.state.eventCreated, reloadEventInstances();

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
