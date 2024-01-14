<script lang="ts">
	import type { PageData } from '$types';
	import { Tournament } from '$lib/tournament';
	import Matches from '$lib/components/tournament/Matches.svelte';
	import Teams from '$lib/components/tournament/Teams.svelte';
	import type { HttpError } from '@sveltejs/kit';
	import { error, success } from '$lib/toast';
	import dayjs from 'dayjs';
	import type { SvelteToastOptions } from '@zerodevx/svelte-toast/stores';
	import { goto } from '$app/navigation';
	import { Input, Label, Button } from 'flowbite-svelte';

	export let data: PageData;
	let tournament: Tournament = data?.tournament;

	let date = tournament?.settings?.date
		? dayjs(tournament?.settings?.date).format('YYYY-MM-DD')
		: '';

	async function createNewEvent(): Promise<void> {
		tournament
			.createEvent({
				name: tournament.settings.name,
				courts: tournament.settings.courts,
				pools: tournament.settings.pools,
				date: date
			})
			.then(() => {
				success(`Tournament created`);
				// Navigate to the page with the [slug] value set to our tournament Id
				goto(`/protected-routes/events/${tournament?.id}`);
			})
			.catch((err: HttpError) => {
				error(err?.body?.message);
			});
	}

	async function updateTournament(): Promise<void> {
		tournament
			.updateTournament(tournament.id as string, {
				...tournament.settings,
				name: tournament.settings.name,
				courts: Number(tournament.settings.courts),
				pools: Number(tournament.settings.pools),
				date: date
			})
			.then((res: Tournament) => {
				tournament = res;
				success(`Tournament settings updated`);
			})
			.catch((err: { body: { message: string | SvelteToastOptions } }) =>
				error(err?.body?.message)
			);
	}

	async function deleteEvent(): Promise<void> {
		tournament
			.deleteEvent()
			.then(() => {
				goto('/protected-routes/dashboard');
				success(`Deleted ${tournament.settings.name}`);
			})
			.catch((err: { body: { message: string | SvelteToastOptions } }) =>
				error(err?.body?.message)
			);
	}

	$: date, (date = dayjs(date).format('YYYY-MM-DD'));
</script>

<div class="flex flex-col items-center">
	<div class="dark:bg-nord-2 m-2 shadow-md rounded flex flex-col items-center lg:w-1/2 sm:w-full">
		<div class="m-2">
			<Label for="first_name" class="mb-2">Event Name:</Label>
			<Input type="text" id="eventName" bind:value={tournament.settings.name} required />
		</div>

		<div class="m-2">
			<Label for="first_name" class="mb-2">Number of Courts:</Label>
			<Input type="number" id="eventCourts" bind:value={tournament.settings.courts} required />
		</div>

		<div class="m-2">
			<Label for="first_name" class="mb-2">Number of Pool Play Games:</Label>
			<Input type="number" id="eventCourts" bind:value={tournament.settings.pools} required />
		</div>

		<div class="m-2">
			<label class="block text-sm font-bold mb-2" for="date">Date:</label>
			<input id="date" class="bg-gray-200 p-2 rounded" type="date" bind:value={date} />
		</div>

		{#if data?.eventId !== 'create' && tournament}
			<Teams bind:tournament />
		{/if}

		<div class="m-2">
			{#if data?.eventId === 'create'}
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
		{#if data?.eventId !== 'create' && tournament}
			<Matches bind:tournament />
		{/if}

		{#if data?.eventId !== 'create'}
			<button
				class="bg-nord-12 m-2 hover:bg-nord-9 dark:text-nord-1 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
				type="button"
				on:click={deleteEvent}>Delete</button
			>
		{/if}
	</div>
</div>
