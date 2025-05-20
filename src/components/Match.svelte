<script lang="ts">
	import * as Popover from '$components/ui/popover';
	import * as AlertDialog from '$components/ui/alert-dialog/index.js';
	import { Button } from '$components/ui/button';
	import EditMatch from '$components/EditMatch.svelte';
	import type { Team } from '$lib/team.svelte';
	import { Teams } from '$lib/teams.svelte';
	import type { Matches } from '$lib/matches.svelte';
	import { Match } from '$lib/match.svelte';
	import EditIcon from 'lucide-svelte/icons/edit-2';
	import TrophyIcon from 'lucide-svelte/icons/trophy';
	import InfoIcon from 'lucide-svelte/icons/info';
	import MapPinIcon from 'lucide-svelte/icons/map-pin';
	import LayersIcon from 'lucide-svelte/icons/layers';

	let {
		match,
		teams,
		readOnly = false,
		defaultTeam,
		matches,
		courts
	}: {
		match: Match;
		teams: Teams;
		readOnly: boolean;
		defaultTeam: string;
		matches: Matches;
		courts: number;
	} = $props();

	const team1 = $derived(teams.teams.find((t: Team) => t.id === match.team1));
	const team2 = $derived(teams.teams.find((t: Team) => t.id === match.team2));
	const teamsForMatch = $derived([team1?.name, team2?.name]);

	const hasDefaultTeam = $derived(defaultTeam ? teamsForMatch.includes(defaultTeam) : false);

	const defaultTeamWin = $derived(
		team1?.name === defaultTeam
			? (match.team1_score ?? 0) > (match.team2_score ?? 0)
			: (match.team2_score ?? 0) > (match.team1_score ?? 0)
	);

	const team1IsWinner = $derived(
		match?.team1_score != null &&
			match?.team2_score != null &&
			match.team1_score > match.team2_score
	);

	const team2IsWinner = $derived(
		match?.team1_score != null &&
			match?.team2_score != null &&
			match.team2_score > match.team1_score
	);

	const isComplete = $derived(match.state === 'COMPLETE');
	const hasScores = $derived(match?.team1_score != null && match?.team2_score != null);

	// Determine card background class based on match state and teams
	const cardBackgroundClass = $derived(() => {
		if (hasDefaultTeam) {
			return 'default-team-card';
		}
		if (isComplete && hasScores) {
			return 'completed-match-card';
		}
		return '';
	});
</script>

