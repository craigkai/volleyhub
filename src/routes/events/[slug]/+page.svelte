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
	import { closeModal, initiateEvent } from '$lib/helper.svelte';
	import EditMatch from '$components/EditMatch.svelte';
	import Settings from '$components/Settings.svelte';
	import Teams from '$components/Teams.svelte';
	import { error } from '@sveltejs/kit';

	let { data = $bindable() } = $props();

	// State
	let tournament = $state(data.tournament);
	let bracket = $state(data.bracket);
	let teams = $state(data.teams);
	let matches = $state(data.matches);
	let defaultTeam = $state(data.defaultTeam);
	let readOnly = $state(data.readOnly);

	$effect(() => {
		(async () => {
			if (data.event_id !== 'create') {
				let res;
				try {
					await Promise.all([tournament?.load(), matches?.load(), teams?.load(), bracket?.load()]);
				} catch (err) {
					console.error('Error initiating event:', err);
					error(500, 'Failed to load event');
				}

				if (!res) {
					error(404, 'Event not found');
				}
			}
		})();
	});

	let historyReady = false;
	onMount(async () => {
		await tick();
		historyReady = true;
	});

	const teamsSelect = $derived(
		teams?.teams
			?.map((team: { name: string }) => {
				return { value: team.name, name: team.name };
			})
			.concat([{ value: '', name: 'none' }]) || []
	);

	let open = $state($page.state.showModal);

	$effect(() => {
		open = $page.state.showModal ?? false;
	});

	const isCreate = $derived(data?.event_id === 'create');

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
					<EditMatch matchId={$page.state.matchId as number} bind:matches />
				{/if}
			{:else if bracket}
				<EditMatch matchId={$page.state.matchId as number} bind:matches={bracket} />
			{/if}
		</AlertDialog.Content>
	</AlertDialog.Root>
{/if}

<div class="page-container flex flex-col items-center">
	<div class="header">{tournament?.name}</div>

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

	<Tabs.Root value={readOnly ? 'matches' : 'settings'} class="tabs-container">
		<Tabs.List class="grid w-full gap-2 mb-4 {tabsWidth}">
			{#if !readOnly}
				<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
				<Tabs.Trigger disabled={isCreate} value="teams">Teams</Tabs.Trigger>
			{/if}
			<Tabs.Trigger disabled={isCreate} value="matches">Matches</Tabs.Trigger>
			<Tabs.Trigger disabled={isCreate} value="standings">Standings</Tabs.Trigger>
			<Tabs.Trigger disabled={isCreate} value="bracket">Bracket</Tabs.Trigger>
		</Tabs.List>

		{#if !readOnly}
			<Tabs.Content value="settings">
				<Card.Root>
					<Card.Header>
						<Card.Title>Account</Card.Title>
						<Card.Description>Make changes to your event here.</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-2">
						<Settings event_id={data.event_id as number | 'create'} {data} />
					</Card.Content>
				</Card.Root>
			</Tabs.Content>

			<Tabs.Content value="teams">
				<Card.Root>
					<Card.Header>
						<Card.Title>Teams</Card.Title>
						<Card.Description>add/edit/remove teams</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-2">
						<Teams bind:teams />
					</Card.Content>
				</Card.Root>
			</Tabs.Content>
		{/if}

		<Tabs.Content value="matches" class="card-container">
			<Card.Root>
				<Card.Header>
					<Card.Title>Matches</Card.Title>
					<Card.Description>Results of pool play (live)</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-2">
					{#if tournament && matches && teams}
						<Matches bind:tournament bind:matches {teams} {defaultTeam} {readOnly} />
					{/if}
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="standings" class="card-container">
			<Card.Root>
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

		<Tabs.Content value="bracket" class="card-container">
			<Card.Root>
				<Card.Header>
					<Card.Title>Bracket</Card.Title>
					<Card.Description>Single/Double elim bracket</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-2">
					{#if tournament && matches && teams && bracket}
						<Bracket {tournament} {bracket} {teams} {matches} {readOnly} />
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
		color: #1f2937;
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

	.card-container {
		background-color: #ffffff;
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}
</style>
