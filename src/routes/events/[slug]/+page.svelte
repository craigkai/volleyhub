<script lang="ts">
	import Matches from '$components/Matches.svelte';
	import Bracket from '$components/Bracket.svelte';
	import Standings from '$components/Standings.svelte';
	import * as Select from '$components/ui/select/index.js';
	import * as Tabs from '$components/ui/tabs/index.js';
	import * as Card from '$components/ui/card/index.js';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { pushState } from '$app/navigation';
	import { onMount, tick } from 'svelte';
	import Settings from '$components/Settings.svelte';
	import Teams from '$components/Teams.svelte';
	import BorderBeam from '$components/magic-ui/BorderBeam.svelte';
	import * as Tooltip from '$components/ui/tooltip/index.js';
	import TrophyIcon from 'lucide-svelte/icons/trophy';
	import UsersIcon from 'lucide-svelte/icons/users';
	import SettingsIcon from 'lucide-svelte/icons/settings';
	import ListIcon from 'lucide-svelte/icons/list';
	import BarChartIcon from 'lucide-svelte/icons/bar-chart-2';
	import GitBranchIcon from 'lucide-svelte/icons/git-branch';
	import ChevronDownIcon from 'lucide-svelte/icons/chevron-down';
	import { Badge } from '$components/ui/badge';

	let { data = $bindable() } = $props();

	let defaultTeam = $state(data.defaultTeam);
	let readOnly = $state(data.readOnly);
	let teams = $state(data.teams);

	let historyReady = false;
	onMount(async () => {
		await tick();
		historyReady = true;
	});

	const teamsSelect = $derived(
		data?.teams?.teams
			.sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name))
			?.map((team: { name: string }) => {
				return { value: team.name, name: team.name };
			})
			.concat([{ value: '', name: 'None' }]) || []
	);

	const isCreate = $derived(data?.eventId === 'create');

	const tabsWidth = $derived(readOnly ? 'grid-cols-3' : 'grid-cols-4');
</script>

