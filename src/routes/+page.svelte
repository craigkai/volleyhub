<script lang="ts">
	import { EventSupabaseDatabaseService } from '$lib/database/event.svelte';
	import { Loader } from 'lucide-svelte';
	import EventsCards from '$components/eventsCards.svelte';

	export let data: PageData;

	const eventsDatabaseService = new EventSupabaseDatabaseService(data?.supabase);
	const eventsPromise = eventsDatabaseService.getEvents();
</script>

{#await eventsPromise}
	<div class="h-screen flex flex-col items-center place-content-center">
		<Loader class="animate-spin" />
	</div>
{:then events}
	<div class="flex flex-col items-center">
		<div>Upcoming events:</div>
		<EventsCards {events} readOnly={true} />
	</div>
{/await}
