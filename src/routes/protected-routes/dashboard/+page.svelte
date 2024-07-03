<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$components/ui/button/index.js';
	import { goto } from '$app/navigation';
	import EventsCards from '$components/eventsCards.svelte';

	export let data: PageData;
	const events = data?.events;
</script>

<div class="justify-center text-center">
	<div class="text-2xl">A place to see your tournaments you manage</div>

	{#if events && events.length > 0}
		<div class="cards-container">
			<EventsCards {events} readOnly={false} />
		</div>
	{/if}

	<div class="button-container">
		<Button on:click={() => goto('/protected-routes/events/create')}>Create</Button>
	</div>
</div>
