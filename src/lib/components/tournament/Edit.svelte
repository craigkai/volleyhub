<script lang="ts">
	import type { PageData } from '$types';
	import { error, success } from '$lib/toast';
	import { goto } from '$app/navigation';
	import type { Tournament } from '$lib/tournament';

	export let data: PageData;
	export let teams: string;
	export let courts: number;
	export let pools: number;
	export let tournament: Tournament;

	async function createNewTournament(): Promise<void> {
		if (!teams) {
			error('Your teams are not defined?');
			return;
		}
		const teamsArr = teams.split(',');
		tournament
			.createTournament({
				teams: teamsArr,
				courts,
				pools
			})
			.then(() => {
				success(`Tournament created (in memory)`);
				// Navigate to the page with the [slug] value set to our tournament Id
				goto(`/protected-routes/events/${tournament?.id}`);
			})
			.catch((err) => error(err.body.message));
	}
</script>

<div class="flex flex-col place-content-start place-items-start place-self-start">
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
	<div class="">
		{#if data?.eventName === 'create'}
			<button
				class="rounded bg-gray-400 p-4 hover:bg-gray-600"
				on:click={() => createNewTournament()}
			>
				Create Tournament</button
			>{:else}
			<button
				class="rounded bg-gray-400 p-4 hover:bg-gray-600"
				on:click={() => createNewTournament()}
			>
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
