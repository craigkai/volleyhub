<script lang="ts">
	import { SupabaseDatabaseService } from '$lib/supabaseDatabaseService';
	import { Card, Spinner } from 'flowbite-svelte';
	import dayjs from 'dayjs';

	export let data: PageData;

	const databaseService = new SupabaseDatabaseService(data?.supabase);
	const eventsPromise = databaseService.getEvents();
</script>

<div class="flex flex-col items-center">
	{#await eventsPromise}
		<Spinner />
	{:then events}
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
	{/await}
</div>
