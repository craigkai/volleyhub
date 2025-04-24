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

	let { data = $bindable() } = $props();

	let defaultTeam = $state(data.defaultTeam);
	let readOnly = $state(data.readOnly);

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
			.concat([{ value: '', name: 'none' }]) || []
	);

	const isCreate = $derived(data?.eventId === 'create');

	const tabsWidth = $derived(readOnly ? 'grid-cols-3' : 'grid-cols-5');
</script>

<svelte:head>
	<title>{data?.tournament?.name}</title>
</svelte:head>

<div class="page-container flex flex-col items-center">
	<div class="header">{data?.tournament?.name}</div>

	{#if readOnly}
		<div class="select-container">
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
				<Select.Trigger class="w-[180px]">
					{defaultTeam ? defaultTeam : 'Select a team'}
				</Select.Trigger>
				<Select.Content>
					{#each teamsSelect as team}
						<Select.Item value={team.value} label={team.name}>{team.name}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	{/if}

	<Tabs.Root class="w-full lg:w-2/3" value={readOnly ? 'matches' : 'settings'}>
		<Tabs.List class="mb-4 grid gap-2 {tabsWidth} dark:bg-gray-700">
			{#if !readOnly}
				<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
				<Tabs.Trigger disabled={isCreate} value="teams">Teams</Tabs.Trigger>
			{/if}
			<Tabs.Trigger disabled={isCreate} value="matches">Matches</Tabs.Trigger>
			<Tabs.Trigger disabled={isCreate} value="standings">Standings</Tabs.Trigger>
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Tabs.Trigger disabled={true} value="bracket">Bracket</Tabs.Trigger>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Coming soon!</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		</Tabs.List>

		{#if !readOnly}
			<Tabs.Content value="settings">
				<Card.Root
					class="bg-background relative flex flex-col items-center justify-between rounded-3xl border border-gray-500/70 dark:bg-gray-700"
				>
					<BorderBeam size={150} duration={12} />

					<Card.Header>
						<Card.Title>Account</Card.Title>
						<Card.Description>Make changes to your event here.</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-2">
						<Settings eventId={data.eventId as number | 'create'} {data} />
					</Card.Content>
				</Card.Root>
			</Tabs.Content>

			<Tabs.Content value="teams">
				<Card.Root
					class="bg-background relative flex flex-col items-center justify-between rounded-3xl border border-gray-500/70 dark:bg-gray-700"
				>
					<BorderBeam size={150} duration={12} />
					<Card.Header>
						<Card.Title>Teams</Card.Title>
						<Card.Description>add/edit/remove teams</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-2">
						{#if data.teams}
							<Teams bind:teams={data.teams} matches={data.matches} />
						{/if}
					</Card.Content>
				</Card.Root>
			</Tabs.Content>
		{/if}

		<Tabs.Content value="matches">
			<Card.Root
				class="bg-background  relative flex-col items-center justify-between rounded-3xl border border-gray-500/70 dark:bg-gray-700"
			>
				<BorderBeam size={150} duration={12} />
				<Card.Header>
					<Card.Title>Matches</Card.Title>
					<Card.Description>Results of pool play (live)</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-2">
					{#if data.tournament && data.matches && data.teams}
						<Matches {defaultTeam} {readOnly} {data} />
					{/if}
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="standings">
			<Card.Root
				class="bg-background relative flex flex-col items-center justify-between rounded-3xl border border-gray-500/70 dark:bg-gray-700"
			>
				<BorderBeam size={150} duration={12} />
				<Card.Header>
					<Card.Title>Current Standings</Card.Title>
					<Card.Description>Current standings based on pool play results</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-2">
					{#if data.tournament && data.matches && data.teams}
						<Standings
							event={data.tournament}
							matches={data.matches}
							teams={data.teams}
							{defaultTeam}
						/>
					{/if}
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="bracket">
			<Card.Root class="dark:bg-gray-700">
				<Card.Header>
					<Card.Title>Bracket</Card.Title>
					<Card.Description>Single/Double elim bracket</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-2">
					{#if data.tournament && data.matches && data.teams && data.bracket}
						<Bracket
							tournament={data.tournament}
							matches={data.matches}
							teams={data.teams}
							bracket={data.bracket}
							{readOnly}
						/>
					{/if}
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</div>

<style>
	.page-container {
		padding: 2rem;
		max-width: 1200px;
		margin: auto;
	}

	.header {
		font-size: 2rem;
		font-weight: 700;
		color: #3d73c0;
		margin-bottom: 1rem;
		text-align: center;
	}

	.select-container {
		margin-bottom: 1.5rem;
	}
</style>
