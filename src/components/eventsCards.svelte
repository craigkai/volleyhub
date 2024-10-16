<script lang="ts">
	import * as Card from '$components/ui/card/index.js';
	import { getLocalTimeZone, parseDateTime } from '@internationalized/date';

	// Input prop
	let { events }: { events: Partial<EventRow>[] } = $props();

	// Pagination states
	let currentPage = $state(1);
	let itemsPerPage = 4; // Adjust this to the number of events you want to show per page

	// Calculate total pages
	let totalPages = $derived(Math.ceil(events?.length / itemsPerPage));

	// Get events for the current page
	let paginatedEvents = $derived(
		events?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	// Navigation handlers
	const nextPage = () => {
		if (currentPage < totalPages) currentPage++;
	};

	const prevPage = () => {
		if (currentPage > 1) currentPage--;
	};
</script>

<div class="flex flex-col items-center">
	{#if paginatedEvents && paginatedEvents.length > 0}
		<div class="m-2">
			{#each paginatedEvents as event}
				<a href="/events/{event.id}">
					<Card.Root class="m-2 w-[350px] dark:bg-slate-700">
						<Card.Header>
							<Card.Title>{event.name}</Card.Title>
							<Card.Description class="truncate">{event.description}</Card.Description>
						</Card.Header>
						<Card.Content>
							<form>
								<div class="grid w-full items-center gap-4">
									<div class="flex flex-col space-y-1.5">
										<span>
											{parseDateTime(event.date ?? '')
												.toDate(getLocalTimeZone())
												.toDateString()}
										</span>
									</div>
								</div>
							</form>
						</Card.Content>
					</Card.Root>
				</a>
			{/each}
		</div>

		<!-- Pagination Controls -->
		<div class="mt-4 flex items-center space-x-2">
			<button
				onclick={prevPage}
				disabled={currentPage === 1}
				class="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
			>
				Previous
			</button>
			<span>Page {currentPage} of {totalPages}</span>
			<button
				onclick={nextPage}
				disabled={currentPage === totalPages}
				class="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
			>
				Next
			</button>
		</div>
	{/if}
</div>
