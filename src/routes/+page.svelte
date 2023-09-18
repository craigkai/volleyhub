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

<div class="flex justify-center">
	League:

	<select bind:value={league}>
		<option value="IV Stallions">IV Stallions</option>
		<option value="Holidays">Holdiays</option>
	</select>

	<div class="w-1/2">
		<div class="flex flex-row">
			<span
				role="button"
				class="p-2 bg-blue-200 m-2 rounded hover:bg-blue-100"
				class:active={activeTabValue == 'Schedule'}
				tabindex={1}
				on:keydown={() => (activeTabValue = 'Schedule')}
				on:click={() => (activeTabValue = 'Schedule')}>Schedule</span
			>
			<span
				role="button"
				class="p-2 m-2 bg-blue-200 rounded active:bg-red-300 hover:bg-blue-100"
				class:active={activeTabValue == 'Standings'}
				tabindex={2}
				on:keydown={() => (activeTabValue = 'Standings')}
				on:click={() => (activeTabValue = 'Standings')}>Standings</span
			>
		</div>
		{#each items as item}
			{#if activeTabValue == item.value}
				<div class="box">
					<svelte:component this={item.component} {data} {league} />
				</div>
			{/if}
		{/each}
	</div>
</div>

<style>
	.active {
		background-color: #ff3e00;
		color: white;
	}
</style>
