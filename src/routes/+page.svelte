<script lang="ts">
	import { EventSupabaseDatabaseService } from '$lib/database/event.svelte';
	import { Loader } from 'lucide-svelte';
	import EventsCards from '$components/eventsCards.svelte';

	export let data: PageData;

	const eventsDatabaseService = new EventSupabaseDatabaseService(data?.supabase);
	const eventsPromise = eventsDatabaseService.getEvents();
</script>

{#await eventsPromise}
	<div class="loader-container">
		<Loader class="animate-spin" />
	</div>
{:then events}
	<div class="events-container">
		<div class="header">Upcoming Events</div>
		<EventsCards {events} readOnly={true} />
	</div>
{/await}

<style>
	.loader-container {
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.events-container {
		padding: 2rem;
		background-color: #f9fafb;
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		max-width: 800px;
		margin: 2rem auto;
	}

	.header {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: #1f2937;
	}
</style>
