<script lang="ts">
	import Matches from '$components/Matches.svelte';
	import Standings from '$components/Standings.svelte';
	import * as Select from '$components/ui/select/index.js';
	import {
		Root as TabsRoot,
		List as TabsList,
		Trigger as TabsTrigger,
		Content as TabsContent
	} from '$components/ui/tabs';
	import * as Card from '$components/ui/card/index.js';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { pushState } from '$app/navigation';
	import { onMount, tick } from 'svelte';
	import Settings from '$components/Settings.svelte';
	import Teams from '$components/Teams.svelte';
	import ErrorBoundary from '$components/ErrorBoundary.svelte';
	import TrophyIcon from 'lucide-svelte/icons/trophy';
	import UsersIcon from 'lucide-svelte/icons/users';
	import SettingsIcon from 'lucide-svelte/icons/settings';
	import ListIcon from 'lucide-svelte/icons/list';
	import BarChartIcon from 'lucide-svelte/icons/bar-chart-2';
	import BellIcon from 'lucide-svelte/icons/bell';
	import ShareButton from '$components/ShareButton.svelte';
	import NotificationSubscriber from '$components/NotificationSubscriber.svelte';

	let { data = $bindable() } = $props();

	const defaultTeamInitial = data?.defaultTeam ?? '';
	let defaultTeam = $state(defaultTeamInitial);
	let isInitialLoad = $state(true);
	let readOnly = $state(data?.readOnly ?? false);
	let teams = $state(data?.teams);

	let historyReady = $state(false);
	let mounted = $state(false);
	let lastNavigationUpdate = $state('');

	onMount(async () => {
		await tick();
		historyReady = true;
		mounted = true;
		isInitialLoad = false;
	});


	// Use derived state instead of mutating data.teams directly
	const effectiveTeams = $derived(teams || data?.teams);

	const teamsSelect = $derived(
		[...(effectiveTeams?.teams ?? [])]
			.sort((a, b) => a.name.localeCompare(b.name))
			.map((team) => ({ value: team.name, name: team.name, id: team.id }))
			.concat([{ value: '', name: 'None', id: null }])
	);

	const isCreate = $derived(data?.eventId ? data.eventId === 'create' : true);
	const tabsWidth = $derived(readOnly ? 'grid-cols-2' : 'grid-cols-4');

	const tabsReady = $derived(mounted && data && data.eventId);

	// Find selected team data for notifications
	const selectedTeamData = $derived(
		defaultTeam && effectiveTeams?.teams
			? effectiveTeams.teams.find(t => t.name === defaultTeam)
			: null
	);

	// Helper to check which team has notifications enabled
	const getSubscribedTeamId = () => {
		if (!browser || !data?.eventId) return null;
		const storageKey = `notify_${data.eventId}`;
		return localStorage.getItem(storageKey);
	};

	// Get subscribed team info for display
	let subscribedTeamId = $state<string | null>(null);
	const subscribedTeamData = $derived(
		subscribedTeamId && effectiveTeams?.teams
			? effectiveTeams.teams.find(t => t.id.toString() === subscribedTeamId)
			: null
	);

	// Update subscribed team when storage changes
	onMount(() => {
		// Initial check
		subscribedTeamId = getSubscribedTeamId();

		const updateSubscribedTeam = () => {
			const newSubscribedTeamId = getSubscribedTeamId();
			subscribedTeamId = newSubscribedTeamId;
		};

		// Listen for storage changes (when subscription changes)
		window.addEventListener('storage', updateSubscribedTeam);

		// Also check periodically in case changes happen in same tab
		const interval = setInterval(updateSubscribedTeam, 1000);

		return () => {
			window.removeEventListener('storage', updateSubscribedTeam);
			clearInterval(interval);
		};
	});
</script>

