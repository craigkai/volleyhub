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
	let teams: string[], courts: number, pools: number, name: string, date: string;

	// Load our event or if creating we just load the edit component
	async function loadEvent() {
		if (data?.eventName != 'create') {
			return await tournament
				.loadTournament(data?.eventId)
				.then(() => {
					teams = tournament.teams;
					courts = tournament.courts;
					pools = tournament.pools;
					name = tournament.name;
					date = tournament.date;
				})
				.catch((err: HttpError) => error(err.body.message));
		}
	}
	let loadingEventPromise = loadEvent();
</script>

{#await loadingEventPromise}
	<Spinner color="blue" />
{:then}
	<Edit bind:tournament bind:name bind:data bind:date bind:teams bind:courts bind:pools />

	{#if tournament?.status && tournament.status !== 'steup'}
		<View bind:tournament />
	{/if}
{/await}
