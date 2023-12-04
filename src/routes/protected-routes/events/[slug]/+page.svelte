<script lang="ts">
	import { Spinner } from 'flowbite-svelte';
	import type { PageData } from '$types';
	import { Tournament } from '$lib/tournament';
	import Match from '$lib/components/tournament/Matches.svelte';
	import Teams from '$lib/components/tournament/Teams.svelte';
	import type { HttpError } from '@sveltejs/kit';
	import { error, success } from '$lib/toast';
	import dayjs from 'dayjs';
	import type { SvelteToastOptions } from '@zerodevx/svelte-toast/stores';
	import { goto } from '$app/navigation';
	import { Input, Label, Button } from 'flowbite-svelte';

	export let data: PageData;
	let tournament: Tournament = new Tournament(data?.supabase);

	// Load our event or if creating we just load the edit component
	async function loadEvent() {
		if (data?.eventId != 'create') {
			return await tournament
				.loadEvent(data?.eventId)
				.catch((err: HttpError) => error(err.body.message));
		}
	}

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
				error(err.body.message);
			});
	}

	async function updateTournament(): Promise<void> {
		tournament
			.updateTournament(tournament.id as string, {
				name: tournament.settings.name,
				courts: tournament.settings.courts,
				pools: tournament.settings.pools,
				date: date
			})
			.then((res) => {
				tournament = res;
				success(`Tournament settings updated`);
			})
			.catch((err: { body: { message: string | SvelteToastOptions } }) => error(err.body.message));
	}

	$: date = dayjs(tournament?.settings?.date).format('YYYY-MM-DD');

	let loadingEventPromise = loadEvent();

	$: if (tournament?.settings && tournament.settings?.teams?.length > 0) {
		tournament.createMatches().catch((err) => error(err.body.message));
	}
</script>

{#await loadingEventPromise}
	<Spinner color="blue" />
{:then}
	<div class="flex flex-col items-center">
		<div class="bg-white shadow-md rounded flex flex-col items-center lg:w-1/2 sm:w-full">
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
				<label class="block text-gray-700 text-sm font-bold mb-2" for="username">Date:</label>
				<input class="bg-gray-200 p-2 rounded" type="date" bind:value={date} />
			</div>

			<Teams bind:tournament />

			<div class="m-2">
				{#if data?.eventId === 'create'}
					<Button
						class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
						type="button"
						on:click={() => createNewEvent()}
					>
						Create Tournament</Button
					>{:else}
					<Button
						class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
						type="button"
						on:click={() => updateTournament()}
					>
						Update Tournament Settings</Button
					>
				{/if}
			</div>
			<Match bind:tournament />
		</div>
	</div>
{/await}
