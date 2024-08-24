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

	let orderedTeamScores = $derived(findStandings(matches.matches, teams.teams));
</script>

<div class="mb-2 block text-lg font-bold text-gray-700 dark:text-gray-300">
	Scoring based on {scoring}
</div>

<div class="rounded rounded-2xl p-2 dark:bg-gray-800">
	<Table.Root class="justify-content-center table-auto text-center text-lg">
		<Table.Header>
			<Table.Row>
				<Table.Head>Team</Table.Head>
				<Table.Head>Score</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each orderedTeamScores as team}
				{@const isDefaultTeam =
					defaultTeam && defaultTeam === team.name
						? 'p-2 border-solid border-2 border-yellow-300 bg-yellow-200 dark:bg-gray-400 dark:border-gray-400'
						: ''}
				<Table.Row class={isDefaultTeam}>
					<Table.Cell>{team.name}</Table.Cell>
					<Table.Cell>{team.wins}</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
