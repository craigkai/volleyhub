<!-- BracketRound.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import { showModal } from '$lib/helper';
	import BracketTree from './BracketTree.svelte';

	export let matches: MatchRow[];
	export let match: MatchRow;
	export let readOnly: boolean = true;

	const team1Win =
		match.team1_score && match.team2_score ? match.team1_score > match.team2_score : false;
	const team2Win = !team1Win && match.team1_score && match.team2_score;
</script>

<!-- svelte-ignore missing-declaration -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<li
	class="tournament-bracket__item"
	on:click={() => {
		if (!readOnly && !$page.state.showModal) {
			showModal(match.id, 'bracket');
		}
	}}
>
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
				<tr class:tournament-bracket__team--winner={team1Win} class="tournament-bracket__team">
					<td class="tournament-bracket__country">
						<abbr class="tournament-bracket__code" title="team1"
							>{match.matches_team1_fkey.name}</abbr
						>
					</td>
					<td class="tournament-bracket__score">
						<span class="tournament-bracket__number">{match?.team1_score || 0}</span>
					</td>
				</tr>
				<tr class:tournament-bracket__team--winner={team2Win} class="tournament-bracket__team">
					<td class="tournament-bracket__country">
						<abbr class="tournament-bracket__code" title="team1"
							>{match.matches_team2_fkey.name}</abbr
						>
					</td>
					<td class="tournament-bracket__score">
						<span class="tournament-bracket__number">{match?.team2_score || 0}</span>
					</td>
				</tr>
			</tbody>
		</table>
	</div>

	{#if matches && matches.length > 0}
		{@const childMatches = matches?.filter((m) => m.parent_id === match.id)}
		{#if childMatches.length > 0}
			<ul>
				<BracketTree matches={childMatches} {readOnly} />
			</ul>
		{/if}
	{/if}
</li>

<style lang="less">
	@breakpoint-xs: 24em;
	@breakpoint-sm: 38em;
	@breakpoint-md: 52em;
	@breakpoint-lg: 72em;

	//
	// TOURNAMENT BRACKET
	// ---------------------------

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
			}

			&:nth-child(even)::after {
				bottom: 50%;
				border-bottom: 2px solid #9e9e9e;
				transform: translateY(1px);
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
			}

			&::after {
				top: 50%;
				border-top: 2px solid #9e9e9e;
				transform: translate(0, -1px);
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
</style>
