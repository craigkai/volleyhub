<script lang="ts">
	import { Event } from '$lib/event';
	import { Brackets } from '$lib/brackets';
	import type { Matches } from '$lib/matches';
	import type { Teams } from '$lib/teams';
	import type { RealtimeChannel } from '@supabase/supabase-js';
	import { Button, Spinner } from 'flowbite-svelte';
	import BracketTree from '$components/Bracket/BracketTree.svelte';

	export let tournament: Event;
	export let bracket: Brackets;
	export let teams: Teams;
	export let matches: Matches;
	export let readOnly: boolean = true;

	const teamNames = teams.teams.map((team) => team.name);

	const loadingPromise = $bracket.load();

	let matchesSubscription: RealtimeChannel | undefined;
	async function subscribeToMatches() {
		matchesSubscription = await bracket.subscribeToMatches();
	}
	subscribeToMatches();

	async function handleGenerateBracket() {
		await bracket.createBracketMatches(tournament, teams.teams, $matches.matches || []);
	}
	// TODO: Handle case where we can check the parent_id of each match
	// should start with null.
</script>

{#await loadingPromise}
	<div class="h-screen flex flex-col items-center place-content-center">
		<Spinner />
	</div>
{:then}
	{#if !readOnly && (!bracket?.matches || bracket.matches.length === 0)}
		<div class="flex flex-col items-center">
			<Button color="light" on:click={handleGenerateBracket}>Generate initial bracket</Button>
		</div>
	{:else}
		<div class="container">
			<div class="tournament-bracket tournament-bracket--rounded">
				<div class="tournament-bracket__round tournament-bracket__round--quarterfinals">
					<h3 class="tournament-bracket__round-title">Round 1</h3>
					<ul class="tournament-bracket__list">
						<BracketTree matches={$bracket.matches} {readOnly} />
					</ul>
				</div>
			</div>
		</div>
	{/if}
{/await}

<style lang="less">
	@breakpoint-xs: 24em;
	@breakpoint-sm: 38em;
	@breakpoint-md: 52em;
	@breakpoint-lg: 72em;

	.container {
		width: 90%;
		min-width: 18em;
		margin: 20px auto;
	}

	//
	// TOURNAMENT BRACKET
	// ---------------------------
	.tournament-bracket__round-title {
		color: #9e9e9e;
		font-size: 0.95rem;
		font-weight: 400;
		text-align: center;
		font-style: italic;
		margin-bottom: 0.5em;
	}

	.tournament-bracket__list {
		display: flex;
		flex-direction: column;
		flex-flow: row wrap;
		justify-content: center;
		height: 100%;
		min-height: 100%;
		border-bottom: 1px dashed #e5e5e5;
		padding-bottom: 2em;
		margin-bottom: 2em;
		transition:
			padding 0.2s ease-in-out,
			margin 0.2s ease-in-out;

		@media (max-width: @breakpoint-xs) {
			padding-bottom: 1em;
			margin-bottom: 1em;
		}

		@media (min-width: @breakpoint-sm) {
			margin-bottom: 0;
			padding-bottom: 0;
			border-right: 1px dashed #e5e5e5;
			border-bottom: 0;
		}

		.tournament-bracket__round:last-child & {
			border: 0;
		}
	}
</style>
