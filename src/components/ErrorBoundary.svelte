<script lang="ts">
	import * as Alert from '$components/ui/alert/index.js';
	import { Button } from '$components/ui/button';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';

	let { children, fallback } = $props();

	let hasError = $state(false);
	let error = $state<Error | null>(null);

	function handleError(event: ErrorEvent) {
		hasError = true;
		error = new Error(event.message);
		console.error('Error caught by boundary:', event.error);
	}

	function retry() {
		hasError = false;
		error = null;
		// Force component re-render
		window.location.reload();
	}

	if (typeof window !== 'undefined') {
		window.addEventListener('error', handleError);
	}
</script>

{#if hasError}
	{#if fallback}
		{@render fallback(error, retry)}
	{:else}
		<Alert.Root
			class="border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200"
		>
			<AlertCircle class="h-4 w-4" />
			<Alert.Title>Something went wrong</Alert.Title>
			<Alert.Description class="mt-2">
				<p class="mb-3">An unexpected error occurred. Please try refreshing the page.</p>
				{#if error}
					<details class="mb-3">
						<summary class="cursor-pointer text-sm font-medium">Error details</summary>
						<pre class="mt-2 text-xs text-red-700 dark:text-red-300">{error.message}</pre>
					</details>
				{/if}
				<Button onclick={retry} variant="outline" size="sm" class="gap-2">
					<RefreshCw class="h-3 w-3" />
					Try again
				</Button>
			</Alert.Description>
		</Alert.Root>
	{/if}
{:else}
	{@render children()}
{/if}
