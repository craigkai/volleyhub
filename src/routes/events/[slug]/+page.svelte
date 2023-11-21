<script lang="ts">
	import { Spinner } from 'flowbite-svelte';
	import type { PageData } from '../$types';
	import type { Database } from '../../types/supabase';
	import { loadTournament } from '$lib/schedule';
	import Edit from '$lib/components/tournament/Edit.svelte';
	import Schedule from '$lib/components/tournament/Schedule.svelte';

	export let data: PageData;
	let loadedEvent: Database.public.Tables.events;

	let schedule: any = {};
	let teams: string, courts: number, pools: number;
	function setSchedule() {
		const teamsArr = teams.split(',');
		schedule = loadTournament({
			teams: teamsArr,
			courts,
			pools
		});
	}

	async function loadEvent() {
		if (data?.event_name === 'create') {
			loadedEvent = {
				teams: [],
				courts: 2,
				pools: 2
			};
			teams = 'team0,team1,team2,team4';
			courts = 2;
			pools = 2;
			schedule.status = 'setup';
			return;
		}

		data.supabase
			.from('events')
			.select('*')
			.or(`id.eq.${data?.event_id},name.eq.${data?.event_name}`)
			.single()
			.then(({ data: event }) => {
				loadedEvent = event;

				if ((loadedEvent?.teams, loadedEvent?.courts, loadedEvent?.pools)) {
					teams = loadedEvent?.teams.join(',');
					courts = loadedEvent?.courts;
					pools = loadedEvent?.pools;

					schedule = loadTournament(loadedEvent);
				}
			});
	}

	let loadingEventPromise = loadEvent();

	const steps = {
		setup: Edit,
		'stage-one': Schedule
	};
</script>

{#await loadingEventPromise}
	<Spinner color="blue" />
{:then}
	{#if loadedEvent}
		<h1>{schedule?.name}</h1>

		<div class="w-1/2 m-2">
			<svelte:component
				this={steps[schedule.status]}
				{schedule}
				{teams}
				{courts}
				{pools}
				{setSchedule}
			/>
		</div>
	{:else}
		Invalid event id, is your link correct?
	{/if}
{/await}
