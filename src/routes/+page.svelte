<script lang="ts">
	import { EventSupabaseDatabaseService } from '$lib/database/event';
	import { AlertCircle, Loader, Calendar } from 'lucide-svelte';
	import EventsCards from '$components/EventsCards.svelte';

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

<section class="container mx-auto px-4 py-12">
	<div class="mb-8 text-center">
		<h2 class="text-3xl font-bold tracking-tight md:text-4xl">
			<span class="inline-flex items-center gap-2">
				<Calendar class="h-8 w-8 text-emerald-500" />
				Upcoming Events
			</span>
		</h2>
		<p class="text-muted-foreground mt-2">Discover and join our upcoming community events</p>
	</div>

	{#await eventsPromise}
		<div
			class="border-border bg-card text-card-foreground flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border p-8 shadow-sm"
		>
			<Loader class="h-10 w-10 animate-spin text-emerald-500" />
			<p class="text-muted-foreground">Loading events...</p>
		</div>
	{:then events}
		{#if events && events.length > 0}
			<div class="mx-auto max-w-4xl transition-all duration-300 ease-in-out">
				<div class="bg-card ring-border/5 rounded-xl p-6 shadow-lg ring-1 dark:bg-gray-800/90">
					<EventsCards {events} />
				</div>
			</div>
		{:else}
			<div
				class="border-border bg-card text-card-foreground flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border p-8 shadow-sm"
			>
				<div class="bg-muted rounded-full p-3">
					<Calendar class="text-muted-foreground h-6 w-6" />
				</div>
				<div class="text-center">
					<h3 class="text-lg font-medium">No upcoming events</h3>
					<p class="text-muted-foreground mt-1 text-sm">Check back later for new events.</p>
				</div>
			</div>
		{/if}
	{:catch error}
		<div
			class="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 p-8 text-red-900 dark:border-red-900/20 dark:bg-red-900/10 dark:text-red-400"
		>
			<div class="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
				<AlertCircle class="h-6 w-6" />
			</div>
			<div class="text-center">
				<h3 class="text-lg font-medium">Error loading events</h3>
				<p class="mt-1 text-sm">{error.message}</p>
			</div>
		</div>
	{/await}
</section>
