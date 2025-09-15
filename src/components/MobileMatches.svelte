<script lang="ts">
	import MobileMatchCard from './MobileMatchCard.svelte';
	import MobileTeamFilter from './MobileTeamFilter.svelte';
	import { Button } from '$components/ui/button';
	import ChevronLeftIcon from 'lucide-svelte/icons/chevron-left';
	import ChevronRightIcon from 'lucide-svelte/icons/chevron-right';
	import CalendarIcon from 'lucide-svelte/icons/calendar';
	import RefreshCwIcon from 'lucide-svelte/icons/refresh-cw';
	import type { Match } from '$lib/match.svelte';

	let {
		matches,
		teams,
		tournament,
		defaultTeam = '',
		readOnly = false,
		onTeamChange,
		onGenerateMatches
	} = $props();

	let showMyMatchesOnly = $state(false);
	let selectedRound = $state(0);

	// Get all rounds
	const rounds = $derived(
		Array.from(new Set(matches.matches?.map((m: Match) => m.round ?? 0) || [])).sort((a, b) => a - b)
	);

	// Filter matches based on current selections
	const filteredMatches = $derived.by(() => {
		let matchList = matches.matches || [];

		// Filter by team if selected and showMyMatchesOnly is true
		if (defaultTeam && showMyMatchesOnly) {
			matchList = matchList.filter((match: Match) => {
				const team1 = teams.teams.find((t: any) => t.id === match.team1);
				const team2 = teams.teams.find((t: any) => t.id === match.team2);
				return team1?.name === defaultTeam || team2?.name === defaultTeam;
			});
		}

		// Group by rounds
		const matchesByRound = new Map();
		for (const match of matchList) {
			const round = match.round ?? 0;
			if (!matchesByRound.has(round)) {
				matchesByRound.set(round, []);
			}
			matchesByRound.get(round).push(match);
		}

		return matchesByRound;
	});

	// Get next match info for the selected team
	const nextMatchInfo = $derived.by(() => {
		if (!defaultTeam || !matches.matches) return null;

		const currentRound = tournament.current_round ?? 0;
		const teamMatches = matches.matches.filter((match: Match) => {
			const team1 = teams.teams.find((t: any) => t.id === match.team1);
			const team2 = teams.teams.find((t: any) => t.id === match.team2);
			return (team1?.name === defaultTeam || team2?.name === defaultTeam) && match.state !== 'COMPLETE';
		});

		if (teamMatches.length === 0) return null;

		// Find the next match (current round first, then next available)
		const nextMatch = teamMatches.find((match: Match) => match.round === currentRound) || teamMatches[0];

		if (!nextMatch) return null;

		const team1 = teams.teams.find((t: any) => t.id === nextMatch.team1);
		const team2 = teams.teams.find((t: any) => t.id === nextMatch.team2);
		const opponent = team1?.name === defaultTeam ? team2?.name : team1?.name;

		return {
			opponent: opponent || 'TBD',
			court: nextMatch.court ?? 0,
			round: nextMatch.round ?? 0,
			isCurrentRound: nextMatch.round === currentRound
		};
	});

	// Round navigation
	function previousRound() {
		const currentIndex = rounds.indexOf(selectedRound);
		if (currentIndex > 0) {
			selectedRound = rounds[currentIndex - 1];
		}
	}

	function nextRound() {
		const currentIndex = rounds.indexOf(selectedRound);
		if (currentIndex < rounds.length - 1) {
			selectedRound = rounds[currentIndex + 1];
		}
	}

	function handleMyMatchesToggle(value: boolean) {
		showMyMatchesOnly = value;
	}

	// Set initial round to current round
	$effect(() => {
		if (rounds.length > 0 && tournament.current_round !== undefined) {
			const currentRound = tournament.current_round;
			if (rounds.includes(currentRound)) {
				selectedRound = currentRound;
			} else {
				selectedRound = rounds[0];
			}
		}
	});
</script>

