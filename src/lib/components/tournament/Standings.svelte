<script lang="ts">
	import { Event } from '$lib/event';
	import { Matches } from '$lib/matches';
	import { Teams } from '$lib/teams';
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Checkbox,
		TableSearch
	} from 'flowbite-svelte';

	export let event: Event;
	export let matches: Matches;
	export let teams: Teams;

	interface TeamScores {
		[key: string]: number;
	}

	const teamScores: TeamScores = teams.teams.reduce((acc: TeamScores, team: TeamRow) => {
		acc[team.name] = 0;
		return acc;
	}, {});

	$matches.matches.forEach((match: MatchRow) => {
		if (match.team1_score && match.team2_score) {
			teamScores[match.matches_team1_fkey.name] += match.team1_score;
			teamScores[match.matches_team2_fkey.name] += match.team2_score;
		}
	});

	const orderedTeamScores = Object.keys(teamScores).sort((a, b) => teamScores[b] - teamScores[a]);

	const scoring = event.scoring;
</script>

Scoring based on {scoring}

<Table>
	<TableHead>
		<TableHeadCell>Rank</TableHeadCell>
		<TableHeadCell>Team</TableHeadCell>
		<TableHeadCell>Score</TableHeadCell>
	</TableHead>
	<TableBody>
		{#each { length: orderedTeamScores.length } as _, i}
			<TableBodyRow>
				<TableBodyCell>{i}</TableBodyCell>
				<TableBodyCell>{orderedTeamScores[i]}</TableBodyCell>
				<TableBodyCell>{teamScores[orderedTeamScores[i]]}</TableBodyCell>
			</TableBodyRow>
		{/each}
	</TableBody>
</Table>
