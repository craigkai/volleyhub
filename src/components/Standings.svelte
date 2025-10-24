<script lang="ts">
	import { findStandings } from '$lib/standings.svelte';
	import { calculateIndividualStandings } from '$lib/individualStandings.svelte';
	import * as Table from '$components/ui/table/index.js';
	import {
		Collapsible,
		CollapsibleContent,
		CollapsibleTrigger
	} from '$components/ui/collapsible/index.js';
	import InfoIcon from 'lucide-svelte/icons/info';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import MedalIcon from 'lucide-svelte/icons/medal';
	import { Badge } from '$components/ui/badge';

	let { event, matches, teams, defaultTeam, players = null, playerStats = null } = $props();

	// Determine if we're in mix-and-match mode
	let isMixAndMatch = $derived(
		event?.tournament_type === 'mix-and-match'
	);

	// Calculate team standings (for fixed-teams tournaments)
	let orderedTeamScores = $derived(findStandings(matches.matches, teams.teams));

	// Extract player and stats arrays to ensure reactivity
	let currentPlayers = $derived(players?.players ?? []);
	let currentStats = $derived(playerStats?.stats ?? []);

	// Calculate individual player standings (for mix-and-match tournaments)
	let orderedPlayerScores = $derived(
		isMixAndMatch && currentPlayers.length > 0
			? calculateIndividualStandings(currentPlayers, currentStats)
			: []
	);
</script>

