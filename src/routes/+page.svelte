<script lang="ts">
	import { EventSupabaseDatabaseService } from '$lib/database/event.svelte';
	import { Loader } from 'lucide-svelte';
	import EventsCards from '$components/eventsCards.svelte';

	export let data: PageData;

	const eventsDatabaseService = new EventSupabaseDatabaseService(data?.supabase);
	const eventsPromise = eventsDatabaseService.getEvents();
</script>

{#await eventsPromise}
	<div class="flex items-center justify-center">
		<Loader class="animate-spin" />
	</div>
{:then events}
	{#if events && events.length > 0}
		<div class="p-8 bg-gray-100 dark:bg-gray-600 rounded-lg shadow-lg max-w-3xl mx-auto my-8">
			<div class="text-center text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
				Upcoming Events
			</div>
			<EventsCards {events} readOnly={true} />
		</div>
	{:else}
		<div class="flex justify-center">
			<p>No events available.</p>
		</div>
	{/if}
{:catch error}
	<div class="flex justify-center">
		<p>Error loading events: {error.message}</p>
	</div>
{/await}
