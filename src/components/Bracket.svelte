<script lang="ts">
	import type { Match } from '$lib/match.svelte';
	import type { RealtimeChannel } from '@supabase/supabase-js';
	import { Button } from '$components/ui/button/index.js';
	import { updateMatch } from '$lib/helper.svelte';
	import type { HttpError } from '@sveltejs/kit';
	import { onMount } from 'svelte';
	import * as Alert from '$components/ui/alert/index.js';
	import toast from 'svelte-5-french-toast';

	let {
		matches = $bindable(),
		bracket = $bindable(),
		teams = $bindable(),
		tournament = $bindable(),
		readOnly = false
	} = $props();

	let rounds: Record<number, Round> = $state({});
	let numRounds = $state(0);
	let showGenerateBracketAlert = $state(false);

	function determineRounds() {
		const newRounds: Record<number, Round> = {};
		bracket?.matches?.forEach((match: Match) => {
			if (typeof match.round !== 'number') return;
			if (!newRounds[match.round]) {
				newRounds[match.round] = {
					// @ts-ignore
					matches: [match],
					value: match.round
				};
			} else {
				// @ts-ignore
				newRounds[match.round].matches.push(match);
			}
		});
		rounds = newRounds;
		numRounds = Object.keys(newRounds).length;
	}

	$effect(() => {
		determineRounds();
	});

	const determineRoundName = (remainingRounds: number): string => {
		return remainingRounds === 1 ? 'Championship' : `Round ${numRounds - remainingRounds + 1}`;
	};

	let matchesSubscription: RealtimeChannel | undefined;

	onMount(async () => {
		if ((bracket?.matches?.length ?? 0) > 0)
			matchesSubscription = await bracket.subscribeToMatches();
	});

	async function checkGenerateBracket() {
		if ((matches?.matches?.length ?? 0) > 0) {
			showGenerateBracketAlert = true;
		} else {
			generateBracket();
		}
	}

	async function generateBracket() {
		try {
			if (bracket.event_id) {
				if (matchesSubscription) await matchesSubscription.unsubscribe();

				const res = await bracket.createBracketMatches(
					tournament,
					teams.teams,
					matches.matches || []
				);
				if (!res) {
					toast.error('Failed to create matches');
				} else {
					// We need to wait to resub to the matches channel
					await new Promise((r) => setTimeout(r, 1000));

					matchesSubscription = await bracket.subscribeToMatches();
					await bracket.load(bracket.event_id);
				}
			}
		} catch (err) {
			toast.error((err as HttpError).toString());
		}
		showGenerateBracketAlert = false;
	}
</script>

