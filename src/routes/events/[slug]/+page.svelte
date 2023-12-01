<script lang="ts">
	import { Spinner } from 'flowbite-svelte';
	import type { PageData } from '../$types';
	import { Tournament } from '$lib/tournament';
	import View from '$lib/components/tournament/View.svelte';
	import { error } from '$lib/toast';
	import type { HttpError } from '@sveltejs/kit';
	export let data: PageData;

	let tournament: Tournament = new Tournament(data?.supabase);
	// Load our event or if creating we just load the edit component
	async function loadEvent() {
		return await tournament
			.loadTournament(data?.eventId, data?.eventName)
			.catch((err: HttpError) => error(err.body.message));
	}

	let loadingEventPromise = loadEvent();
</script>

{#await loadingEventPromise}
	<Spinner color="blue" />
{:then}
	{#if tournament?.matches}
		<h1>Tournament name: {tournament?.name}</h1>

		<div class="w-1/2 m-2">
			<View {tournament} />
		</div>
	{:else}
		Is your link correct? We are having a hard time loading this tournament
	{/if}
{/await}
