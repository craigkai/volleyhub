<script lang="ts">
	import { EventSupabaseDatabaseService } from '$lib/database/event';
	import { Card, Spinner } from 'flowbite-svelte';
	import dayjs from 'dayjs';

	export let data: PageData;

	const eventsDatabaseService = new EventSupabaseDatabaseService(data?.supabase);
	const eventsPromise = eventsDatabaseService.getEvents();
</script>

{#await eventsPromise}
	<div class="h-screen flex flex-col items-center place-content-center">
		<Spinner />
	</div>
{:then events}
	<div class="flex flex-col items-center place-content-center">
		<div>Upcoming events:</div>
		{#each events as event}
			<Card class="m-2" href="/events/{event.id}">
				<h5 class="mb-2 text-2xl font-bold tracking-tight">
					{event.name}
				</h5>
				<h4 class="mb-2 text-xl font-bold tracking-tight">
					{dayjs(event.date).format('YYYY-MM-DD')}
				</h4>
			</Card>
		{/each}
	</div>
{/await}
