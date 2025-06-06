<script lang="ts">
	import * as Popover from '$components/ui/popover';
	import * as AlertDialog from '$components/ui/alert-dialog/index.js';
	import { Button } from '$components/ui/button';
	import EditMatch from '$components/EditMatch.svelte';
	import type { Team } from '$lib/team.svelte';
	import EditIcon from 'lucide-svelte/icons/edit-2';
	import TrophyIcon from 'lucide-svelte/icons/trophy';
	import InfoIcon from 'lucide-svelte/icons/info';

	let { match, teams, readOnly = false, defaultTeam, matches, courts } = $props();

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

	const cardBackgroundClass = $derived.by(() => {
		if (!defaultTeam || !isComplete || !hasScores) return '';

		if (hasDefaultTeam) {
			if (defaultTeamWin) {
				return 'default-team-won';
			} else {
				return 'default-team-lost';
			}
		}

		return 'completed-match-card';
	});
</script>

{#if readOnly}
	<Popover.Root>
		<Popover.Trigger class="block w-full">
			<div class="match-card p-2 sm:p-3 {cardBackgroundClass}">
				{@render matchContent()}
			</div>
		</Popover.Trigger>
		<Popover.Content
			class="popover-content rounded-lg border border-gray-200 p-0 shadow-lg dark:border-gray-700"
		>
			<div class="popover-header p-3">
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
								{#if team1IsWinner}<TrophyIcon class="h-4 w-4 text-amber-500" />{/if}
								<span class="team-name {team1?.name === defaultTeam ? 'default-team' : ''}"
									>{team1?.name || 'TBD'}</span
								>
							</div>
							<span class="score">{match.team1_score}</span>
						</div>
						<div class="team-row {team2IsWinner ? 'winner' : ''}">
							<div class="flex items-center gap-2">
								{#if team2IsWinner}<TrophyIcon class="h-4 w-4 text-amber-500" />{/if}
								<span class="team-name {team2?.name === defaultTeam ? 'default-team' : ''}"
									>{team2?.name || 'TBD'}</span
								>
							</div>
							<span class="score">{match.team2_score}</span>
						</div>
					</div>
				{:else}
					<div class="py-2 text-center text-sm text-gray-500 dark:text-gray-400">
						Match not played yet
					</div>
				{/if}
			</div>
		</Popover.Content>
	</Popover.Root>
{:else}
	<AlertDialog.Root>
		<AlertDialog.Trigger class="block w-full">
			<div class="match-card group p-2 sm:p-3 {cardBackgroundClass}">
				{@render matchContent()}
				<div
					class="absolute right-1 bottom-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
				>
					<Button size="sm" variant="ghost" class="h-6 w-6 rounded-full p-0">
						<EditIcon class="h-3 w-3" /><span class="sr-only">Edit match</span>
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
	<div class="flex flex-col gap-1 sm:gap-2">
		{#each [team1, team2] as team, i}
			{@const isWinner = i === 0 ? team1IsWinner : team2IsWinner}
			{@const score = i === 0 ? match.team1_score : match.team2_score}
			<div class="flex items-center justify-between text-sm">
				<span class="flex items-center gap-1 truncate font-medium">
					<span
						class="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold
						{isWinner && isComplete
							? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
							: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}"
					>
						{score ?? '-'}
					</span>
					{#if team?.name === defaultTeam}<span class="h-2 w-2 rounded-full bg-yellow-400"
						></span>{/if}
					<span>{team?.name ?? 'TBD'}</span>
					{#if isWinner && isComplete}<TrophyIcon class="h-3 w-3 text-amber-500" />{/if}
				</span>
			</div>
		{/each}
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

	.default-team-card {
		background-color: rgba(253, 224, 71, 0.2);
		border: 1px solid rgba(253, 224, 71, 0.3);
	}

	:global(.dark) .default-team-card {
		background-color: rgba(253, 224, 71, 0.1);
		border: 1px solid rgba(253, 224, 71, 0.2);
	}

	.completed-match-card {
		background-color: rgba(59, 65, 75, 0.05);
	}

	:global(.dark) .completed-match-card {
		background-color: rgba(212, 218, 230, 0.1);
	}

	.default-team-won {
		background-color: rgba(16, 185, 129, 0.15);
		border: 1px solid rgba(16, 185, 129, 0.3);
	}

	:global(.dark)
		.default-team-card:has(.dark\:text-emerald-400.font-semibold:has(+ .text-amber-500)) {
		background-color: rgba(16, 185, 129, 0.15);
		border: 1px solid rgba(16, 185, 129, 0.3);
	}

	:global(.popover-content) {
		overflow: hidden;
		background-color: white;
	}

	:global(.dark .popover-content) {
		background-color: #1f2937;
	}

	.popover-header {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #e5e7eb;
		background-color: #f9fafb;
	}

	:global(.dark) .popover-header {
		border-bottom: 1px solid #374151;
		background-color: #111827;
	}

	.match-score-card {
		margin-bottom: 1rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
		background-color: #f9fafb;
		border: 1px solid #e5e7eb;
	}

	:global(.dark) .match-score-card {
		background-color: rgba(31, 41, 55, 0.5);
		border: 1px solid #374151;
	}

	.team-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
	}

	.team-row:first-child {
		border-bottom: 1px solid #e5e7eb;
		padding-bottom: 0.75rem;
		margin-bottom: 0.5rem;
	}

	:global(.dark) .team-row:first-child {
		border-bottom: 1px solid #374151;
	}

	.team-name {
		font-weight: 500;
		font-size: 0.875rem;
		color: #4b5563;
	}

	:global(.dark) .team-name {
		color: #9ca3af;
	}

	.team-row.winner .team-name {
		color: #047857;
		font-weight: 600;
	}

	:global(.dark) .team-row.winner .team-name {
		color: #6ee7b7;
	}

	.default-team {
		text-decoration: underline;
		text-decoration-color: #10b981;
		text-decoration-thickness: 2px;
		text-underline-offset: 2px;
	}

	.default-team-lost {
		background-color: rgba(239, 68, 68, 0.15); /* red */
		border: 1px solid rgba(239, 68, 68, 0.3);
	}

	:global(.dark) .default-team-lost {
		background-color: rgba(239, 68, 68, 0.08);
		border: 1px solid rgba(239, 68, 68, 0.2);
	}

	.score {
		font-size: 1.25rem;
		font-weight: 700;
		color: #4b5563;
	}

	:global(.dark) .score {
		color: #9ca3af;
	}

	.team-row.winner .score {
		color: #047857;
	}

	:global(.dark) .team-row.winner .score {
		color: #6ee7b7;
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
		color: #6b7280;
	}

	:global(.dark) .meta-item {
		color: #9ca3af;
	}

	.match-card.default-team-card::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4px;
		background-color: #facc15;
		border-top-left-radius: 0.5rem;
		border-bottom-left-radius: 0.5rem;
	}
</style>
