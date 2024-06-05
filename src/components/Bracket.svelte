<script lang="ts">
	import { Event } from '$lib/event';
	import { Brackets } from '$lib/brackets';
	import type { Matches } from '$lib/matches';
	import type { Teams } from '$lib/teams';
	import type { RealtimeChannel } from '@supabase/supabase-js';
	import { Button } from 'flowbite-svelte';
	import { updateMatch } from '$lib/helper';
	import { error } from '$lib/toast';
	import type { HttpError } from '@sveltejs/kit';

	export let tournament: Event;
	export let bracket: Brackets;
	export let teams: Teams;
	export let matches: Matches;
	export let readOnly: boolean = true;

	let rounds: Record<number, Round> = {};

	function determineRounds() {
		rounds = {};
		$bracket?.matches?.forEach((match) => {
			if (!rounds[match.round]) {
				rounds[match.round] = {
					matches: [match],
					value: match.round
				};
			} else {
				rounds[match.round].matches.push(match);
			}
		});
	}

	$: $bracket.matches, determineRounds();

	const determineRoundName = (remainingRounds: number): string => {
		return remainingRounds === 1 ? 'Championship' : `Round ${numRounds - remainingRounds + 1}`;
	};

	let matchesSubscription: RealtimeChannel | undefined;

	async function subscribeToMatches() {
		matchesSubscription = await bracket.subscribeToMatches();
	}

	subscribeToMatches();

	async function handleGenerateBracket() {
		try {
			const res = await bracket.createBracketMatches(
				tournament,
				teams.teams,
				$matches.matches || []
			);
			if (!res) {
				error('Failed to create matches');
			} else if (!matchesSubscription) {
				subscribeToMatches();
			}
		} catch (err) {
			error((err as HttpError).toString());
		}
	}

	$: numRounds = Object.keys(rounds).length;
</script>

{#if !readOnly && (!$bracket?.matches || $bracket.matches.length === 0)}
	<div class="flex flex-col items-center">
		<Button color="light" on:click={handleGenerateBracket}>Generate initial bracket</Button>
	</div>
{:else if $bracket.matches && $bracket.matches.length > 0}
	<div class="container">
		<div class="tournament-bracket tournament-bracket--rounded">
			{#each Object.keys(rounds) as i, index}
				{@const roundObj = rounds[Number(i)]}
				{@const roundName = determineRoundName(numRounds - index)}
				<div class="tournament-bracket__round tournament-bracket__round--{roundName}">
					<h3 class="tournament-bracket__round-title">{roundName}</h3>
					<ul class="tournament-bracket__list">
						{#each roundObj.matches.sort((a, b) => a.id - b.id) as match, index (index)}
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
												<td class="tournament-bracket__country">
													<abbr class="tournament-bracket__code" title="team1">
														{match.public_matches_team1_fkey?.name ?? 'tbd'}
													</abbr>
												</td>
												<td class="tournament-bracket__score">
													{#if readOnly}
														<span class="tournament-bracket__number">{match?.team1_score || 0}</span
														>
													{:else}
														<input
															disabled={!match.public_matches_team1_fkey?.name}
															class="border-solid border-2 text-center max-w-8"
															bind:value={match.team1_score}
															on:change={() => updateMatch(match, bracket)}
														/>
													{/if}
												</td>
											</tr>

											<tr
												class="tournament-bracket__team"
												class:tournament-bracket__team--winner={team2Win}
											>
												<td class="tournament-bracket__country">
													<abbr class="tournament-bracket__code" title="team">
														{match.public_matches_team2_fkey?.name ?? 'tbd'}
													</abbr>
												</td>
												<td class="tournament-bracket__score">
													{#if readOnly}
														<span class="tournament-bracket__number">{match?.team2_score || 0}</span
														>
													{:else}
														<input
															disabled={!match.public_matches_team1_fkey?.name}
															class="border-solid border-2 text-center max-w-8"
															bind:value={match.team2_score}
															on:change={() => updateMatch(match, bracket)}
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

	html {
		font-size: 15px;

		@media (min-width: @breakpoint-sm) {
			font-size: 14px;
		}
		@media (min-width: @breakpoint-md) {
			font-size: 15px;
		}
		@media (min-width: @breakpoint-lg) {
			font-size: 16px;
		}
	}

	body {
		background-color: #f1f1f1;
		font-family: 'Work Sans', 'Helvetica Neue', Arial, sans-serif;
	}

	.container {
		width: 90%;
		min-width: 18em;
		margin: 20px auto;
	}

	h1,
	h2 {
		text-align: center;
	}

	h1 {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 0.5em;
	}

	h2 {
		font-size: 1.4rem;
		font-weight: 600;
		margin-bottom: 2em;
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
		background-color: #f9f871;
		color: #333;
	}
</style>
