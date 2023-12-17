<script lang="ts">
	import { Spinner } from 'flowbite-svelte';
	import type { PageData } from '$types';
	import { Tournament } from '$lib/tournament';
	import Matches from '$lib/components/tournament/Matches.svelte';
	import type { HttpError } from '@sveltejs/kit';
	import { error } from '$lib/toast';
	import { SupabaseDatabaseService } from '$lib/SupabaseDatabaseService';

	export let data: PageData;
	const databaseService = new SupabaseDatabaseService(data?.supabase);
	let tournament = new Tournament(databaseService, data?.supabase);

	// Load our event or if creating we just load the edit component
	async function loadEvent() {
		if (data?.eventId != 'create') {
			await tournament
				.loadEvent(data?.eventId)
				.catch((err: HttpError) => error(err?.body?.message));
		}
	}

	let loadingEventPromise = loadEvent();
</script>

{#await loadingEventPromise}
	<div class="flex justify-center m-4">
		<Spinner color="blue" />
	</div>
{:then}
	<div class="flex flex-col items-center">
		<div class="dark:bg-nord-2 m-2 shadow-md rounded flex flex-col items-center lg:w-1/2 sm:w-full">
			<Matches {tournament} readOnly={true} />
		</div>
	</div>
{/await}
