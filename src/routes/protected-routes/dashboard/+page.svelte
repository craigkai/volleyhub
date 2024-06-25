<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$components/ui/button/index.js';
	import { goto } from '$app/navigation';
	import EventsCards from '$components/eventsCards.svelte';

	export let data: PageData;
	const events = data?.events;
</script>

<div class="page-container">
	<div class="header">A place to see your tournaments you manage</div>

	{#if events && events.length > 0}
		<div class="cards-container">
			<EventsCards {events} readOnly={false} />
		</div>
	{/if}

	<div class="button-container">
		<Button on:click={() => goto('/protected-routes/events/create')}>Create</Button>
	</div>
</div>

<style>
	.page-container {
		padding: 2rem;
		max-width: 800px;
		margin: auto;
		text-align: center;
	}

	.header {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1.5rem;
	}

	.cards-container {
		width: 100%;
		margin-bottom: 2rem;
	}

	.button-container {
		display: flex;
		justify-content: center;
	}
</style>