<svelte:head>
	<title>{data?.tournament?.name || 'Tournament Management'}</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
	<div class="mb-6 text-center">
		<div class="mb-2 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
			<TrophyIcon class="h-6 w-6 text-emerald-600 sm:h-8 sm:w-8" />
			<h1 class="text-xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
				{data?.tournament?.name || 'Tournament Management'}
			</h1>
		</div>
		<div class="mb-3 flex justify-center">
			<ShareButton
				title={data?.tournament?.name || 'Tournament'}
				text="Check out this volleyball tournament!"
				url={typeof window !== 'undefined' ? window.location.href : ''}
				variant="outline"
				size="sm"
			/>
		</div>
		{#if data?.tournament?.date}
			<p class="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
				{new Date(data.tournament.date).toLocaleDateString('en-US', {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})}
			</p>
		{/if}
	</div>

	{#if readOnly && mounted}
		<div class="mb-4 flex justify-center">
			<div class="relative w-full max-w-sm">
				<Select.Root
					type="single"
					value={defaultTeam}
					onValueChange={(v) => {
						const newTeam = v ?? '';
						defaultTeam = newTeam;

						if (browser && historyReady) {
							const url = new URL(page.url);
							if (newTeam) {
								url.searchParams.set('team', newTeam);
							} else {
								url.searchParams.delete('team');
							}
							pushState(url.href, {});
						}
					}}
				>
					<Select.Trigger
						class="w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-left shadow-sm transition-colors hover:border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none sm:px-4 sm:py-2.5 dark:border-emerald-700 dark:bg-gray-800 dark:text-white dark:hover:border-emerald-600"
					>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<UsersIcon class="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
								<span class="text-sm font-medium sm:text-base"
									>{defaultTeam ? defaultTeam : 'Select your team'}</span
								>
							</div>
						</div>
					</Select.Trigger>
					<Select.Content
						class="max-h-[300px] overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
					>
						{#each teamsSelect as team}
							<Select.Item
								value={team.value}
								label={team.name}
								class="cursor-pointer px-4 py-2 text-gray-800 hover:bg-emerald-50 focus:bg-emerald-50 dark:text-white dark:hover:bg-emerald-900/30 dark:focus:bg-emerald-900/30"
							>
								<div class="flex items-center justify-between gap-2 w-full">
									<div class="flex items-center gap-2">
										{#if team.name === undefined}
											<span>Clear selection</span>
										{:else}
											<span>{team.name}</span>
										{/if}
									</div>
									{#if team.id && subscribedTeamId && team.id.toString() === subscribedTeamId}
										<BellIcon class="h-4 w-4 text-emerald-600 dark:text-emerald-400" title="Notifications enabled" />
									{/if}
								</div>
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</div>

		{#if defaultTeam && selectedTeamData}
			<div class="mb-4 flex justify-center">
				<NotificationSubscriber
					selectedTeam={selectedTeamData.id.toString()}
					selectedTeamName={defaultTeam}
					eventId={data.eventId}
					supabase={data.supabase}
				/>
			</div>
		{/if}
	{/if}

	<div class="mx-auto max-w-5xl">
		{#if tabsReady}
			{#key data.eventId}
				<TabsRoot class="w-full" value={readOnly ? 'matches' : 'settings'}>
					<div class="flex justify-center">
						<TabsList class="w-full">
							{#if !readOnly}
								<TabsTrigger
									value="settings"
									class="flex items-center justify-center gap-1 px-2 py-1.5 text-xs data-[state=active]:bg-white data-[state=active]:text-emerald-700 sm:gap-2 sm:px-3 sm:py-2 sm:text-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-emerald-400"
								>
									<SettingsIcon class="h-3 w-3 sm:h-4 sm:w-4" />
									<span class="xs:inline hidden sm:inline">Settings</span>
								</TabsTrigger>
								<TabsTrigger
									disabled={isCreate}
									value="teams"
									class="flex items-center justify-center gap-1 px-2 py-1.5 text-xs data-[state=active]:bg-white data-[state=active]:text-emerald-700 sm:gap-2 sm:px-3 sm:py-2 sm:text-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-emerald-400"
								>
									<UsersIcon class="h-3 w-3 sm:h-4 sm:w-4" />
									<span class="xs:inline hidden sm:inline">Teams</span>
								</TabsTrigger>
							{/if}
							<TabsTrigger
								disabled={isCreate}
								value="matches"
								class="flex items-center justify-center gap-1 px-2 py-1.5 text-xs data-[state=active]:bg-white data-[state=active]:text-emerald-700 sm:gap-2 sm:px-3 sm:py-2 sm:text-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-emerald-400"
							>
								<ListIcon class="h-3 w-3 sm:h-4 sm:w-4" />
								<span class="xs:inline hidden sm:inline">Matches</span>
							</TabsTrigger>
							<TabsTrigger
								disabled={isCreate}
								value="standings"
								class="flex items-center justify-center gap-1 px-2 py-1.5 text-xs data-[state=active]:bg-white data-[state=active]:text-emerald-700 sm:gap-2 sm:px-3 sm:py-2 sm:text-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-emerald-400"
							>
								<BarChartIcon class="h-3 w-3 sm:h-4 sm:w-4" />
								<span class="xs:inline hidden sm:inline">Standings</span>
							</TabsTrigger>
						</TabsList>
					</div>

					{#if !readOnly}
						<TabsContent value="settings">
							<Card.Root
								class="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800"
							>
								<div class="relative">
									<Card.Header
										class="border-b border-gray-200 bg-gray-50 p-3 sm:p-6 dark:border-gray-700 dark:bg-gray-900"
									>
										<div class="flex items-center gap-2">
											<SettingsIcon class="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5" />
											<Card.Title
												class="text-lg font-semibold text-gray-900 sm:text-xl dark:text-white"
												>Tournament Settings</Card.Title
											>
										</div>
										<Card.Description class="text-sm text-gray-500 dark:text-gray-400">
											Configure your tournament details and structure
										</Card.Description>
									</Card.Header>
									<Card.Content class="p-3 sm:p-6">
										<Settings eventId={data.eventId as number | 'create'} {data} />
									</Card.Content>
								</div>
							</Card.Root>
						</TabsContent>

						<TabsContent value="teams">
							<Card.Root
								class="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800"
							>
								<div class="relative">
									<Card.Header
										class="border-b border-gray-200 bg-gray-50 p-3 sm:p-6 dark:border-gray-700 dark:bg-gray-900"
									>
										<div class="flex items-center gap-2">
											<UsersIcon class="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5" />
											<Card.Title
												class="text-lg font-semibold text-gray-900 sm:text-xl dark:text-white"
												>Teams Management</Card.Title
											>
										</div>
										<Card.Description class="text-sm text-gray-500 dark:text-gray-400">
											Add, edit, or remove teams participating in the tournament
										</Card.Description>
									</Card.Header>
									<Card.Content class="p-3 sm:p-6">
										{#if effectiveTeams}
											<ErrorBoundary>
												<Teams bind:teams matches={data.matches} />
											</ErrorBoundary>
										{/if}
									</Card.Content>
								</div>
							</Card.Root>
						</TabsContent>
					{/if}

					<TabsContent value="matches">
						<Card.Root
							class="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800"
						>
							<div class="relative">
								<Card.Header
									class="border-b border-gray-200 bg-gray-50 p-3 sm:p-6 dark:border-gray-700 dark:bg-gray-900"
								>
									<div class="flex items-center gap-2">
										<ListIcon class="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5" />
										<Card.Title
											class="text-lg font-semibold text-gray-900 sm:text-xl dark:text-white"
											>Match Schedule</Card.Title
										>
									</div>
									<Card.Description class="text-sm text-gray-500 dark:text-gray-400">
										View and manage tournament matches and results
									</Card.Description>
								</Card.Header>
								<Card.Content class="p-0 sm:p-6">
									{#if data.tournament && data.matches && effectiveTeams}
										<ErrorBoundary>
											<Matches {defaultTeam} {readOnly} {data} />
										</ErrorBoundary>
									{:else}
										<div
											class="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"
										>
											<p class="text-sm text-gray-500 dark:text-gray-400">
												No match data available
											</p>
										</div>
									{/if}
								</Card.Content>
							</div>
						</Card.Root>
					</TabsContent>

					<TabsContent value="standings">
						<Card.Root
							class="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800"
						>
							<div class="relative">
								<Card.Header
									class="border-b border-gray-200 bg-gray-50 p-3 sm:p-6 dark:border-gray-700 dark:bg-gray-900"
								>
									<div class="flex items-center gap-2">
										<BarChartIcon class="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5" />
										<Card.Title
											class="text-lg font-semibold text-gray-900 sm:text-xl dark:text-white"
											>Tournament Standings</Card.Title
										>
									</div>
									<Card.Description class="text-sm text-gray-500 dark:text-gray-400">
										Current rankings based on match results
									</Card.Description>
								</Card.Header>
								<Card.Content class="p-3 sm:p-6">
									{#if data.tournament && data.matches && effectiveTeams}
										<Standings
											event={data.tournament}
											matches={data.matches}
											{defaultTeam}
											teams={effectiveTeams}
										/>
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
					</TabsContent>
				</TabsRoot>
			{/key}
		{:else}
			<div class="mx-auto max-w-5xl">
				<div class="animate-pulse">
					<div class="mb-6 h-10 rounded-lg bg-gray-200 sm:h-12 dark:bg-gray-700"></div>
					<div class="h-80 rounded-xl bg-gray-200 sm:h-96 dark:bg-gray-700"></div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	:global(.tabs-trigger),
	:global(.select-trigger) {
		transition: all 0.2s ease;
	}

	:global(button:focus-visible),
	:global(a:focus-visible) {
		outline: 2px solid rgb(16 185 129 / 0.5);
		outline-offset: 2px;
	}

	/* Mobile-specific improvements */
	@media (max-width: 480px) {
		:global(.xs\:inline) {
			display: inline;
		}
	}
</style>
