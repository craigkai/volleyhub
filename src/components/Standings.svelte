<script lang="ts">
	import { Event } from '$lib/event.svelte';
	import { findStandings } from '$lib/standings.svelte';
	import { Matches } from '$lib/matches.svelte';
	import { Teams } from '$lib/teams.svelte';
	import * as Table from '$components/ui/table/index.js';

	let {
		event,
		matches,
		teams,
		defaultTeam
	}: { event: Event; matches: Matches; teams: Teams; defaultTeam: string | null } = $props();

	const scoring = event.scoring;

	let teamScores: TeamScores = $derived(
		findStandings(matches.matches ?? [], event, teams.teams ?? [])
	);
	let orderedTeamScores = $derived(
		Object.keys(teamScores).sort((a, b) => teamScores[b] - teamScores[a])
	);
</script>

<div class="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
	Scoring based on {scoring}
</div>

<div class="rounded rounded-2xl p-2 dark:bg-gray-800">
	<Table.Root class="table-auto">
		<Table.Header>
			<Table.Row>
				<Table.Head>Team</Table.Head>
				<Table.Head>Score</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each { length: orderedTeamScores.length } as _, i}
				{@const isDefaultTeam =
					defaultTeam && defaultTeam === orderedTeamScores[i]
						? 'p-2 border-solid border-2 border-yellow-300 bg-yellow-200 dark:bg-gray-400 dark:border-gray-400'
						: ''}
				<Table.Row class={isDefaultTeam}>
					<Table.Cell>{orderedTeamScores[i]}</Table.Cell>
					<Table.Cell>{teamScores[orderedTeamScores[i]]}</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
