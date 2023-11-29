<script lang="ts">
	import { Spinner } from 'flowbite-svelte';
	import type { PageData } from '$types';
	import { Tournament } from '$lib/tournament';
	import Edit from '$lib/components/tournament/Edit.svelte';
	import View from '$lib/components/tournament/View.svelte';
	import type { HttpError } from '@sveltejs/kit';
	import { error } from '$lib/toast';

	export let data: PageData;

	let tournament: Tournament = new Tournament(data?.supabase);
	let teams: string, courts: number, pools: number;

	// Load our event or if creating we just load the edit component
	async function loadEvent() {
		if (data?.eventName != 'create') {
			return await tournament
				.loadTournament(data?.eventId, data?.eventName)
				.catch((err: HttpError) => error(err.body.message));
		}
	}
	let loadingEventPromise = loadEvent();
</script>

{#await loadingEventPromise}
	<Spinner color="blue" />
{:then}
	<Edit bind:tournament bind:data bind:teams bind:courts bind:pools />

	{#if tournament?.status && tournament.status !== 'steup'}
		<View bind:tournament />
	{/if}
{/await}
