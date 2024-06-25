<script lang="ts">
	import { Event } from '$lib/event.svelte';
	import { findStandings } from '$lib/standings.svelte';
	import { Matches } from '$lib/matches.svelte';
	import { Teams } from '$lib/teams.svelte';
	import * as Table from '$components/ui/table/index.js';

	export let event: Event;
	export let matches: Matches;
	export let teams: Teams;
	export let defaultTeam: string;

	const scoring = event.scoring;
	let teamScores: TeamScores = {};
	let orderedTeamScores = {};

	async function generateResults() {
		teamScores = await findStandings(matches.matches ?? [], event, teams.teams ?? []);
		orderedTeamScores = Object.keys(teamScores).sort((a, b) => teamScores[b] - teamScores[a]);
	}
	generateResults();
	$: matches, generateResults();
</script>

Scoring based on {scoring}

<Table.Root>
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
					? 'bg-yellow-200 border-2 border-solid border-yellow-300'
					: ''}
			<Table.Row class={isDefaultTeam}>
				<Table.Cell>{orderedTeamScores[i]}</Table.Cell>
				<Table.Cell>{teamScores[orderedTeamScores[i]]}</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
