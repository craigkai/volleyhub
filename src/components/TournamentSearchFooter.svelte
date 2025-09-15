<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$components/ui/button';
	import SearchIcon from 'lucide-svelte/icons/search';
	import { onMount } from 'svelte';

	let searchValue = $state('');
	let showSearch = $state(false);
	let inputElement: HTMLInputElement;

	function handleSearch() {
		if (!searchValue.trim()) return;

		// Clean the input to handle various formats
		let eventId = searchValue.trim();

		// Remove common URL parts if user pasted a full URL
		if (eventId.includes('/events/')) {
			eventId = eventId.split('/events/')[1].split(/[/?#]/)[0];
		}

		// Navigate to the event
		goto(`/events/${eventId}`);

		// Reset
		searchValue = '';
		showSearch = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleSearch();
		} else if (e.key === 'Escape') {
			searchValue = '';
			showSearch = false;
		}
	}

	function toggleSearch() {
		showSearch = !showSearch;
		if (showSearch && inputElement) {
			setTimeout(() => inputElement.focus(), 100);
		}
	}

	// Hide search on click outside
	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (showSearch && !target.closest('.tournament-search-container')) {
			showSearch = false;
			searchValue = '';
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});
</script>

<div class="tournament-search-footer fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/95">
	<div class="tournament-search-container mx-auto max-w-4xl px-4 py-2">
		{#if showSearch}
			<!-- Expanded Search -->
			<div class="flex items-center gap-2">
				<div class="flex-1 relative">
					<input
						bind:this={inputElement}
						bind:value={searchValue}
						onkeydown={handleKeydown}
						type="text"
						placeholder="Enter tournament ID or URL..."
						class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-emerald-500"
					/>
					<SearchIcon class="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
				</div>
				<Button
					size="sm"
					onclick={handleSearch}
					disabled={!searchValue.trim()}
					class="bg-emerald-600 hover:bg-emerald-700"
				>
					Go
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onclick={() => { showSearch = false; searchValue = ''; }}
					class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
				>
					Cancel
				</Button>
			</div>
		{:else}
			<!-- Collapsed Search -->
			<div class="flex items-center justify-center">
				<button
					onclick={toggleSearch}
					class="group flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-600 transition-all duration-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
				>
					<SearchIcon class="h-3 w-3" />
					<span class="hidden sm:inline">Find tournament by ID</span>
					<span class="sm:hidden">Find tournament</span>
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.tournament-search-footer {
		/* Ensure it appears above most content but below modals */
		z-index: 40;
	}

	/* Add padding to body when footer is present */
	:global(body) {
		padding-bottom: 3rem;
	}

	@media (max-width: 640px) {
		:global(body) {
			padding-bottom: 2.5rem;
		}
	}
</style>