<div class="space-y-4">
	<div
		class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
	>
		<!-- Standings Table -->
		<div class="overflow-hidden rounded-t-xl">
			<Table.Root class="w-full">
				<Table.Header>
					<Table.Row class="bg-gray-50 dark:bg-gray-900">
						<Table.Head
							class="w-16 py-3 pl-4 text-center text-sm font-medium text-gray-700 dark:text-gray-300"
							>Rank</Table.Head
						>
						<Table.Head class="py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
							{isMixAndMatch ? 'Player' : 'Team'}
						</Table.Head>
						<Table.Head
							class="py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300"
							>Wins</Table.Head
						>
						{#if isMixAndMatch}
							<Table.Head
								class="py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300"
								>Pts Diff</Table.Head
							>
						{/if}
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#if isMixAndMatch}
						<!-- Player Standings for Mix & Match -->
						{#each orderedPlayerScores as standing, index}
							<Table.Row class="border-t border-gray-200 dark:border-gray-700">
								<Table.Cell class="py-3 pl-4 text-center">
									{#if index === 0}
										<div class="flex justify-center">
											<span
												class="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
											>
												<MedalIcon class="h-4 w-4" />
											</span>
										</div>
									{:else if index === 1}
										<div class="flex justify-center">
											<span
												class="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
											>
												<MedalIcon class="h-4 w-4" />
											</span>
										</div>
									{:else if index === 2}
										<div class="flex justify-center">
											<span
												class="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
											>
												<MedalIcon class="h-4 w-4" />
											</span>
										</div>
									{:else}
										<span class="text-sm font-medium text-gray-600 dark:text-gray-400"
											>{index + 1}</span
										>
									{/if}
								</Table.Cell>
								<Table.Cell class="py-3">
									<div class="flex items-center gap-2">
										<span class="font-medium text-gray-800 dark:text-gray-200"
											>{standing.player.name}</span
										>
										{#if standing.player.gender}
											<span class="text-xs text-gray-500">
												{standing.player.gender === 'male' ? '♂' : '♀'}
											</span>
										{/if}
									</div>
								</Table.Cell>
								<Table.Cell class="py-3 text-center">
									<span
										class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
									>
										{standing.wins}
									</span>
								</Table.Cell>
								<Table.Cell class="py-3 text-center">
									<span
										class="text-sm font-medium {standing.pointsDiff >= 0
											? 'text-emerald-600 dark:text-emerald-400'
											: 'text-red-600 dark:text-red-400'}"
									>
										{standing.pointsDiff >= 0 ? '+' : ''}{standing.pointsDiff}
									</span>
								</Table.Cell>
							</Table.Row>
						{/each}

						{#if orderedPlayerScores.length === 0}
							<Table.Row>
								<Table.Cell
									colspan={4}
									class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
								>
									No player data available
								</Table.Cell>
							</Table.Row>
						{/if}
					{:else}
						<!-- Team Standings for Fixed Teams -->
						{#each orderedTeamScores as team, index}
							{@const isDefaultTeam = defaultTeam && defaultTeam === team.name}
							<Table.Row
								class={`border-t border-gray-200 dark:border-gray-700 ${isDefaultTeam ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
							>
								<Table.Cell class="py-3 pl-4 text-center">
									{#if index === 0}
										<div class="flex justify-center">
											<span
												class="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
											>
												<MedalIcon class="h-4 w-4" />
											</span>
										</div>
									{:else if index === 1}
										<div class="flex justify-center">
											<span
												class="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
											>
												<MedalIcon class="h-4 w-4" />
											</span>
										</div>
									{:else if index === 2}
										<div class="flex justify-center">
											<span
												class="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
											>
												<MedalIcon class="h-4 w-4" />
											</span>
										</div>
									{:else}
										<span class="text-sm font-medium text-gray-600 dark:text-gray-400"
											>{index + 1}</span
										>
									{/if}
								</Table.Cell>
								<Table.Cell class="py-3">
									<div class="flex items-center gap-2">
										<span class="font-medium text-gray-800 dark:text-gray-200">{team.name}</span>
										{#if isDefaultTeam}
											<Badge
												variant="outline"
												class="border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
											>
												Your Team
											</Badge>
										{/if}
									</div>
								</Table.Cell>
								<Table.Cell class="py-3 pr-4 text-center">
									<span
										class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
									>
										{team.wins}
									</span>
								</Table.Cell>
							</Table.Row>
						{/each}

						{#if orderedTeamScores.length === 0}
							<Table.Row>
								<Table.Cell
									colspan={3}
									class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
								>
									No team data available
								</Table.Cell>
							</Table.Row>
						{/if}
					{/if}
				</Table.Body>
			</Table.Root>
		</div>

		<!-- Calculation Info -->
		<div class="border-t border-gray-200 p-4 dark:border-gray-700">
			<Collapsible>
				<CollapsibleTrigger
					class="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
				>
					<div class="flex items-center gap-2">
						<InfoIcon class="h-4 w-4 text-gray-500" />
						<span>How are standings calculated?</span>
					</div>
					<ChevronDown
						class="h-4 w-4 text-gray-500 transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-180"
					/>
				</CollapsibleTrigger>
				<CollapsibleContent
					class="mt-4 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800/50"
				>
					<div class="prose prose-sm dark:prose-invert max-w-none">
						<h3 class="mb-2 text-lg font-semibold text-emerald-600 dark:text-emerald-400">
							1. Wins as the Primary Criterion
						</h3>
						<p class="mb-4 text-gray-700 dark:text-gray-300">
							The primary criterion for ranking teams is the number of wins. Teams are first sorted
							by the total number of matches they have won. A higher number of wins will always
							place a team higher in the standings.
						</p>

						<h3 class="mb-2 text-lg font-semibold text-emerald-600 dark:text-emerald-400">
							2. Handling Ties: Head-to-Head Results
						</h3>
						<p class="mb-4 text-gray-700 dark:text-gray-300">
							When two or more teams have the same number of wins, the head-to-head results between
							those teams are used as the first tiebreaker. This means if two teams are tied in
							wins, the team that won the match when they played against each other will be ranked
							higher.
						</p>

						<h3 class="mb-2 text-lg font-semibold text-emerald-600 dark:text-emerald-400">
							3. Further Tiebreaker: Points Differential
						</h3>
						<p class="mb-4 text-gray-700 dark:text-gray-300">
							If teams are still tied after considering head-to-head results, the points
							differential is used as the next tiebreaker. The points differential is calculated as
							the difference between points scored and points conceded across all matches. A higher
							positive differential indicates a better performance.
						</p>

						<h3 class="mb-2 text-lg font-semibold text-emerald-600 dark:text-emerald-400">
							4. Final Tiebreaker: Total Points Scored
						</h3>
						<p class="mb-4 text-gray-700 dark:text-gray-300">
							In rare cases where teams remain tied after considering wins, head-to-head results,
							and points differential, the total points scored by each team across all matches are
							used as the final tiebreaker. The team with the higher total points scored will be
							ranked higher.
						</p>

						<h3 class="mb-2 text-lg font-semibold text-emerald-600 dark:text-emerald-400">
							5. Example Scenario
						</h3>
						<p class="mb-2 text-gray-700 dark:text-gray-300">
							Consider three teams: Team A, Team B, and Team C, all tied with the same number of
							wins.
						</p>
						<ul class="mb-4 list-disc space-y-1 pl-5 text-gray-700 dark:text-gray-300">
							<li>In head-to-head results: Team B beats Team A, and Team A beats Team C.</li>
							<li>Team A has a better points differential than Team B.</li>
							<li>
								However, because Team B won against Team A in their direct match, Team B is ranked
								higher.
							</li>
							<li>
								If Team A and Team C did not play each other, then the next criterion would be
								applied.
							</li>
						</ul>

						<p class="text-gray-700 dark:text-gray-300">
							This structured approach ensures that the standings reflect not just the number of
							wins but also how teams performed in critical matches and overall.
						</p>
					</div>
				</CollapsibleContent>
			</Collapsible>
		</div>
	</div>
</div>

<style lang="postcss">
	/* Smooth transitions for hover and interactive elements */
	:global(.collapsible-trigger),
	:global(.collapsible-content) {
		transition: all 0.2s ease-in-out;
	}

	/* Ensure proper spacing in the prose content */
	:global(.prose h3) {
		margin-top: 1.5em;
		margin-bottom: 0.5em;
	}

	:global(.prose h3:first-child) {
		margin-top: 0;
	}

	/* Focus styles for better accessibility */
	:global(button:focus-visible) {
		outline: 2px solid rgb(16 185 129 / 0.5);
		outline-offset: 2px;
	}
</style>
