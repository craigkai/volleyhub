<script lang="ts">
	import type { PageData } from './$types';
	import Schedule from '$lib/components/Schedule.svelte';
	import Standings from '$lib/components/Standings.svelte';

	export let data: PageData;
	let items = [
		{
			value: 'Schedule',
			component: Schedule
		},
		{
			value: 'Standings',
			component: Standings
		}
	];
	let activeTabValue = 'Schedule';
	let league = data.league;
</script>

<div class="flex w-full justify-center">
	<span class="p-2"> League: </span>
	<select class="p-2 rounded" bind:value={league}>
		<option value="IV Stallions">IV Stallions</option>
		<option value="Holidays">Holdiays</option>
	</select>
</div>

<div class="flex w-full justify-center">
	<span
		role="button"
		class="p-2 bg-blue-200 m-2 rounded hover:bg-blue-100"
		class:bg-blue-400={activeTabValue == 'Schedule'}
		tabindex={1}
		on:keydown={() => (activeTabValue = 'Schedule')}
		on:click={() => (activeTabValue = 'Schedule')}>Schedule</span
	>
	<span
		role="button"
		class="p-2 m-2 bg-blue-200 rounded hover:bg-blue-100"
		class:bg-blue-400={activeTabValue == 'Standings'}
		tabindex={2}
		on:keydown={() => (activeTabValue = 'Standings')}
		on:click={() => (activeTabValue = 'Standings')}>Standings</span
	>
</div>

<div class="flex justify-center">
	{#each items as item}
		{#if activeTabValue == item.value}
			<div class="box">
				<svelte:component this={item.component} {data} {league} />
			</div>
		{/if}
	{/each}
</div>
