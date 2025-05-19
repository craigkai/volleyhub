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
</script>

{#if readOnly}
	<Popover.Root>
		<Popover.Trigger class="block w-full">
			<div class="match-card">
				{@render matchContent()}
			</div>
		</Popover.Trigger>
		<Popover.Content class="w-64 p-3">
			<div class="space-y-2">
				<h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">Match Details</h3>
				{#if hasScores}
					<div class="rounded-md bg-gray-50 p-2 dark:bg-gray-800">
						<div class="flex items-center justify-between">
							<span
								class="text-sm font-medium {team1IsWinner
									? 'text-emerald-600 dark:text-emerald-400'
									: 'text-gray-600 dark:text-gray-400'}"
							>
								{team1?.name}
							</span>
							<span
								class="text-lg font-bold {team1IsWinner
									? 'text-emerald-600 dark:text-emerald-400'
									: 'text-gray-600 dark:text-gray-400'}"
							>
								{match.team1_score}
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span
								class="text-sm font-medium {team2IsWinner
									? 'text-emerald-600 dark:text-emerald-400'
									: 'text-gray-600 dark:text-gray-400'}"
							>
								{team2?.name}
							</span>
							<span
								class="text-lg font-bold {team2IsWinner
									? 'text-emerald-600 dark:text-emerald-400'
									: 'text-gray-600 dark:text-gray-400'}"
							>
								{match.team2_score}
							</span>
						</div>
					</div>
					{#if team1IsWinner || team2IsWinner}
						<div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
							<TrophyIcon class="h-3.5 w-3.5 text-amber-500" />
							<span>Winner: {team1IsWinner ? team1?.name : team2?.name}</span>
						</div>
					{/if}
				{:else}
					<p class="text-sm text-gray-500 dark:text-gray-400">Match not played yet</p>
				{/if}
				<div class="text-xs text-gray-500 dark:text-gray-400">
					<p>Court: {match.court != null ? match.court + 1 : 'N/A'}</p>
					<p>Round: {match.round != null ? match.round + 1 : 'N/A'}</p>
				</div>
			</div>
		</Popover.Content>
	</Popover.Root>
{:else}
	<AlertDialog.Root>
		<AlertDialog.Trigger class="block w-full">
			<div class="match-card group cursor-pointer">
				{@render matchContent()}
				<div
					class="absolute right-1 bottom-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
				>
					<Button
						size="sm"
						variant="ghost"
						class="h-6 w-6 rounded-full p-0"
					>
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
					class="inline-flex h-5 min-w-5 items-center justify-center rounded-full text-xs font-medium {team1IsWinner
						? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
						: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}"
				>
					{match.team1_score ?? '-'}
				</span>
				<span
					class="truncate text-sm font-medium {team1?.name === defaultTeam
						? 'font-semibold text-emerald-700 dark:text-emerald-400'
						: ''} {team1IsWinner
						? 'text-gray-900 dark:text-white'
						: 'text-gray-700 dark:text-gray-300'}"
				>
					{team1?.name ?? 'TBD'}
				</span>
			</div>
		</div>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-1.5 truncate">
				<span
					class="inline-flex h-5 min-w-5 items-center justify-center rounded-full text-xs font-medium {team2IsWinner
						? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
						: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}"
				>
					{match.team2_score ?? '-'}
				</span>
				<span
					class="truncate text-sm font-medium {team2?.name === defaultTeam
						? 'font-semibold text-emerald-700 dark:text-emerald-400'
						: ''} {team2IsWinner
						? 'text-gray-900 dark:text-white'
						: 'text-gray-700 dark:text-gray-300'}"
				>
					{team2?.name ?? 'TBD'}
				</span>
			</div>
		</div>
	</div>
{/snippet}

<style>
	.match-card {
		position: relative;
		width: 100%;
	}
	.match-card:hover {
		background-color: rgba(0, 0, 0, 0.02);
	}
	:global(.dark) .match-card:hover {
		background-color: rgba(255, 255, 255, 0.02);
	}
</style>
