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
		TableHeadCell
	} from 'flowbite-svelte';

	export let event: Event;
	export let matches: Matches;
	export let teams: Teams;
	export let defaultTeam: string;

	interface TeamScores {
		[key: string]: number;
	}

	const teamScores: TeamScores = teams.teams.reduce((acc: TeamScores, team: TeamRow) => {
		acc[team.name] = 0;
		return acc;
	}, {});

	const scoring = event.scoring;

	$matches?.matches?.forEach((match: MatchRow) => {
		if (match.team1_score && match.team2_score) {
			if (scoring === 'points') {
				teamScores[match.matches_team1_fkey.name] += match.team1_score || 0;
				teamScores[match.matches_team2_fkey.name] += match.team2_score || 0;
			} else {
				teamScores[match.matches_team1_fkey.name] += match.team1_score > match.team2_score ? 1 : 0;
				teamScores[match.matches_team2_fkey.name] += match.team2_score > match.team1_score ? 1 : 0;
			}
		}
	});

	const orderedTeamScores = Object.keys(teamScores).sort((a, b) => teamScores[b] - teamScores[a]);
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
			{@const isDefaultTeam =
				defaultTeam && defaultTeam === orderedTeamScores[i] ? 'bg-green-200' : ''}
			<TableBodyRow class={isDefaultTeam}>
				<TableBodyCell>{i}</TableBodyCell>
				<TableBodyCell>{orderedTeamScores[i]}</TableBodyCell>
				<TableBodyCell>{teamScores[orderedTeamScores[i]]}</TableBodyCell>
			</TableBodyRow>
		{/each}
	</TableBody>
</Table>