<div class="mobile-matches">
	<!-- Mobile Team Filter -->
	<MobileTeamFilter
		{teams}
		{defaultTeam}
		{onTeamChange}
		{showMyMatchesOnly}
		onMyMatchesToggle={handleMyMatchesToggle}
		{nextMatchInfo}
	/>

	{#if matches.matches && matches.matches.length > 0}
		<!-- Round Navigation -->
		{#if rounds.length > 1 && !showMyMatchesOnly}
			<div class="round-navigation sticky top-[120px] z-10 bg-white border-b border-gray-200 px-4 py-3 dark:bg-gray-900 dark:border-gray-700">
				<div class="flex items-center justify-between">
					<Button
						variant="outline"
						size="sm"
						disabled={selectedRound === rounds[0]}
						onclick={previousRound}
						class="h-10 w-10 p-0"
					>
						<ChevronLeftIcon class="h-4 w-4" />
					</Button>

					<div class="flex items-center gap-2">
						<CalendarIcon class="h-4 w-4 text-gray-500" />
						<span class="font-medium text-gray-900 dark:text-white">
							Round {selectedRound + 1}
						</span>
						{#if selectedRound === (tournament.current_round ?? 0)}
							<span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
								Current
							</span>
						{/if}
					</div>

					<Button
						variant="outline"
						size="sm"
						disabled={selectedRound === rounds[rounds.length - 1]}
						onclick={nextRound}
						class="h-10 w-10 p-0"
					>
						<ChevronRightIcon class="h-4 w-4" />
					</Button>
				</div>
			</div>
		{/if}

		<!-- Matches Grid -->
		<div class="matches-container p-4">
			{#if showMyMatchesOnly}
				<!-- My Matches View -->
				<div class="space-y-4">
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
						{defaultTeam}'s Matches
					</h3>
					{#each rounds as round}
						{@const roundMatches = filteredMatches.get(round) || []}
						{#if roundMatches.length > 0}
							<div class="round-section">
								<div class="flex items-center gap-2 mb-3">
									<span class="text-sm font-medium text-gray-600 dark:text-gray-300">
										Round {round + 1}
									</span>
									{#if round === (tournament.current_round ?? 0)}
										<span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
											Current
										</span>
									{/if}
								</div>
								<div class="space-y-3">
									{#each roundMatches as match}
										<MobileMatchCard
											{match}
											{teams}
											{readOnly}
											{defaultTeam}
											{matches}
											isCurrentRound={round === (tournament.current_round ?? 0)}
										/>
									{/each}
								</div>
							</div>
						{/if}
					{/each}
				</div>
			{:else}
				<!-- All Matches View -->
				{@const roundMatches = filteredMatches.get(selectedRound) || []}
				<div class="space-y-4">
					{#each roundMatches as match}
						<MobileMatchCard
							{match}
							{teams}
							{readOnly}
							{defaultTeam}
							{matches}
							isCurrentRound={selectedRound === (tournament.current_round ?? 0)}
						/>
					{/each}

					{#if roundMatches.length === 0}
						<div class="text-center py-8">
							<CalendarIcon class="h-12 w-12 text-gray-400 mx-auto mb-4" />
							<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
								No matches in Round {selectedRound + 1}
							</h3>
							<p class="text-gray-600 dark:text-gray-400">
								This round hasn't been set up yet.
							</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{:else}
		<!-- Empty State -->
		<div class="empty-state flex flex-col items-center justify-center py-12 px-4">
			<RefreshCwIcon class="h-16 w-16 text-gray-400 mb-4" />
			<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
				No matches yet
			</h3>
			<p class="text-gray-600 dark:text-gray-400 text-center mb-6">
				{readOnly
					? "The tournament organizer hasn't generated the match schedule yet."
					: "Generate matches to create the tournament schedule."
				}
			</p>
			{#if !readOnly && onGenerateMatches}
				<Button
					onclick={onGenerateMatches}
					class="bg-emerald-600 hover:bg-emerald-700"
				>
					<RefreshCwIcon class="h-4 w-4 mr-2" />
					Generate Matches
				</Button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.mobile-matches {
		min-height: 100vh;
	}

	.round-navigation {
		backdrop-filter: blur(8px);
	}

	.matches-container {
		padding-bottom: 6rem; /* Space for potential floating actions */
	}

	.round-section:not(:last-child) {
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid rgba(229, 231, 235, 0.5);
	}

	:global(.dark) .round-section:not(:last-child) {
		border-bottom-color: rgba(75, 85, 99, 0.5);
	}

	@media (min-width: 768px) {
		.round-navigation {
			position: static;
		}
	}
</style>