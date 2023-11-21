<script lang="ts">
	import { Spinner } from 'flowbite-svelte';
	import type { PageData } from '../$types';
	import { loadTournament } from '$lib/schedule';
	import View from '$lib/components/tournament/View.svelte';
	import { error } from '$lib/toast';
	import type { HttpError } from '@sveltejs/kit';
	export let data: PageData;

	let schedule: any = {};
	// Load our event or if creating we just load the edit component
	async function loadEvent() {
		return await loadTournament(data?.supabase, data?.eventId, data?.eventName)
			.then((res) => (schedule = res))
			.catch((err: HttpError) => error(err.body.message));
	}

	let loadingEventPromise = loadEvent();
</script>

{#await loadingEventPromise}
	<Spinner color="blue" />
{:then}
	{#if schedule?.matches}
		<h1>Tournament name: {schedule?.name}</h1>

		<div class="w-1/2 m-2">
			<View {schedule} />
		</div>
	{:else}
		Is your link correct? We are having a hard time loading this tournament
	{/if}
{/await}
