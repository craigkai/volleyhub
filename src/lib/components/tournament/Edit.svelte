<script lang="ts">
	import type { SvelteToastOptions } from '@zerodevx/svelte-toast/stores';
	import type { PageData } from '$types';
	import { error, success } from '$lib/toast';
	import { goto } from '$app/navigation';
	import type { Tournament } from '$lib/tournament';

	export let data: PageData;
	export let teams: string[];
	export let courts: number;
	export let pools: number;
	export let name: string;
	export let date: string;
	export let tournament: Tournament;

	async function createNewEvent(): Promise<void> {
		if (!teams) {
			error('Your teams are not defined?');
			return;
		}

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
			.catch((err: { body: { message: string | SvelteToastOptions } }) => error(err.body.message));
	}

	async function updateTournament(): Promise<void> {
		if (!teams) {
			error('Your teams are not defined?');
			return;
		}

		tournament
			.updateTournament({
				id: tournament.id,
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
</script>

<div class="flex flex-col place-content-start place-items-start place-self-start">
	<div class="w-1/2 m-2">
		Event Name:
		<input class="bg-gray-200 p-2 rounded" type="text" bind:value={name} />
	</div>

	<div class="w-1/2 m-2">
		Teams:
		<input class="bg-gray-200 p-2 rounded" type="text" bind:value={teams} />
	</div>
	<div class="m-2">
		Number of Courts:
		<input class="bg-gray-200 p-2 rounded" type="number" bind:value={courts} />
	</div>

	<div class="m-2">
		Number of Pool Play Games:
		<input class="bg-gray-200 p-2 rounded" type="number" bind:value={pools} />
	</div>
	<div class="m-2">
		Date:
		<input class="bg-gray-200 p-2 rounded" type="date" bind:value={date} />
	</div>

	<div class="">
		{#if data?.eventName === 'create'}
			<button class="rounded bg-gray-400 p-4 hover:bg-gray-600" on:click={() => createNewEvent()}>
				Create Tournament</button
			>{:else}
			<button class="rounded bg-gray-400 p-4 hover:bg-gray-600" on:click={() => updateTournament()}>
				Update Tournament</button
			>
			<button
				disabled={!tournament?.status}
				class="rounded bg-gray-400 p-4 hover:bg-gray-600"
				on:click={() => {}}
			>
				Start Tournament</button
			>
		{/if}
	</div>
</div>
