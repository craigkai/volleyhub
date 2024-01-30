<script lang="ts">
	import dayjs from 'dayjs';
	import type { SvelteToastOptions } from '@zerodevx/svelte-toast/stores';
	import { goto } from '$app/navigation';
	import { Input, Label, Button } from 'flowbite-svelte';
	import { error, success } from '$lib/toast';
	import type { HttpError } from '@sveltejs/kit';
	import { Select } from 'flowbite-svelte';
	import { Event } from '$lib/event';

	export let tournament: Event;
	export let event_id: number | string;

	async function createNewEvent(): Promise<void> {
		tournament.courts = Number(tournament.courts);
		tournament.pools = Number(tournament.pools);

		tournament
			.create(tournament)
			.then(async () => {
				success(`Tournament created`);
				// Navigate to the page with the [slug] value set to our tournament Id
				goto(`/protected-routes/events/${tournament.id}`);
			})
			.catch((err: HttpError) => {
				error(err?.body?.message);
			});
	}

	async function updateTournament(): Promise<void> {
		tournament.courts = Number(tournament.courts);
		tournament.pools = Number(tournament.pools);

		tournament
			.update(tournament.id, tournament)
			.then((res: Event) => {
				tournament = res;
				success(`Tournament settings updated`);
			})
			.catch((err) => {
				console.error(err);
				error(err.body?.message ?? `Something went wrong: ${err}`);
			});
	}

	async function deleteEvent(): Promise<void> {
		tournament
			.delete()
			.then(() => {
				goto('/protected-routes/dashboard');
				success(`Deleted ${tournament.name}`);
			})
			.catch((err: { body: { message: string | SvelteToastOptions } }) =>
				error(err?.body?.message)
			);
	}

	$: tournament?.date, (tournament.date = dayjs(tournament?.date).format('YYYY-MM-DD'));
</script>

<div class="dark:bg-nord-2 m-2 shadow-md rounded flex flex-col items-center lg:w-1/2 sm:w-full">
	<div class="m-2">
		<Label for="first_name" class="mb-2">Event Name:</Label>
		<Input type="text" id="eventName" bind:value={tournament.name} required />
	</div>

	<div class="m-2">
		<Label for="first_name" class="mb-2">Number of Courts:</Label>
		<Input type="number" id="eventCourts" bind:value={tournament.courts} required />
	</div>

	<div class="m-2">
		<Label for="first_name" class="mb-2">Number of Pool Play Games:</Label>
		<Input type="number" id="eventCourts" bind:value={tournament.pools} required />
	</div>

	<div class="m-2">
		<Label>
			Ref'ing:
			<Select
				class="mt-2"
				items={[
					{ value: 'provided', name: 'Provided' },
					{ value: 'teams', name: 'Teams' }
				]}
				bind:value={tournament.refs}
			/>
		</Label>
	</div>

	<div class="m-2">
		<Label class="mb-2">Date:</Label>
		<input id="date" class="bg-gray-200 p-2 rounded" type="date" bind:value={tournament.date} />
	</div>

	<div class="m-2">
		<Label>
			Pool Play Scoring:
			<Select
				class="mt-2"
				items={[
					{ value: 'points', name: 'Points' },
					{ value: 'wins', name: 'Wins' }
				]}
				bind:value={tournament.scoring}
			/>
		</Label>
	</div>

	<div class="m-2">
		{#if event_id === 'create'}
			<Button
				class="bg-nord-10 hover:bg-nord-9 dark:text-nord-1 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
				type="button"
				on:click={() => createNewEvent()}
			>
				Create Tournament</Button
			>{:else}
			<Button
				class="bg-nord-10 hover:bg-nord-9 dark:text-nord-1 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
				type="button"
				on:click={() => updateTournament()}
			>
				Update Tournament Settings</Button
			>
		{/if}
	</div>

	{#if event_id !== 'create'}
		<button
			class="bg-nord-12 m-2 hover:bg-nord-9 dark:text-nord-1 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
			type="button"
			on:click={deleteEvent}>Delete event</button
		>
	{/if}
</div>
