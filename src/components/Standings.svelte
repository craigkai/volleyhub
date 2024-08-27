<script lang="ts">
	import { Event } from '$lib/event.svelte';
	import { findStandings } from '$lib/standings.svelte';
	import { Matches } from '$lib/matches.svelte';
	import { Teams } from '$lib/teams.svelte';
	import * as Table from '$components/ui/table/index.js';
	import {
		Collapsible,
		CollapsibleContent,
		CollapsibleTrigger
	} from '$components/ui/collapsible/index.js';

	let {
		event,
		matches,
		teams,
		defaultTeam
	}: { event: Event; matches: Matches; teams: Teams; defaultTeam: string | null } = $props();

	let orderedTeamScores = $derived(findStandings(matches.matches, teams.teams));
</script>

<div class="mb-2 block text-lg font-bold text-gray-700 dark:text-gray-300">
	<Collapsible>
		<CollapsibleTrigger
			><span class="text-sm">How are standings calculated?</span></CollapsibleTrigger
		>
		<CollapsibleContent>
			<h2 class="mb-3 text-2xl font-semibold text-teal-500">1. Wins as the Primary Criterion</h2>
			<p class="mb-6">
				The primary criterion for ranking teams is the number of wins. Teams are first sorted by the
				total number of matches they have won. A higher number of wins will always place a team
				higher in the standings.
			</p>

			<h2 class="mb-3 text-2xl font-semibold text-teal-500">
				2. Handling Ties: Head-to-Head Results
			</h2>
			<p class="mb-6">
				When two or more teams have the same number of wins, the head-to-head results between those
				teams are used as the first tiebreaker. This means if two teams are tied in wins, the team
				that won the match when they played against each other will be ranked higher.
			</p>

			<h2 class="mb-3 text-2xl font-semibold text-teal-500">
				3. Further Tiebreaker: Points Differential
			</h2>
			<p class="mb-6">
				If teams are still tied after considering head-to-head results, the points differential is
				used as the next tiebreaker. The points differential is calculated as the difference between
				points scored and points conceded across all matches. A higher positive differential
				indicates a better performance.
			</p>

			<h2 class="mb-3 text-2xl font-semibold text-teal-500">
				4. Final Tiebreaker: Total Points Scored
			</h2>
			<p class="mb-6">
				In rare cases where teams remain tied after considering wins, head-to-head results, and
				points differential, the total points scored by each team across all matches are used as the
				final tiebreaker. The team with the higher total points scored will be ranked higher.
			</p>

			<h2 class="mb-3 text-2xl font-semibold text-teal-500">5. Example Scenario</h2>
			<p class="mb-4">
				Consider three teams: Team A, Team B, and Team C, all tied with the same number of wins.
			</p>
			<ul class="mb-6 list-disc pl-6">
				<li>In head-to-head results: Team B beats Team A, and Team A beats Team C.</li>
				<li>Team A has a better points differential than Team B.</li>
				<li>
					However, because Team B won against Team A in their direct match, Team B is ranked higher.
				</li>
				<li>
					If Team A and Team C did not play each other, then the next criterion would be applied.
				</li>
			</ul>

			<p class="mb-6">
				This structured approach ensures that the standings reflect not just the number of wins but
				also how teams performed in critical matches and overall.
			</p>
		</CollapsibleContent>
	</Collapsible>
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
