<script lang="ts">
	import { Button } from '$components/ui/button';
	import * as Select from '$components/ui/select/index.js';
	import UsersIcon from 'lucide-svelte/icons/users';
	import FilterIcon from 'lucide-svelte/icons/filter';
	import XIcon from 'lucide-svelte/icons/x';
	import ClockIcon from 'lucide-svelte/icons/clock';

	let {
		teams,
		defaultTeam = '',
		onTeamChange,
		showMyMatchesOnly = false,
		onMyMatchesToggle,
		nextMatchInfo = null
	} = $props();

	const teamsSelect = $derived(
		[...(teams?.teams ?? [])]
			.sort((a, b) => a.name.localeCompare(b.name))
			.map((team) => ({ value: team.name, name: team.name }))
	);

	function handleTeamSelect(teamName: string | undefined) {
		onTeamChange?.(teamName || '');
	}

	function clearTeamSelection() {
		onTeamChange?.('');
	}

	function toggleMyMatches() {
		onMyMatchesToggle?.(!showMyMatchesOnly);
	}
</script>

<div class="mobile-team-filter space-y-3 p-4 bg-gray-50 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
	<!-- Quick Team Selection -->
	<div class="flex items-center gap-3">
		<div class="flex-1">
			<Select.Root
				value={defaultTeam}
				onValueChange={handleTeamSelect}
			>
				<Select.Trigger class="w-full h-12 bg-white border-2 border-gray-300 rounded-lg px-4 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:focus:border-emerald-500">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<UsersIcon class="h-5 w-5 text-emerald-500" />
							<span class="text-base font-medium">
								{defaultTeam || 'Select your team'}
							</span>
						</div>
					</div>
				</Select.Trigger>
				<Select.Content class="max-h-[300px] overflow-y-auto">
					{#each teamsSelect as team}
						<Select.Item
							value={team.value}
							label={team.name}
							class="px-4 py-3 text-base cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
						>
							{team.name}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		{#if defaultTeam}
			<Button
				variant="outline"
				size="sm"
				class="h-12 w-12 p-0 border-2"
				onclick={clearTeamSelection}
				aria-label="Clear team selection"
			>
				<XIcon class="h-4 w-4" />
			</Button>
		{/if}
	</div>

	<!-- Team-Specific Controls -->
	{#if defaultTeam}
		<div class="space-y-3">
			<!-- My Matches Toggle -->
			<Button
				variant={showMyMatchesOnly ? "default" : "outline"}
				class="w-full h-12 text-base font-medium"
				onclick={toggleMyMatches}
			>
				<FilterIcon class="mr-2 h-4 w-4" />
				{showMyMatchesOnly ? 'Showing My Matches' : 'Show Only My Matches'}
			</Button>

			<!-- Next Match Info -->
			{#if nextMatchInfo}
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-3 dark:bg-blue-900/20 dark:border-blue-800">
					<div class="flex items-start gap-3">
						<ClockIcon class="h-5 w-5 text-blue-500 mt-0.5" />
						<div>
							<div class="text-sm font-medium text-blue-900 dark:text-blue-100">
								Next Match
							</div>
							<div class="text-xs text-blue-700 dark:text-blue-300 mt-1">
								{nextMatchInfo.opponent} • Court {nextMatchInfo.court + 1} • Round {nextMatchInfo.round + 1}
							</div>
							{#if nextMatchInfo.isCurrentRound}
								<div class="text-xs font-semibold text-blue-800 dark:text-blue-200 mt-1">
									⚡ Playing now!
								</div>
							{:else}
								<div class="text-xs text-blue-600 dark:text-blue-400 mt-1">
									Coming up in Round {nextMatchInfo.round + 1}
								</div>
							{/if}
						</div>
					</div>
				</div>
			{:else if showMyMatchesOnly}
				<div class="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center dark:bg-gray-800 dark:border-gray-700">
					<div class="text-sm text-gray-600 dark:text-gray-400">
						All matches completed for {defaultTeam}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.mobile-team-filter {
		position: sticky;
		top: 0;
		z-index: 20;
	}

	@media (min-width: 768px) {
		.mobile-team-filter {
			position: static;
		}
	}
</style>