<script lang="ts">
	import type { SvelteToastOptions } from '@zerodevx/svelte-toast/stores';
	import type { PageData } from '$types';
	import { error, success } from '$lib/toast';
	import { goto } from '$app/navigation';
	import type { Tournament } from '$lib/tournament';
	import { Spinner } from 'flowbite-svelte';
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import type { HttpError } from '@sveltejs/kit';

	export let data: PageData;
	export let teams: TeamRow[];
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
			.catch((err: HttpError) => {
				console.log(err);
				error(err.body.message);
			});
	}

	async function updateTournament(): Promise<void> {
		if (!teams) {
			error('Your teams are not defined?');
			return;
		}

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

	let matchesPromise = new Promise(() => {
		setTimeout(() => {}, 1000);
	});

	if (data.eventId !== 'create') {
		// matchesPromise = tournament.loadMatches();
	}
</script>

<div class="flex flex-col justify-center items-center">
	<form class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
		<div class="w-1/2 m-2">
			<label class="block text-gray-700 text-sm font-bold mb-2" for="username">Event Name:</label>
			<input class="bg-gray-200 p-2 rounded" type="text" bind:value={name} />
		</div>

		<div class="m-2">
			<!-- svelte-ignore a11y-label-has-associated-control -->
			<label class="block text-gray-700 text-sm font-bold mb-2">Teams:</label>
			<Table>
				<TableBody>
					{#each teams as team}
						<TableBodyRow>
							<TableBodyCell>{team.name}</TableBodyCell>
							<TableBodyCell>
								<a
									href="/tables"
									class="font-medium text-blue-600 hover:underline dark:text-primary-500">Remove</a
								></TableBodyCell
							>
						</TableBodyRow>
					{/each}
					<TableBodyRow>
						<TableBodyCell>new team...</TableBodyCell>
						<TableBodyCell>
							<a
								href="/tables"
								class="font-medium text-blue-600 hover:underline dark:text-primary-500">Add</a
							></TableBodyCell
						>
					</TableBodyRow>
				</TableBody>
			</Table>
		</div>
		<div class="m-2">
			<label class="block text-gray-700 text-sm font-bold mb-2" for="username"
				>Number of Courts:</label
			>
			<input class="bg-gray-200 p-2 rounded" type="number" bind:value={courts} />
		</div>

		<div class="m-2">
			<label class="block text-gray-700 text-sm font-bold mb-2" for="username"
				>Number of Pool Play Games:</label
			>
			<input class="bg-gray-200 p-2 rounded" type="number" bind:value={pools} />
		</div>
		<div class="m-2">
			<label class="block text-gray-700 text-sm font-bold mb-2" for="username">Date:</label>
			<input class="bg-gray-200 p-2 rounded" type="date" bind:value={date} />
		</div>

		<div class="">
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
					Update Tournament</button
				>
			{/if}
		</div>

		{#if data?.eventId !== 'create'}
			<h2>Matches:</h2>
			{#await matchesPromise}
				<Spinner color="blue" />
			{:then}
				{#if tournament.matches}
					{#each tournament.matches as match}
						<div class="w-1/2 m-1">
							<Table>
								<TableHead>
									<TableHeadCell>Round</TableHeadCell>
									<TableHeadCell>Court</TableHeadCell>
									<TableHeadCell>Home</TableHeadCell>
									<TableHeadCell>Away</TableHeadCell>
								</TableHead>
								<TableBody>
									<TableBodyRow>
										<TableBodyCell>tbd</TableBodyCell>
										<TableBodyCell>tbd</TableBodyCell>
										<TableBodyCell>{match.matches_team1_fkey.name}</TableBodyCell>
										<TableBodyCell>{match.matches_team2_fkey.name}</TableBodyCell>
									</TableBodyRow>
								</TableBody>
							</Table>
						</div>
					{/each}
				{/if}
			{/await}
		{/if}
	</form>
</div>
