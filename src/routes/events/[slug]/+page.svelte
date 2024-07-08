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
	import type { PageData } from '$types';

	let { data = $bindable() }: { data: PageData } = $props();
	let { tournament, bracket, teams, matches, defaultTeam } = $state(data);

	let historyReady = false;
	onMount(async () => {
		await tick();
		historyReady = true;
	});

	$effect(() => {
		if (browser && historyReady) {
			const url = new URL($page.url);
			if (defaultTeam?.value) {
				url.searchParams.set('team', defaultTeam.value);
			} else {
				url.searchParams.delete('team');
			}
			pushState(url.href, '');
		}
	});

	const teamsSelect = $derived(
		() =>
			teams.teams
				?.map((team: { name: string }) => {
					return { value: team.name, name: team.name };
				})
				.concat([{ value: '', name: 'none' }]) || []
	);
</script>

<div class="page-container flex flex-col items-center">
	<div class="header">{tournament?.name}</div>

	<div class="select-container">
		<Select.Root
			bind:selected={defaultTeam}
			onSelectedChange={(v) => {
				if (v) defaultTeam = { value: v, label: v };
			}}
		>
			<Select.Trigger class="w-[180px]">
				<Select.Value placeholder="Select a team" />
			</Select.Trigger>
			<Select.Content>
				{#each $teamsSelect as team}
					<Select.Item value={team.value} label={team.name}>{team.name}</Select.Item>
				{/each}
			</Select.Content>
			<Select.Input name="selectedTeam" />
		</Select.Root>
	</div>

	<Tabs.Root value="matches" class="tabs-container">
		<Tabs.List class="grid w-full grid-cols-3 gap-2 mb-4">
			<Tabs.Trigger value="matches" class="tab-trigger">Matches</Tabs.Trigger>
			<Tabs.Trigger value="standings" class="tab-trigger">Standings</Tabs.Trigger>
			<Tabs.Trigger value="bracket" class="tab-trigger">Bracket</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="matches" class="card-container">
			<Card.Root>
				<Card.Header>
					<Card.Title>Matches</Card.Title>
					<Card.Description>Results of pool play (live)</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-2">
					<Matches
						bind:tournament
						bind:matches
						{teams}
						defaultTeam={defaultTeam?.value}
						readOnly={true}
					/>
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
					<Standings event={tournament} {matches} {teams} defaultTeam={defaultTeam?.value} />
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
					<Bracket {tournament} {bracket} {teams} {matches} readOnly={true} />
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
