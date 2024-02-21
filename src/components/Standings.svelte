<script lang="ts">
	import { Event } from '$lib/event';
	import { findStandings } from '$lib/standings';
	import { Matches } from '$lib/matches';
	import { Teams } from '$lib/teams';
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';

	export let event: Event;
	export let matches: Matches;
	export let teams: Teams;
	export let defaultTeam: string;

	const scoring = event.scoring;
	let teamScores: TeamScores = {};
	let orderedTeamScores = {};

	async function generateResults() {
		teamScores = await findStandings($matches.matches ?? [], event, teams.teams ?? []);
		orderedTeamScores = Object.keys(teamScores).sort((a, b) => teamScores[b] - teamScores[a]);
	}
	generateResults();
	$: $matches, generateResults();
</script>

Scoring based on {scoring}

<Table>
	<TableHead>
		<!-- <TableHeadCell>Rank</TableHeadCell> -->
		<TableHeadCell>Team</TableHeadCell>
		<TableHeadCell>Score</TableHeadCell>
	</TableHead>
	<TableBody>
		{#each { length: orderedTeamScores.length } as _, i}
			{@const isDefaultTeam =
				defaultTeam && defaultTeam === orderedTeamScores[i]
					? 'bg-yellow-200 border-2 border-solid border-yellow-300'
					: ''}
			<TableBodyRow class={isDefaultTeam}>
				<!-- <TableBodyCell>{i}</TableBodyCell> -->
				<TableBodyCell>{orderedTeamScores[i]}</TableBodyCell>
				<TableBodyCell>{teamScores[orderedTeamScores[i]]}</TableBodyCell>
			</TableBodyRow>
		{/each}
	</TableBody>
</Table>