{#if readOnly}
	<Popover.Root>
		<Popover.Trigger class="block w-full">
			<div class="match-card {cardBackgroundClass} {defaultTeamWin ? 'default-team-won' : ''}">
				{@render matchContent()}
			</div>
		</Popover.Trigger>
		<Popover.Content
			class="popover-content w-72 rounded-lg border border-gray-200 p-0 shadow-lg dark:border-gray-700"
		>
			<div class="popover-header">
				<div class="flex items-center gap-2">
					<InfoIcon class="h-4 w-4 text-emerald-500" />
					<h3 class="text-base font-semibold text-gray-900 dark:text-white">Match Details</h3>
				</div>
			</div>

			<div class="p-4">
				{#if hasScores}
					<div class="match-score-card">
						<div class="team-row {team1IsWinner ? 'winner' : ''}">
							<div class="flex items-center gap-2">
								{#if team1IsWinner}
									<TrophyIcon class="h-4 w-4 text-amber-500" />
								{/if}
								<span class="team-name {team1?.name === defaultTeam ? 'default-team' : ''}">
									{team1?.name}
								</span>
							</div>
							<span class="score">{match.team1_score}</span>
						</div>

						<div class="team-row {team2IsWinner ? 'winner' : ''}">
							<div class="flex items-center gap-2">
								{#if team2IsWinner}
									<TrophyIcon class="h-4 w-4 text-amber-500" />
								{/if}
								<span class="team-name {team2?.name === defaultTeam ? 'default-team' : ''}">
									{team2?.name}
								</span>
							</div>
							<span class="score">{match.team2_score}</span>
						</div>
					</div>
				{:else}
					<div
						class="flex items-center justify-center rounded-md bg-gray-50 px-4 py-3 dark:bg-gray-800/50"
					>
						<p class="text-sm text-gray-500 dark:text-gray-400">Match not played yet</p>
					</div>
				{/if}

				<div class="match-meta">
					<div class="meta-item">
						<MapPinIcon class="h-3.5 w-3.5 text-gray-400" />
						<span>Court: {match.court != null ? match.court + 1 : 'N/A'}</span>
					</div>
					<div class="meta-item">
						<LayersIcon class="h-3.5 w-3.5 text-gray-400" />
						<span>Round: {match.round != null ? match.round + 1 : 'N/A'}</span>
					</div>
				</div>
			</div>
		</Popover.Content>
	</Popover.Root>
{:else}
	<AlertDialog.Root>
		<AlertDialog.Trigger class="block w-full">
			<div class="match-card group cursor-pointer {cardBackgroundClass}">
				{@render matchContent()}
				<div
					class="absolute right-1 bottom-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
				>
					<Button size="sm" variant="ghost" class="h-6 w-6 rounded-full p-0">
						<EditIcon class="h-3 w-3" />
						<span class="sr-only">Edit match</span>
					</Button>
				</div>
			</div>
		</AlertDialog.Trigger>
		<AlertDialog.Content interactOutsideBehavior="close">
			<EditMatch matchId={match.id as number} {matches} {teams} />
		</AlertDialog.Content>
	</AlertDialog.Root>
{/if}

{#snippet matchContent()}
	<div class="group flex flex-col p-3 {courts < 2 ? 'gap-2' : 'gap-1.5'}">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-1.5 truncate">
				<span
					class="inline-flex h-5 min-w-5 items-center justify-center rounded-full text-xs font-medium {team1IsWinner &&
					isComplete
						? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
						: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}"
				>
					{match.team1_score ?? '-'}
				</span>
				<span
					class="truncate text-sm font-medium {team1?.name === defaultTeam
						? 'font-semibold text-emerald-700 dark:text-emerald-400'
						: ''} {team1IsWinner && isComplete
						? 'text-emerald-700 dark:text-emerald-300'
						: 'text-gray-700 dark:text-gray-300'}"
				>
					{team1?.name ?? 'TBD'}
				</span>
				{#if team1IsWinner && isComplete}
					<TrophyIcon class="ml-1 h-3.5 w-3.5 text-amber-500" />
				{/if}
			</div>
		</div>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-1.5 truncate">
				<span
					class="inline-flex h-5 min-w-5 items-center justify-center rounded-full text-xs font-medium {team2IsWinner &&
					isComplete
						? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
						: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}"
				>
					{match.team2_score ?? '-'}
				</span>
				<span
					class="truncate text-sm font-medium {team2?.name === defaultTeam
						? 'font-semibold text-emerald-700 dark:text-emerald-400'
						: ''} {team2IsWinner && isComplete
						? 'text-emerald-700 dark:text-emerald-300'
						: 'text-gray-700 dark:text-gray-300'}"
				>
					{team2?.name ?? 'TBD'}
				</span>
				{#if team2IsWinner && isComplete}
					<TrophyIcon class="ml-1 h-3.5 w-3.5 text-amber-500" />
				{/if}
			</div>
		</div>
	</div>
{/snippet}

<style>
	.match-card {
		position: relative;
		width: 100%;
		transition: background-color 0.2s ease;
		border-radius: 0.5rem;
	}

	.match-card:hover {
		background-color: rgba(0, 0, 0, 0.02);
	}

	:global(.dark) .match-card:hover {
		background-color: rgba(255, 255, 255, 0.02);
	}

	/* Default team highlighting - yellow background similar to the screenshot */
	.default-team-card {
		background-color: rgba(253, 224, 71, 0.2); /* Light yellow */
		border: 1px solid rgba(253, 224, 71, 0.3);
	}

	:global(.dark) .default-team-card {
		background-color: rgba(253, 224, 71, 0.1);
		border: 1px solid rgba(253, 224, 71, 0.2);
	}

	/* Completed match with winner */
	.completed-match-card {
		background-color: rgba(16, 185, 129, 0.05); /* Light green */
	}

	:global(.dark) .completed-match-card {
		background-color: rgba(16, 185, 129, 0.05);
	}

	/* Special case: default team won */
	.default-team-won {
		background-color: rgba(16, 185, 129, 0.15);
		border: 1px solid rgba(16, 185, 129, 0.3);
	}

	:global(.dark)
		.default-team-card:has(.dark\:text-emerald-400.font-semibold:has(+ .text-amber-500)) {
		background-color: rgba(16, 185, 129, 0.15);
		border: 1px solid rgba(16, 185, 129, 0.3);
	}

	/* Popover styling */
	:global(.popover-content) {
		overflow: hidden;
		background-color: white;
	}

	:global(.dark .popover-content) {
		background-color: #1f2937; /* dark:bg-gray-800 */
	}

	.popover-header {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #e5e7eb; /* border-gray-200 */
		background-color: #f9fafb; /* bg-gray-50 */
	}

	:global(.dark) .popover-header {
		border-bottom: 1px solid #374151; /* dark:border-gray-700 */
		background-color: #111827; /* dark:bg-gray-900 */
	}

	.match-score-card {
		margin-bottom: 1rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
		background-color: #f9fafb; /* bg-gray-50 */
		border: 1px solid #e5e7eb; /* border-gray-200 */
	}

	:global(.dark) .match-score-card {
		background-color: rgba(31, 41, 55, 0.5); /* dark:bg-gray-800/50 */
		border: 1px solid #374151; /* dark:border-gray-700 */
	}

	.team-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
	}

	.team-row:first-child {
		border-bottom: 1px solid #e5e7eb; /* border-gray-200 */
		padding-bottom: 0.75rem;
		margin-bottom: 0.5rem;
	}

	:global(.dark) .team-row:first-child {
		border-bottom: 1px solid #374151; /* dark:border-gray-700 */
	}

	.team-name {
		font-weight: 500;
		font-size: 0.875rem;
		color: #4b5563; /* text-gray-600 */
	}

	:global(.dark) .team-name {
		color: #9ca3af; /* dark:text-gray-400 */
	}

	.team-row.winner .team-name {
		color: #047857; /* text-emerald-700 */
		font-weight: 600;
	}

	:global(.dark) .team-row.winner .team-name {
		color: #6ee7b7; /* dark:text-emerald-300 */
	}

	.default-team {
		text-decoration: underline;
		text-decoration-color: #10b981; /* decoration-emerald-500 */
		text-decoration-thickness: 2px;
		text-underline-offset: 2px;
	}

	.score {
		font-size: 1.25rem;
		font-weight: 700;
		color: #4b5563; /* text-gray-600 */
	}

	:global(.dark) .score {
		color: #9ca3af; /* dark:text-gray-400 */
	}

	.team-row.winner .score {
		color: #047857; /* text-emerald-700 */
	}

	:global(.dark) .team-row.winner .score {
		color: #6ee7b7; /* dark:text-emerald-300 */
	}

	.match-meta {
		display: flex;
		gap: 1rem;
		margin-top: 0.75rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: #6b7280; /* text-gray-500 */
	}

	:global(.dark) .meta-item {
		color: #9ca3af; /* dark:text-gray-400 */
	}
</style>
