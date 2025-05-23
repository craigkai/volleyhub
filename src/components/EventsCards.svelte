<script lang="ts">
	import * as Card from '$components/ui/card/index.js';
	import { getLocalTimeZone, parseDateTime } from '@internationalized/date';
	import CalendarIcon from 'lucide-svelte/icons/calendar';
	import MapPinIcon from 'lucide-svelte/icons/map-pin';
	import ChevronLeftIcon from 'lucide-svelte/icons/chevron-left';
	import ChevronRightIcon from 'lucide-svelte/icons/chevron-right';
	import ClipboardListIcon from 'lucide-svelte/icons/clipboard-list';
	import Button from '$components/ui/button/button.svelte';

	let { events } = $props();

	let currentPage = $state(1);
	let itemsPerPage = 4;

	let totalPages = $derived(Math.ceil((events?.length || 0) / itemsPerPage));

	let paginatedEvents = $derived(
		events?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || []
	);

	const nextPage = () => {
		if (currentPage < totalPages) currentPage++;
	};

	const prevPage = () => {
		if (currentPage > 1) currentPage--;
	};

	function formatDate(dateString: string | undefined): string {
		if (!dateString) return 'Date not set';

		const date = parseDateTime(dateString).toDate(getLocalTimeZone());
		const options: Intl.DateTimeFormatOptions = {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		};

		return date.toLocaleDateString('en-US', options);
	}
</script>

<div class="mx-auto max-w-4xl space-y-6 px-4">
	{#if paginatedEvents && paginatedEvents.length > 0}
		<div class="flex flex-col items-center gap-6">
			{#each paginatedEvents as event}
				<a
					href="/events/{event.id}"
					class="block transform transition duration-200 hover:scale-[1.02] hover:no-underline focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
				>
					<Card.Root
						class="h-full overflow-hidden border-gray-200 bg-white shadow-md transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
					>
						<div
							class="relative flex h-40 w-full items-center justify-center overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600"
						>
							<div class="absolute inset-0 opacity-10">
								<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
									<defs>
										<pattern id="pattern" width="40" height="40" patternUnits="userSpaceOnUse">
											<path
												d="M0 20 L40 20 M20 0 L20 40"
												stroke="white"
												stroke-width="1"
												fill="none"
											/>
										</pattern>
									</defs>
									<rect width="100%" height="100%" fill="url(#pattern)" />
								</svg>
							</div>

							<span class="relative z-10 text-5xl font-bold text-white drop-shadow-md">
								{event.name?.charAt(0).toUpperCase() || '?'}
							</span>
						</div>

						<Card.Header class="p-4 pb-2">
							<Card.Title class="line-clamp-1 text-lg font-bold text-gray-800 dark:text-white">
								{event.name || 'Untitled Event'}
							</Card.Title>
							<Card.Description class="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
								{event.description || 'No description available'}
							</Card.Description>
						</Card.Header>

						<Card.Content class="p-4 pt-2">
							<div class="flex flex-col space-y-2">
								<div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
									<CalendarIcon class="h-4 w-4" />
									<span>{formatDate(event.date)}</span>
								</div>

								{#if event.location}
									<div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
										<MapPinIcon class="h-4 w-4" />
										<span class="line-clamp-1">{event.location}</span>
									</div>
								{/if}
							</div>
						</Card.Content>

						<div class="border-t border-gray-100 p-4 dark:border-gray-700">
							<div class="flex items-center justify-between">
								<span class="text-sm font-medium text-emerald-600 dark:text-emerald-400"
									>View details →</span
								>
							</div>
						</div>
					</Card.Root>
				</a>
			{/each}
		</div>

		{#if totalPages > 1}
			<div class="mt-8 flex items-center justify-center space-x-2">
				<Button
					onclick={prevPage}
					disabled={currentPage === 1}
					class="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
					aria-label="Previous page"
				>
					<ChevronLeftIcon class="h-4 w-4" />
					<span class="ml-1">Previous</span>
				</Button>

				<div class="text-sm text-gray-600 dark:text-gray-400">
					<span class="font-medium text-gray-900 dark:text-white">{currentPage}</span> of
					<span>{totalPages}</span>
				</div>

				<Button
					onclick={nextPage}
					disabled={currentPage === totalPages}
					class="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
					aria-label="Next page"
				>
					<span class="mr-1">Next</span>
					<ChevronRightIcon class="h-4 w-4" />
				</Button>
			</div>
		{/if}
	{:else}
		<div
			class="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-12 text-center dark:border-gray-700 dark:bg-gray-800/50"
		>
			<ClipboardListIcon class="mb-3 h-12 w-12 text-gray-400" />
			<h3 class="mb-1 text-lg font-medium text-gray-900 dark:text-gray-200">No events found</h3>
			<p class="max-w-sm text-sm text-gray-500 dark:text-gray-400">
				There are no upcoming events scheduled at this time. Check back later for updates.
			</p>
		</div>
	{/if}
</div>
