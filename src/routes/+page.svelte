<script lang="ts">
	import { EventSupabaseDatabaseService } from '$lib/database/event';
	import { Loader } from 'lucide-svelte';
	import EventsCards from '$components/eventsCards.svelte';

	interface Props {
		data: any;
	}

	let { data }: Props = $props();

	const eventsDatabaseService = new EventSupabaseDatabaseService(data?.supabase);
	const eventsPromise = eventsDatabaseService.getUpcomingEvents();
</script>

<svelte:head>
	<title>Upcoming events</title>
</svelte:head>

{#await eventsPromise}
	<div class="flex items-center justify-center">
		<Loader class="animate-spin" />
	</div>
{:then events}
	{#if events && events.length > 0}
		<div class="mx-auto my-8 max-w-3xl rounded-lg bg-gray-100 p-8 shadow-lg dark:bg-gray-600">
			<div class="mb-4 text-center text-xl font-semibold text-gray-900 dark:text-gray-100">
				Upcoming Events
			</div>
			<EventsCards {events} />
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
