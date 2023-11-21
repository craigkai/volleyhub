<script lang="ts">
	import { Spinner } from 'flowbite-svelte';
	import type { PageData } from '$types';
	import { loadTournament, createTournament } from '$lib/schedule';
	import Edit from '$lib/components/tournament/Edit.svelte';
	import View from '$lib/components/tournament/View.svelte';
	import type { HttpError } from '@sveltejs/kit';
	import { error } from '$lib/toast';

	export let data: PageData;

	let schedule: any = {};
	let teams: string, courts: number, pools: number;

	// Load our event or if creating we just load the edit component
	async function loadEvent() {
		if (data?.eventName != 'create') {
			return await loadTournament(data?.supabase, data?.eventId, data?.eventName)
				.then((res) => (schedule = res))
				.catch((err: HttpError) => error(err.body.message));
		}
	}
	let loadingEventPromise = loadEvent();
</script>

{#await loadingEventPromise}
	<Spinner color="blue" />
{:then}
	<Edit bind:schedule bind:data bind:teams bind:courts bind:pools setSchedule={createTournament} />

	{#if schedule?.status && schedule.status !== 'steup'}
		<View bind:schedule />
	{/if}
{/await}
