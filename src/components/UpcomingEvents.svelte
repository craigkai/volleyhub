<script lang="ts">
	import { EventSupabaseDatabaseService } from '$lib/database/event';
	import { AlertCircle, Loader, Calendar } from 'lucide-svelte';
	import EventsCards from '$components/EventsCards.svelte';

	let { data } = $props();

	const eventsDatabaseService = new EventSupabaseDatabaseService(data?.supabase);
	const eventsPromise = eventsDatabaseService.getUpcomingEvents();
</script>

<svelte:head>
	<title>Upcoming events</title>
</svelte:head>

<section class="container mx-auto px-3 py-6 sm:px-4 sm:py-8 lg:py-12">
	<div class="mb-6 text-center sm:mb-8">
		<h2 class="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
			<span class="flex flex-col items-center gap-2 sm:inline-flex sm:flex-row">
				<Calendar class="h-6 w-6 text-emerald-500 sm:h-7 sm:w-7 md:h-8 md:w-8" />
				<span>Upcoming Events</span>
			</span>
		</h2>
		<p class="text-muted-foreground mt-2 text-sm sm:text-base">
			Discover and join our upcoming community events
		</p>
	</div>

	{#await eventsPromise}
		<div
			class="border-border bg-card text-card-foreground flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-lg border p-6 shadow-sm sm:min-h-[200px] sm:gap-4 sm:p-8"
		>
			<Loader class="h-8 w-8 animate-spin text-emerald-500 sm:h-10 sm:w-10" />
			<p class="text-muted-foreground text-sm sm:text-base">Loading events...</p>
		</div>
	{:then events}
		{#if events && events.length > 0}
			<div class="mx-auto max-w-4xl transition-all duration-300 ease-in-out">
				<div class="rounded-lg p-3 shadow-lg sm:rounded-xl sm:p-4 lg:p-6 dark:bg-gray-800/90">
					<EventsCards {events} />
				</div>
			</div>
		{:else}
			<div
				class="border-border bg-card text-card-foreground flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-lg border p-6 shadow-sm sm:min-h-[200px] sm:gap-4 sm:p-8"
			>
				<div class="bg-muted rounded-full p-2 sm:p-3">
					<Calendar class="text-muted-foreground h-5 w-5 sm:h-6 sm:w-6" />
				</div>
				<div class="text-center">
					<h3 class="text-base font-medium sm:text-lg">No upcoming events</h3>
					<p class="text-muted-foreground mt-1 text-xs sm:text-sm">
						Check back later for new events.
					</p>
				</div>
			</div>
		{/if}
	{:catch error}
		<div
			class="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 p-6 text-red-900 sm:min-h-[200px] sm:gap-4 sm:p-8 dark:border-red-900/20 dark:bg-red-900/10 dark:text-red-400"
		>
			<div class="rounded-full bg-red-100 p-2 sm:p-3 dark:bg-red-900/20">
				<AlertCircle class="h-5 w-5 sm:h-6 sm:w-6" />
			</div>
			<div class="text-center">
				<h3 class="text-base font-medium sm:text-lg">Error loading events</h3>
				<p class="mt-1 text-xs sm:text-sm">{error.message}</p>
			</div>
		</div>
	{/await}
</section>
