<script lang="ts">
	import { Spinner } from 'flowbite-svelte';
	import type { PageData } from '$types';
	import { Tournament } from '$lib/tournament';
	import Edit from '$lib/components/tournament/Edit.svelte';
	import type { HttpError } from '@sveltejs/kit';
	import { error } from '$lib/toast';
	import dayjs from 'dayjs';

	export let data: PageData;

	let tournament: Tournament = new Tournament(data?.supabase);
	let teams: TeamRow[], courts: number, pools: number, name: string, date: string;

	// Load our event or if creating we just load the edit component
	async function loadEvent() {
		if (data?.eventId != 'create') {
			return await tournament
				.loadEvent(data?.eventId)
				.then(() => {
					teams = tournament?.settings.teams as unknown as Tournament[];
					courts = tournament?.settings.courts as number;
					pools = tournament?.settings.pools as number;
					name = tournament?.settings.name as string;
					date = dayjs(tournament?.settings.date).format('YYYY-MM-DD');
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
{/await}