{#if bracket.matches && bracket.matches.length > 0}
	<div class="container">
		<div class="tournament-bracket tournament-bracket--rounded">
			{#each Object.keys(rounds) as i, index}
				{@const roundObj = rounds[Number(i)]}
				{@const roundName = determineRoundName(numRounds - index)}
				<div class="tournament-bracket__round tournament-bracket__round--{roundName}">
					<h3 class="tournament-bracket__round-title">{roundName}</h3>
					<ul class="tournament-bracket__list">
						{#each roundObj.matches.sort((a, b) => a.id - b.id) as match, index (index)}
							{@const team1 = teams.teams.find((t: TeamRow) => t.id === match.team1)}
							{@const team2 = teams.teams.find((t: TeamRow) => t.id === match.team2)}

							{@const team1Win =
								match.team1_score && match.team2_score
									? match.team1_score > match.team2_score
									: false}
							{@const team2Win = !team1Win && match.team1_score && match.team2_score}
							<li class="tournament-bracket__item">
								<div class="tournament-bracket__match">
									<table class="tournament-bracket__table">
										<tbody class="tournament-bracket__content">
											<tr
												class="tournament-bracket__team"
												class:tournament-bracket__team--winner={team1Win}
											>
												<td class="tournament-bracket__country m-1 rounded p-1">
													<abbr class="tournament-bracket__code" title="team1">
														{team1?.name ?? 'tbd'}
													</abbr>
												</td>
												<td class="tournament-bracket__score m-1 rounded p-1">
													{#if readOnly}
														<span class="tournament-bracket__number">{match?.team1 || 0}</span>
													{:else}
														<input
															disabled={!team1?.name}
															class="max-w-8 border-2 border-solid text-center"
															bind:value={match.team1_score}
															onchange={() => updateMatch(match)}
														/>
													{/if}
												</td>
											</tr>

											<tr
												class="tournament-bracket__team"
												class:tournament-bracket__team--winner={team2Win}
											>
												<td class="tournament-bracket__country m-1 rounded p-1">
													<abbr class="tournament-bracket__code" title="team">
														{team2?.name ?? 'tbd'}
													</abbr>
												</td>
												<td class="tournament-bracket__score m-1 rounded p-1">
													{#if readOnly}
														<span class="tournament-bracket__number">{match?.team2_score || 0}</span
														>
													{:else}
														<input
															disabled={!team2?.name}
															class="max-w-8 border-2 border-solid text-center"
															bind:value={match.team2_score}
															onchange={() => updateMatch(match)}
														/>
													{/if}
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</div>
{/if}

{#if !readOnly}
	<div class="flex flex-col items-center justify-center">
		{#if showGenerateBracketAlert}
			<div class="m-2">
				<Alert.Root>
					<Alert.Title>Generate new bracket?</Alert.Title>
					<Alert.Description
						>You already have a bracket, are you sure you want to wipe that?</Alert.Description
					>
					<div class="flex gap-2">
						<Button
							class="focus:shadow-outline dark:text-nord-1 rounded bg-blue-400 px-4 py-2 font-bold text-black text-white hover:bg-blue-600 focus:outline-none"
							onclick={generateBracket}>Yes</Button
						>
						<Button
							class="focus:shadow-outline dark:text-nord-1 rounded bg-blue-400 px-4 py-2 font-bold text-black text-white hover:bg-blue-600 focus:outline-none"
							onclick={() => (showGenerateBracketAlert = false)}>No</Button
						>
					</div>
				</Alert.Root>
			</div>
		{/if}

		{#if !bracket?.matches || bracket.matches.length === 0}
			<Button
				variant="outline"
				class="focus:shadow-outline dark:text-nord-1 rounded bg-blue-400 px-4 py-2 font-bold text-white hover:bg-blue-600 focus:outline-none"
				onclick={checkGenerateBracket}>Generate initial bracket</Button
			>
		{:else}
			<Button
				variant="outline"
				class="focus:shadow-outline dark:text-nord-1 rounded bg-blue-400 px-4 py-2 font-bold text-white hover:bg-blue-600 focus:outline-none"
				onclick={checkGenerateBracket}>Regenerate bracket</Button
			>
		{/if}
	</div>
{/if}

<style lang="less">
	@breakpoint-xs: 24em;
	@breakpoint-sm: 38em;
	@breakpoint-md: 52em;
	@breakpoint-lg: 72em;

	* {
		&,
		&::before,
		&::after {
			box-sizing: border-box;
		}
	}

	.container {
		width: 90%;
		min-width: 18em;
		margin: 20px auto;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
	}

	.tournament-bracket {
		display: flex;
		flex-direction: column;

		@media (min-width: @breakpoint-sm) {
			flex-direction: row;
		}
	}

	.tournament-bracket__round {
		display: block;
		margin-left: -3px;
		flex: 1;
	}

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

	.tournament-bracket__item {
		display: flex;
		flex: 0 1 auto;
		justify-content: center;
		flex-direction: column;
		align-items: flex-start;
		position: relative;
		padding: 2% 0;
		width: 48%;
		transition: padding 0.2s linear;

		&:nth-child(odd) {
			margin-right: 2%;
		}

		&:nth-child(even) {
			margin-left: 2%;
		}

		&::after {
			transition: width 0.2s linear;
		}

		@media (max-width: @breakpoint-xs) {
			width: 100%;
			padding: 5% 0;
		}

		@media (min-width: @breakpoint-sm) {
			width: 100%;
			padding: 2% 0;

			&::after {
				width: 100%;
			}
		}
	}

	.tournament-bracket__match {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 0 15%;
		width: 100%;
		transition: padding 0.2s ease-in-out;

		@media (max-width: @breakpoint-xs) {
			padding: 0 12%;
		}

		@media (min-width: @breakpoint-sm) {
			padding: 0 10%;
		}

		@media (min-width: @breakpoint-md) {
			padding: 0 15%;
		}

		@media (min-width: @breakpoint-lg) {
			padding: 0 20%;
		}
	}

	.tournament-bracket__table {
		width: 100%;
		margin: 0;
		padding: 0;
	}

	.tournament-bracket__team {
		display: flex;
		align-items: center;
		margin-bottom: 0.25rem;

		&:last-child {
			margin-bottom: 0;
		}
	}

	.tournament-bracket__country {
		display: flex;
		align-items: center;
		font-size: 0.9rem;
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.tournament-bracket__code {
		display: inline-block;
		font-size: 0.9rem;
		font-weight: 400;
		text-decoration: none;
		color: inherit;
	}

	.tournament-bracket__score {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3em;
		height: 1.75em;
		margin-left: auto;
		padding: 0.25em 0;
		border-radius: 0.25rem;
		background-color: #e5e5e5;
		color: #333;
		font-size: 1rem;
		font-weight: 700;
		text-align: center;

		@media (max-width: @breakpoint-xs) {
			width: 2.5em;
			height: 1.5em;
			font-size: 0.9rem;
		}

		@media (min-width: @breakpoint-sm) {
			width: 2.75em;
			height: 1.75em;
			font-size: 1rem;
		}
	}

	.tournament-bracket__team--winner .tournament-bracket__country,
	.tournament-bracket__team--winner .tournament-bracket__score {
		background-color: #55ea75;
		color: #333;
	}
</style>
