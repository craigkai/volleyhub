<script lang="ts">
	import Matches from '$components/Matches.svelte';
	import Bracket from '$components/Bracket.svelte';
	import Standings from '$components/Standings.svelte';
	import * as Select from '$components/ui/select/index.js';
	import * as Tabs from '$components/ui/tabs/index.js';
	import * as Card from '$components/ui/card/index.js';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { pushState } from '$app/navigation';
	import { onMount, tick } from 'svelte';
	import * as AlertDialog from '$components/ui/alert-dialog/index.js';
	import { closeModal } from '$lib/helper.svelte';
	import EditMatch from '$components/EditMatch.svelte';
	import Settings from '$components/Settings.svelte';
	import Teams from '$components/Teams.svelte';
	import { error } from '@sveltejs/kit';
	import BorderBeam from '$components/magic-ui/BorderBeam.svelte';

	let { data = $bindable() } = $props();

	// State
	let defaultTeam = $state(data.defaultTeam);
	let readOnly = $state(data.readOnly);
	let { teams, matches, bracket, tournament } = $state(data);

	// Getting reactivity to work?
	let _dog = '';
	// If we update teams, we should also update matches?
	$effect(() => {
		_dog = JSON.stringify(teams?.teams) || '';
		// If we aren't
		if (data.eventId !== 'create' && teams) {
			console.log(`Reloading matches`);

			try {
				if (data.matches?.event_id) data.matches.load(data.matches.event_id);
			} catch (err) {
				console.error('Error loading matches:', err);
				error(500, 'Failed to load matches');
			}
		}
	});

	let historyReady = false;
	onMount(async () => {
		await tick();
		historyReady = true;
	});

	const teamsSelect = $derived(
		data?.teams?.teams
			?.map((team: { name: string }) => {
				return { value: team.name, name: team.name };
			})
			.concat([{ value: '', name: 'none' }]) || []
	);

	let open = $state($page.state.showModal);

	$effect(() => {
		open = $page.state.showModal ?? false;
	});

	const isCreate = $derived(data?.eventId === 'create');

	const tabsWidth = $derived(readOnly ? 'grid-cols-3' : 'grid-cols-5');
</script>

{#if $page.state.showModal && $page.state.matchId}
	<AlertDialog.Root
		bind:open
		onOpenChange={closeModal}
		closeOnOutsideClick={true}
		closeOnEscape={true}
	>
		<AlertDialog.Content>
			{#if $page.state.type === 'pool'}
				{#if matches}
					<EditMatch matchId={$page.state.matchId as number} {matches} />
				{/if}
			{:else if bracket}
				<EditMatch matchId={$page.state.matchId as number} matches={bracket} />
			{/if}
		</AlertDialog.Content>
	</AlertDialog.Root>
{/if}

<div class="page-container flex flex-col items-center">
	<div class="header">{data?.tournament?.name}</div>

	{#if readOnly}
		<div class="select-container">
			<Select.Root
				selected={{ value: defaultTeam, label: defaultTeam as unknown as string }}
				onSelectedChange={(v) => {
					if (v) defaultTeam = v?.value?.toString() ?? '';

					if (browser && historyReady) {
						const url = new URL($page.url);
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
					<Select.Value placeholder="Select a team" />
				</Select.Trigger>
				<Select.Content>
					{#each teamsSelect as team}
						<Select.Item value={team.value} label={team.name}>{team.name}</Select.Item>
					{/each}
				</Select.Content>
				<Select.Input name="selectedTeam" />
			</Select.Root>
		</div>
	{/if}

	<Tabs.Root value={readOnly ? 'matches' : 'settings'} class="tabs-container ">
		<Tabs.List class="mb-4 grid w-full gap-2 {tabsWidth} dark:bg-gray-700">
			{#if !readOnly}
				<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
				<Tabs.Trigger disabled={isCreate} value="teams">Teams</Tabs.Trigger>
			{/if}
			<Tabs.Trigger disabled={isCreate} value="matches">Matches</Tabs.Trigger>
			<Tabs.Trigger disabled={isCreate} value="standings">Standings</Tabs.Trigger>
			<Tabs.Trigger disabled={true} value="bracket">Bracket</Tabs.Trigger>
		</Tabs.List>

		{#if !readOnly}
			<Tabs.Content value="settings" class="tab-content">
				<Card.Root
					class="relative flex max-w-xl flex-col items-start justify-between rounded-3xl border border-gray-500/70 bg-background p-7 dark:bg-gray-700"
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

			<Tabs.Content value="teams" class="tab-content">
				<Card.Root
					class="min-w-xl relative flex max-w-xl flex-col items-start justify-between rounded-3xl border border-gray-500/70 bg-background p-7 dark:bg-gray-700"
				>
					<BorderBeam size={150} duration={12} />
					<Card.Header>
						<Card.Title>Teams</Card.Title>
						<Card.Description>add/edit/remove teams</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-2">
						{#if teams}
							<Teams bind:teams />
						{/if}
					</Card.Content>
				</Card.Root>
			</Tabs.Content>
		{/if}

		<Tabs.Content value="matches" class="tab-content">
			<Card.Root
				class="relative flex flex-col rounded-3xl border border-gray-500/70 bg-background p-7 dark:bg-gray-700"
			>
				<BorderBeam size={150} duration={12} />
				<Card.Header>
					<Card.Title>Matches</Card.Title>
					<Card.Description>Results of pool play (live)</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-2">
					{#if tournament && matches && teams}
						<Matches {defaultTeam} {readOnly} {tournament} {matches} {teams} />
					{/if}
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="standings" class="tab-content">
			<Card.Root
				class="min-w-xl relative flex max-w-xl flex-col rounded-3xl border border-gray-500/70 bg-background p-7 dark:bg-gray-700"
			>
				<BorderBeam size={150} duration={12} />
				<Card.Header>
					<Card.Title>Current Standings</Card.Title>
					<Card.Description>Current standings based on pool play results</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-2">
					{#if tournament && matches && teams}
						<Standings event={tournament} {matches} {teams} {defaultTeam} />
					{/if}
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="bracket" class="tab-content">
			<Card.Root class="dark:bg-gray-700">
				<Card.Header>
					<Card.Title>Bracket</Card.Title>
					<Card.Description>Single/Double elim bracket</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-2">
					{#if tournament && matches && teams && bracket}
						<Bracket {tournament} {matches} {teams} {bracket} {readOnly} />
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

	.tabs-container {
		width: 100%;
		max-width: 800px;
		margin: auto;
	}

	.tab-content {
		min-width: 300px; /* Adjust based on your needs */
		max-width: 100%; /* Ensure it doesn’t exceed container */
		/* Optionally, set a fixed height if needed */
		/* height: 500px; */
		box-sizing: border-box;
	}
</style>