<svelte:head>
	<title>{data?.tournament?.name || 'Tournament Management'}</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-8 text-center">
		<div class="mb-2 flex items-center justify-center gap-2">
			<TrophyIcon class="h-8 w-8 text-emerald-600" />
			<h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
				{data?.tournament?.name || 'Tournament Management'}
			</h1>
		</div>
		{#if data?.tournament?.date}
			<p class="text-sm text-gray-500 dark:text-gray-400">
				{new Date(data.tournament.date).toLocaleDateString('en-US', {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})}
			</p>
		{/if}
	</div>

	{#if readOnly}
		<div class="mb-6 flex justify-center">
			<div class="relative w-full max-w-xs">
				<Select.Root
					value={defaultTeam}
					onValueChange={(v) => {
						if (v) defaultTeam = v?.value?.toString() ?? '';

						if (browser && historyReady) {
							const url = new URL(page.url);
							if (defaultTeam) {
								url.searchParams.set('team', defaultTeam);
							} else {
								url.searchParams.delete('team');
							}
							pushState(url.href, {});
						}
					}}
				>
					<Select.Trigger
						class="w-full border-gray-300 bg-white py-2 pr-10 pl-3 text-left shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800"
					>
						<div class="flex items-center gap-2">
							<UsersIcon class="h-4 w-4 text-gray-500" />
							<span>{defaultTeam ? defaultTeam : 'Select your team'}</span>
						</div>
						<ChevronDownIcon class="h-4 w-4 opacity-50" />
					</Select.Trigger>
					<Select.Content class="max-h-[300px] overflow-y-auto">
						{#each teamsSelect as team}
							<Select.Item value={team.value} label={team.name}>
								{team.name === 'None' ? 'Clear selection' : team.name}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				{#if defaultTeam}
					<div class="mt-2 text-center">
						<Badge
							variant="outline"
							class="border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
						>
							Viewing as: {defaultTeam}
						</Badge>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<div class="mx-auto max-w-5xl">
		<Tabs.Root class="w-full" value={readOnly ? 'matches' : 'settings'}>
			<Tabs.List class="mb-6 grid gap-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-800 {tabsWidth}">
				{#if !readOnly}
					<Tabs.Trigger
						value="settings"
						class="flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-emerald-400"
					>
						<SettingsIcon class="h-4 w-4" />
						<span>Settings</span>
					</Tabs.Trigger>
					<Tabs.Trigger
						disabled={isCreate}
						value="teams"
						class="flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-emerald-400"
					>
						<UsersIcon class="h-4 w-4" />
						<span>Teams</span>
					</Tabs.Trigger>
				{/if}
				<Tabs.Trigger
					disabled={isCreate}
					value="matches"
					class="flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-emerald-400"
				>
					<ListIcon class="h-4 w-4" />
					<span>Matches</span>
				</Tabs.Trigger>
				<Tabs.Trigger
					disabled={isCreate}
					value="standings"
					class="flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-emerald-400"
				>
					<BarChartIcon class="h-4 w-4" />
					<span>Standings</span>
				</Tabs.Trigger>
				<!-- <Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<div>
								<Tabs.Trigger
									disabled={true}
									value="bracket"
									class="flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-emerald-400"
								>
									<GitBranchIcon class="h-4 w-4" />
									<span>Bracket</span>
								</Tabs.Trigger>
							</div>
						</Tooltip.Trigger>
						<Tooltip.Content
							side="bottom"
							class="bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
						>
							<p class="px-2 py-1 text-sm">Coming soon!</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider> -->
			</Tabs.List>

			{#if !readOnly}
				<Tabs.Content value="settings">
					<Card.Root
						class="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800"
					>
						<div class="absolute inset-0 overflow-hidden">
							<BorderBeam size={150} duration={12} />
						</div>
						<div class="relative">
							<Card.Header
								class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
							>
								<div class="flex items-center gap-2">
									<SettingsIcon class="h-5 w-5 text-emerald-600" />
									<Card.Title class="text-xl font-semibold text-gray-900 dark:text-white"
										>Tournament Settings</Card.Title
									>
								</div>
								<Card.Description class="text-gray-500 dark:text-gray-400">
									Configure your tournament details and structure
								</Card.Description>
							</Card.Header>
							<Card.Content class="p-6">
								<Settings eventId={data.eventId as number | 'create'} {data} />
							</Card.Content>
						</div>
					</Card.Root>
				</Tabs.Content>

				<Tabs.Content value="teams">
					<Card.Root
						class="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800"
					>
						<div class="absolute inset-0 overflow-hidden">
							<BorderBeam size={150} duration={12} />
						</div>
						<div class="relative">
							<Card.Header
								class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
							>
								<div class="flex items-center gap-2">
									<UsersIcon class="h-5 w-5 text-emerald-600" />
									<Card.Title class="text-xl font-semibold text-gray-900 dark:text-white"
										>Teams Management</Card.Title
									>
								</div>
								<Card.Description class="text-gray-500 dark:text-gray-400">
									Add, edit, or remove teams participating in the tournament
								</Card.Description>
							</Card.Header>
							<Card.Content class="p-6">
								{#if teams}
									<Teams bind:teams matches={data.matches} />
								{/if}
							</Card.Content>
						</div>
					</Card.Root>
				</Tabs.Content>
			{/if}

			<Tabs.Content value="matches">
				<Card.Root
					class="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800"
				>
					<div class="absolute inset-0 overflow-hidden">
						<BorderBeam size={150} duration={12} />
					</div>
					<div class="relative">
						<Card.Header
							class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
						>
							<div class="flex items-center gap-2">
								<ListIcon class="h-5 w-5 text-emerald-600" />
								<Card.Title class="text-xl font-semibold text-gray-900 dark:text-white"
									>Match Schedule</Card.Title
								>
							</div>
							<Card.Description class="text-gray-500 dark:text-gray-400">
								View and manage tournament matches and results
							</Card.Description>
						</Card.Header>
						<Card.Content class="p-6">
							{#if data.tournament && data.matches && data.teams}
								<Matches {defaultTeam} {readOnly} {data} />
							{:else}
								<div
									class="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"
								>
									<p class="text-sm text-gray-500 dark:text-gray-400">No match data available</p>
								</div>
							{/if}
						</Card.Content>
					</div>
				</Card.Root>
			</Tabs.Content>

			<Tabs.Content value="standings">
				<Card.Root
					class="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800"
				>
					<div class="absolute inset-0 overflow-hidden">
						<BorderBeam size={150} duration={12} />
					</div>
					<div class="relative">
						<Card.Header
							class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
						>
							<div class="flex items-center gap-2">
								<BarChartIcon class="h-5 w-5 text-emerald-600" />
								<Card.Title class="text-xl font-semibold text-gray-900 dark:text-white"
									>Tournament Standings</Card.Title
								>
							</div>
							<Card.Description class="text-gray-500 dark:text-gray-400">
								Current rankings based on match results
							</Card.Description>
						</Card.Header>
						<Card.Content class="p-6">
							{#if data.tournament && data.matches && teams}
								<Standings event={data.tournament} matches={data.matches} {defaultTeam} {teams} />
							{:else}
								<div
									class="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"
								>
									<p class="text-sm text-gray-500 dark:text-gray-400">
										No standings data available
									</p>
								</div>
							{/if}
						</Card.Content>
					</div>
				</Card.Root>
			</Tabs.Content>

			<Tabs.Content value="bracket">
				<Card.Root
					class="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800"
				>
					<div class="absolute inset-0 overflow-hidden">
						<BorderBeam size={150} duration={12} />
					</div>
					<div class="relative">
						<Card.Header
							class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
						>
							<div class="flex items-center gap-2">
								<GitBranchIcon class="h-5 w-5 text-emerald-600" />
								<Card.Title class="text-xl font-semibold text-gray-900 dark:text-white"
									>Tournament Bracket</Card.Title
								>
							</div>
							<Card.Description class="text-gray-500 dark:text-gray-400">
								Single/Double elimination bracket view
							</Card.Description>
						</Card.Header>
						<Card.Content class="p-6">
							{#if data.tournament && data.matches && teams && data.bracket}
								<Bracket
									tournament={data.tournament}
									matches={data.matches}
									bracket={data.bracket}
									{teams}
									{readOnly}
								/>
							{:else}
								<div
									class="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"
								>
									<p class="text-sm text-gray-500 dark:text-gray-400">Bracket view coming soon</p>
								</div>
							{/if}
						</Card.Content>
					</div>
				</Card.Root>
			</Tabs.Content>
		</Tabs.Root>
	</div>
</div>

<style>
	/* Smooth transitions for hover states */
	:global(.tabs-trigger),
	:global(.select-trigger) {
		transition: all 0.2s ease;
	}

	/* Ensure BorderBeam doesn't overflow */
	:global(.border-beam-container) {
		overflow: hidden;
	}

	/* Focus styles for better accessibility */
	:global(button:focus-visible),
	:global(a:focus-visible) {
		outline: 2px solid rgb(16 185 129 / 0.5);
		outline-offset: 2px;
	}
</style>
