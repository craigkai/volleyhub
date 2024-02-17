<script lang="ts">
	import { Event } from '$lib/event';
	import { Brackets } from '$lib/brackets';
	import type { Teams } from '$lib/teams';
	import type { RealtimeChannel } from '@supabase/supabase-js';
	import { Button, Spinner } from 'flowbite-svelte';
	import { Matches } from '$lib/matches';

	export let tournament: Event;
	export let bracket: Brackets;
	export let teams: Teams;
	export let matches: Matches;
	export let readOnly: boolean = true;

	const teamNames = teams.teams.map((team) => team.name);

	const loadingPromise = $bracket.load();

	const numRounds = teamNames.length / 2 + (teamNames.length % 2);

	let matchesSubscription: RealtimeChannel | undefined;
	async function subscribeToMatches() {
		matchesSubscription = await $bracket.subscribeToBracketMatches();
	}
	subscribeToMatches();

	async function handleGenerateBracket() {
		await $bracket.createBracketMatches(tournament, teams.teams, $matches.matches || []);
	}
	// TODO: Allow bracket matches to be edited.
	// TODO: Handle case where we can check the parent_id of each match
	// should start with null.
</script>

{#await loadingPromise}
	<div class="h-screen flex flex-col items-center place-content-center">
		<Spinner />
	</div>
{:then}
	<div class="container">
		<div class="tournament-bracket tournament-bracket--rounded">
			{#each Array(numRounds) as _, i}
				{@const matchesInRound =
					$bracket?.bracketMatches?.filter((match) => match.round === i) || []}
				<div class="tournament-bracket__round tournament-bracket__round--quarterfinals">
					<h3 class="tournament-bracket__round-title">Round {i + 1}</h3>
					<ul class="tournament-bracket__list">
						{#if matchesInRound.length != 0}
							{#each matchesInRound as match}
								{@const team1Win =
									match.team1_score && match.team2_score
										? match.team1_score > match.team2_score
										: false}
								{@const team2Win = !team1Win && match.team1_score && match.team2_score}
								<li class="tournament-bracket__item">
									<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
									<div class="tournament-bracket__match" tabindex="0">
										<table class="tournament-bracket__table">
											<thead class="sr-only">
												<tr>
													<th>Team</th>
													<th>Score</th>
												</tr>
											</thead>
											<tbody class="tournament-bracket__content">
												<tr
													class:tournament-bracket__team--winner={team1Win}
													class="tournament-bracket__team"
												>
													<td class="tournament-bracket__country">
														<abbr class="tournament-bracket__code" title="team1"
															>{match.matches_team1_fkey.name}</abbr
														>
													</td>
													<td class="tournament-bracket__score">
														<span class="tournament-bracket__number">{match?.team1_score || 0}</span
														>
													</td>
												</tr>
												<tr
													class:tournament-bracket__team--winner={team2Win}
													class="tournament-bracket__team"
												>
													<td class="tournament-bracket__country">
														<abbr class="tournament-bracket__code" title="team1"
															>{match.matches_team2_fkey.name}</abbr
														>
													</td>
													<td class="tournament-bracket__score">
														<span class="tournament-bracket__number">{match?.team2_score || 0}</span
														>
													</td>
												</tr>
											</tbody>
										</table>
									</div>
								</li>
							{/each}
						{/if}
					</ul>
				</div>
			{/each}
		</div>
	</div>

	<div class="flex flex-col items-center">
		{#if !readOnly}
			{#if !bracket?.bracketMatches || bracket?.bracketMatches?.length === 0}
				<Button color="light" on:click={handleGenerateBracket}>Generate initial bracket</Button>
			{/if}
		{/if}
	</div>
{/await}

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

	//
	// TOURNAMENT BRACKET
	// ---------------------------
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

			&:nth-child(odd),
			&:nth-child(even) {
				margin-left: 0;
				margin-right: 0;
			}
		}

		@media (min-width: @breakpoint-sm) {
			padding: 0.5em 1em;
			// flex-grow: 2;
			width: 100%;

			&:nth-child(odd),
			&:nth-child(even) {
				margin: 0;
			}

			&::after {
				position: absolute;
				right: 0;
				content: '';
				display: block;
				width: 1em;
				height: 45%;
				border-right: 2px solid #9e9e9e;
			}

			&:nth-child(odd)::after {
				top: 50%;
				border-top: 2px solid #9e9e9e;
				transform: translateY(-1px);

				.tournament-bracket--rounded & {
					border-top-right-radius: 0.6em;
				}
			}

			&:nth-child(even)::after {
				bottom: 50%;
				border-bottom: 2px solid #9e9e9e;
				transform: translateY(1px);

				.tournament-bracket--rounded & {
					border-bottom-right-radius: 0.6em;
				}
			}
			.tournament-bracket__round:first-child & {
				padding-left: 0;
			}
			.tournament-bracket__round:last-child & {
				padding-right: 0;

				&::after {
					display: none;
				}
			}

			.tournament-bracket__round:nth-last-child(2) & {
				&::after {
					border-radius: 0;
					border-right: 0;
				}
			}
		}

		@media (min-width: @breakpoint-lg) {
			padding: 0.5em 1.5em;

			&::after {
				width: 1.5em;
			}
		}
	}

	.tournament-bracket__match {
		display: flex;
		width: 100%;
		background-color: #ffffff;
		padding: 1em;
		border: 1px solid transparent;
		border-radius: 0.1em;
		box-shadow: 0 2px 0 0 #e5e5e5;
		outline: none;
		cursor: pointer;
		transition:
			padding 0.2s ease-in-out,
			border 0.2s linear;

		&:focus {
			border-color: #2196f3;
		}

		&::before,
		&::after {
			transition: all 0.2s linear;
		}

		@media (max-width: @breakpoint-xs) {
			padding: 0.75em 0.5em;
		}

		@media (min-width: @breakpoint-sm) {
			&::before,
			&::after {
				position: absolute;
				left: 0;
				z-index: 1;
				content: '';
				display: block;
				width: 1em;
				height: 10%;
				border-left: 2px solid #9e9e9e;
			}

			&::before {
				bottom: 50%;
				border-bottom: 2px solid #9e9e9e;
				transform: translate(0, 1px);

				.tournament-bracket--rounded & {
					border-bottom-left-radius: 0.6em;
				}
			}

			&::after {
				top: 50%;
				border-top: 2px solid #9e9e9e;
				transform: translate(0, -1px);

				.tournament-bracket--rounded & {
					border-top-left-radius: 0.6em;
				}
			}
		}

		@media (min-width: @breakpoint-lg) {
			&::before,
			&::after {
				width: 1.5em;
			}

			&::before {
				transform: translate(0, 1px);
			}

			&::after {
				transform: translate(0, -1px);
			}
		}
	}

	.tournament-bracket__round:last-child .tournament-bracket__match {
		&::before,
		&::after {
			border-left: 0;
		}

		&::before {
			border-bottom-left-radius: 0;
		}

		&::after {
			display: none;
		}
	}

	.tournament-bracket__round:first-child .tournament-bracket__match {
		&::before,
		&::after {
			display: none;
		}
	}

	.tournament-bracket__content {
		display: flex;

		&::after {
			content: ':';
			width: 1em;
			text-align: center;
			padding: 0.2em 0.1em;

			@media (min-width: @breakpoint-sm) {
				order: 1;
			}
		}

		& .tournament-bracket__team:first-child {
			width: 50%;
			order: 0;
			text-align: right;

			@media (min-width: @breakpoint-sm) and (max-width: @breakpoint-md) {
				align-items: flex-end;
			}

			& .tournament-bracket__country {
				order: 2;
				justify-content: flex-end;

				@media (min-width: @breakpoint-xs) {
					order: 0;
				}

				@media (min-width: @breakpoint-sm) and (max-width: @breakpoint-md) {
					flex-direction: column-reverse;
					align-items: flex-end;
				}
			}

			& .tournament-bracket__score {
				order: 0;

				@media (min-width: @breakpoint-xs) {
					order: 2;
				}
			}
		}

		& .tournament-bracket__team:last-child {
			width: 50%;
			order: 2;
			text-align: left;

			@media (min-width: @breakpoint-sm) and (max-width: @breakpoint-md) {
				align-items: flex-start;
			}

			& .tournament-bracket__country {
				@media (min-width: @breakpoint-sm) {
					justify-content: flex-start;
				}

				@media (min-width: @breakpoint-sm) and (max-width: @breakpoint-md) {
					align-items: flex-start;
				}
			}

			.tournament-bracket__code {
				order: 1;
			}
		}
	}

	.tournament-bracket__table {
		width: 100%;
	}

	.tournament-bracket__caption {
		font-size: 0.8rem;
		color: #bdbdbd;
		font-weight: 300;
		padding-bottom: 0.75em;
	}

	.tournament-bracket__team {
		display: flex;
		flex-direction: row-reverse;
		justify-content: space-between;

		@media (min-width: @breakpoint-xs) {
			flex-direction: column-reverse;
		}

		@media (min-width: @breakpoint-sm) {
			flex-direction: column-reverse;
		}
	}

	.tournament-bracket__country {
		font-size: 0.95rem;
		display: flex;
		margin-top: 0.5em;
		align-items: center;

		@media (max-width: @breakpoint-xs) {
			margin-top: 0;
		}

		@media (min-width: @breakpoint-sm) and (max-width: @breakpoint-md) {
			display: flex;
			flex-direction: column;

			.tournament-bracket__code {
				margin-top: 0.2em;
			}
		}
	}

	.tournament-bracket__code {
		padding: 0 0.5em;
		color: #212121;
		font-weight: 600;
		text-transform: uppercase;
		border: 0;
		text-decoration: none;
		cursor: help;
		transition: padding 0.2s ease-in-out;

		@media (max-width: @breakpoint-xs) {
			padding: 0 0.25em;
		}

		@media (min-width: @breakpoint-sm) and (max-width: @breakpoint-md) {
			padding: 0;
		}
	}

	.tournament-bracket__score {
		display: flex;
		align-items: center;

		.tournament-bracket__team:first-child & {
			flex-direction: row-reverse;
			padding-left: 0.75em;
		}

		.tournament-bracket__team:last-child & {
			padding-right: 0.75em;
		}
	}

	.tournament-bracket__number {
		display: inline-block;
		padding: 0.2em 0.4em 0.2em;
		border-bottom: 0.075em solid transparent;
		font-size: 0.95rem;
		background-color: #f5f5f5;
		border-color: spin(shade(#f5f5f5, 10%), -10);

		.tournament-bracket__team--winner & {
			background-color: rgb(155, 243, 155);
			border-color: spin(shade(#fff176, 2%), -10);
		}
	}

	.tournament-bracket__medal {
		padding: 0 0.5em;
	}

	.tournament-bracket__medal--gold {
		color: #ffd700;
	}

	.tournament-bracket__medal--silver {
		color: #c0c0c0;
	}

	.tournament-bracket__medal--bronze {
		color: #cd7f32;
	}
</style>
