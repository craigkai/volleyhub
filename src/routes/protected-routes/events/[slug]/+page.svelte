<script lang="ts">
	import type { PageData } from '$types';
	import Settings from '$components/Settings.svelte';
	import Bracket from '$components/Bracket.svelte';
	import Standings from '$components/Standings.svelte';
	import Matches from '$components/Matches.svelte';
	import Teams from '$components/Teams.svelte';
	import EditMatch from '$components/EditMatch.svelte';
	import * as Tabs from '$components/ui/tabs/index.js';
	import * as Card from '$components/ui/card/index.js';
	import { page } from '$app/stores';
	import * as AlertDialog from '$components/ui/alert-dialog/index.js';
	import { closeModal } from '$lib/helper.svelte';

	let { data = $bindable() }: { data: PageData } = $props();

	let open = $state($page.state.showModal);

	$effect(() => {
		open = $page.state.showModal ?? false;
	});

	let { event_id, form } = data;

	const isCreate = $derived(data?.event_id === 'create');
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
				<EditMatch matchId={$page.state.matchId as number} bind:matches={data.matches} />
			{:else}
				<EditMatch matchId={$page.state.matchId as number} bind:matches={data.bracket} />
			{/if}
		</AlertDialog.Content>
	</AlertDialog.Root>
{/if}

<div class="flex flex-col items-center">
	<div class="m-2">
		<Tabs.Root value="settings" class="w-full">
			<Tabs.List class="grid w-full grid-cols-5">
				<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
				<Tabs.Trigger disabled={isCreate} value="teams">Teams</Tabs.Trigger>
				<Tabs.Trigger disabled={isCreate} value="matches">Matches</Tabs.Trigger>
				<Tabs.Trigger disabled={isCreate} value="standings">Standings</Tabs.Trigger>
				<Tabs.Trigger disabled={isCreate} value="bracket">Bracket</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="settings">
				<Card.Root>
					<Card.Header>
						<Card.Title>Account</Card.Title>
						<Card.Description>Make changes to your event here.</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-2">
						<Settings {event_id} data={form} />
					</Card.Content>
				</Card.Root>
			</Tabs.Content>
			<Tabs.Content value="teams">
				<Card.Root>
					<Card.Header>
						<Card.Title>Teams</Card.Title>
						<Card.Description>Add/remove teams</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-2">
						<Teams bind:teams={data.teams} />
					</Card.Content>
				</Card.Root>
			</Tabs.Content>
			<Tabs.Content value="matches">
				<Card.Root>
					<Card.Header>
						<Card.Title>Matches</Card.Title>
						<Card.Description>Update pool play match results</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-2">
						<Matches
							bind:tournament={data.tournament}
							bind:matches={data.matches}
							teams={data.teams}
							defaultTeam={data.defaultTeam}
							readonly={false}
						/>
					</Card.Content>
				</Card.Root>
			</Tabs.Content>
			<Tabs.Content value="standings">
				<Card.Root>
					<Card.Header>
						<Card.Title>Current Standings</Card.Title>
						<Card.Description>Current standings based on pool play results</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-2">
						<Standings
							event={data}
							bind:matches={data.matches}
							teams={data.teams}
							defaultTeam={data.defaultTeam}
						/>
					</Card.Content>
				</Card.Root>
			</Tabs.Content>
			<Tabs.Content value="bracket">
				<Card.Root>
					<Card.Header>
						<Card.Title>Bracket</Card.Title>
						<Card.Description>Single/Double elim bracket</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-2">
						<Bracket
							tournament={data.tournament}
							bind:bracket={data.bracket}
							bind:matches={data.matches}
							teams={data.teams}
							readOnly={false}
						/>
					</Card.Content>
				</Card.Root>
			</Tabs.Content>
		</Tabs.Root>
	</div>
</div>
