<script lang="ts">
	import * as Popover from '$components/ui/popover';
	import type { Team } from '$lib/team.svelte';
	import { Teams } from '$lib/teams.svelte';
	import * as AlertDialog from '$components/ui/alert-dialog/index.js';
	import EditMatch from '$components/EditMatch.svelte';
	import type { Matches } from '$lib/matches.svelte';
	import { Match } from '$lib/match.svelte';

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

	const winClass = 'bg-green-300 dark:bg-green-700';
	const lossClass = 'bg-red-300 dark:bg-red-700';

	const team1 = $derived(teams.teams.find((t: Team) => t.id === match.team1));
	const team2 = $derived(teams.teams.find((t: Team) => t.id === match.team2));
	const teamsForMatch = $derived([team1?.name, team2?.name]);

	const hasDefaultTeam = $derived(defaultTeam ? teamsForMatch.includes(defaultTeam) : false);
	const defaultTeamWin = $derived(
		team1?.name === defaultTeam
			? (match.team1_score ?? 0) > (match.team2_score ?? 0)
			: (match.team2_score ?? 0) > (match.team1_score ?? 0)
	);

	const rowDivClass = $derived(
		defaultTeamWin
			? 'border-solid border-2 border-green-400 bg-green-200 dark:bg-green-700 dark:border-green-700'
			: 'border-solid border-2 border-red-400 bg-red-200 dark:bg-red-700 dark:border-red-700'
	);
	let open = $state(false);
</script>

<AlertDialog.Root
	{open}
	onOpenChange={() => (open = false)}
	closeOnOutsideClick={true}
	closeOnEscape={true}
>
	<AlertDialog.Content>
		<EditMatch matchId={match.id as number} {matches} {teams} {open} />
	</AlertDialog.Content>
</AlertDialog.Root>

{#snippet matchView()}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="flex cursor-pointer place-items-center justify-center text-pretty {courts < 2
			? 'text-lg'
			: 'text-base'}"
		onclick={() => {
			if (!readOnly) {
				open = true;
			}
		}}
	>
		<span
			class="text-pretty rounded p-1 {!hasDefaultTeam &&
			match?.team1_score &&
			match?.team2_score &&
			match.team1_score > match.team2_score
				? winClass
				: ''} {!hasDefaultTeam &&
			match?.team1_score &&
			match?.team2_score &&
			match.team2_score > match.team1_score
				? lossClass
				: ''}"
		>
			{team1?.name}</span
		>
		vs
		<span
			class="text-pretty rounded p-1 {!hasDefaultTeam &&
			match?.team1_score &&
			match?.team2_score &&
			match.team2_score > match.team1_score
				? winClass
				: ''} {!hasDefaultTeam &&
			match?.team1_score &&
			match?.team2_score &&
			match?.team1_score > match?.team2_score
				? lossClass
				: ''}">{team2?.name}</span
		>
	</div>
{/snippet}

<div
	class="min-w-[100px] rounded rounded-lg {hasDefaultTeam
		? match.state === 'COMPLETE'
			? 'flex-1 p-2 ' + rowDivClass
			: 'flex-1 border-2 border-solid border-yellow-300 bg-yellow-200 p-2 dark:border-gray-400 dark:bg-gray-400'
		: 'flex-1 p-2'}"
>
	{#if readOnly}
		<Popover.Root>
			<Popover.Trigger>
				{@render matchView()}
			</Popover.Trigger>

			<Popover.Content>
				{#if match?.team1_score && match?.team2_score}
					<p>{match?.team1_score} to {match?.team2_score}</p>
				{:else}
					<p>Not played yet</p>
				{/if}
			</Popover.Content>
		</Popover.Root>
	{:else}
		{@render matchView()}
	{/if}
</div>
