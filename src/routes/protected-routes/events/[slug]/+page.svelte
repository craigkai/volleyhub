<script lang="ts">
	import { Spinner } from 'flowbite-svelte';
	import type { PageData } from '$types';
	import { Tournament } from '$lib/tournament';
	import Match from '$lib/components/tournament/Matches.svelte';
	import Teams from '$lib/components/tournament/Teams.svelte';
	import type { HttpError } from '@sveltejs/kit';
	import { error, success } from '$lib/toast';
	import dayjs from 'dayjs';

	export let data: PageData;
	let tournament: Tournament = new Tournament(data?.supabase);

	let name: string, courts: string, pools: string, date: string;

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
				teams,
				name,
				courts,
				pools,
				date
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
				teams,
				name,
				courts,
				pools,
				date
			})
			.then((res) => {
				tournament = res;
				success(`Tournament udpated`);
			})
			.catch((err: { body: { message: string | SvelteToastOptions } }) => error(err.body.message));
	}

	$: tournament.settings.date = dayjs(tournament?.settings?.date).format('YYYY-MM-DD');

	let loadingEventPromise = loadEvent();
</script>

{#await loadingEventPromise}
	<Spinner color="blue" />
{:then}
	<div class="flex flex-col justify-center items-center">
		<form class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
			<div class="w-1/2 m-2">
				<label class="block text-gray-700 text-sm font-bold mb-2" for="username">Event Name:</label>
				<input class="bg-gray-200 p-2 rounded" type="text" bind:value={tournament.settings.name} />
			</div>

			<div class="m-2">
				<label class="block text-gray-700 text-sm font-bold mb-2" for="username"
					>Number of Courts:</label
				>
				<input
					class="bg-gray-200 p-2 rounded"
					type="number"
					bind:value={tournament.settings.courts}
				/>
			</div>

			<div class="m-2">
				<label class="block text-gray-700 text-sm font-bold mb-2" for="username"
					>Number of Pool Play Games:</label
				>
				<input
					class="bg-gray-200 p-2 rounded"
					type="number"
					bind:value={tournament.settings.pools}
				/>
			</div>

			<div class="m-2">
				<label class="block text-gray-700 text-sm font-bold mb-2" for="username">Date:</label>
				<input class="bg-gray-200 p-2 rounded" type="date" bind:value={tournament.settings.date} />
			</div>

			<Teams {tournament} />

			<div class="m-2">
				{#if data?.eventId === 'create'}
					<button
						class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
						type="button"
						on:click={() => createNewEvent()}
					>
						Create Tournament</button
					>{:else}
					<button
						class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
						type="button"
						on:click={() => updateTournament()}
					>
						Update Tournament Settings</button
					>
				{/if}

				<Match {tournament} />
			</div>
		</form>
	</div>
{/await}
