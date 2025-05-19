<script lang="ts">
	import { Button } from '$components/ui/button/index.js';
	import { goto } from '$app/navigation';
	import EventsCards from '$components/EventsCards.svelte';

	let { data } = $props();
	let events = data?.events;
</script>

<svelte:head>
	<title>Your events</title>
</svelte:head>

<div class="justify-center text-center">
	<div class="text-2xl">A place to see your tournaments you manage</div>

	{#if events && events.length > 0}
		<div class="cards-container">
			<EventsCards {events} />
		</div>
	{/if}

	<div class="button-container">
		<Button
			class="rounded m-2 cursor-pointer bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
			onclick={() => goto('/events/create')}>Create</Button
		>
	</div>
</div>
