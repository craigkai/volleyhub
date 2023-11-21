<script lang="ts">
	import { Spinner } from 'flowbite-svelte';
	import type { PageData } from '../$types';
	import type { Database } from '../../types/supabase';
	import { loadTournament } from '$lib/schedule';
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';

	export let data: PageData;
	let loadedEvent: Database.public.Tables.events;

	let schedule: any;
	let teams: string, courts: number, pools: number;
	function setSchedule() {
		const teamsArr = teams.split(',');
		schedule = loadTournament({
			teams: teamsArr,
			courts,
			pools
		});
		schedule.start();
		schedule.matches.forEach((element: { id: any }) => {
			schedule.enterResult(element.id, 2, 1);
		});
		schedule.next();
		console.log(schedule.matches);
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

					setSchedule();
				}
			});
	}
	let loadingEventPromise = loadEvent();
</script>

{#await loadingEventPromise}
	<Spinner color="blue" />
{:then}
	{#if loadedEvent}
		<h1>{schedule?.name}</h1>

		<div class="flex flex-col place-content-center place-items-center place-self-center">
			<div class="w-1/2 m-2">
				Teams:
				<input class="bg-gray-200 p-2 rounded" type="text" bind:value={teams} />
			</div>
			<div class="w-1/2 m-2">
				Numbr of Courts:
				<input class="bg-gray-200 p-2 rounded" type="number" bind:value={courts} />
			</div>

			<div class="w-1/2 m-2">
				Number of Pool Play Games:
				<input class="bg-gray-200 p-2 rounded" type="number" bind:value={pools} />
			</div>
			<div class="w-1/2 m-2">
				<button class="rounded bg-gray-400 p-4 hover:bg-gray-600" on:click={() => setSchedule()}
					>Generate Schedule</button
				>
			</div>
			<div class="w-1/2 m-2">
				{#if schedule}
					<Table>
						<TableHead>
							<TableHeadCell>Round</TableHeadCell>
							<TableHeadCell>Court</TableHeadCell>
							<TableHeadCell>Home</TableHeadCell>
							<TableHeadCell>Away</TableHeadCell>
						</TableHead>
						<TableBody>
							{#each schedule.matches as match}
								<TableBodyRow>
									<TableBodyCell>{match.round}</TableBodyCell>
									<TableBodyCell>1</TableBodyCell>
									<TableBodyCell
										>{schedule.players.find((player) => player.id === match.player1.id)
											?.name}</TableBodyCell
									>
									<TableBodyCell
										>{schedule.players.find((player) => player.id === match.player2.id)
											?.name}</TableBodyCell
									>
								</TableBodyRow>
							{/each}
						</TableBody>
					</Table>
				{/if}
			</div>
		</div>
	{:else}
		Invalid event id, is your link correct?
	{/if}
{/await}
