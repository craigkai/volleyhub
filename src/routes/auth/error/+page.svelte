<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$components/ui/button';
	import { AlertCircle } from 'lucide-svelte';

	let { data } = $props();
	const { errorCode, errorDescription } = data;

	function retryLogin() {
		goto('/auth');
	}
</script>

<div class="flex h-screen justify-center bg-gray-50 p-6 dark:bg-gray-900">
	<div class="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-800">
		<div class="flex items-center gap-4 bg-red-50 p-5 dark:bg-red-900/10">
			<div
				class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
			>
				<AlertCircle size={24} />
			</div>
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Authentication Error</h1>
		</div>

		<div class="p-6">
			<div
				class="mb-6 rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/10"
			>
				<p class="font-medium text-red-800 dark:text-red-400">Error Code: {errorCode}</p>
				<p class="mt-2 text-gray-700 dark:text-gray-300">{errorDescription}</p>
			</div>

			<p class="mb-6 text-gray-600 dark:text-gray-400">
				Please try logging in again or contact support if this issue persists.
			</p>

			<div class="space-y-3">
				<Button
					onclick={retryLogin}
					class="w-full bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
				>
					Try Again
				</Button>
				<Button
					variant="outline"
					onclick={() => goto('/')}
					class="w-full border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					Go Home
				</Button>
			</div>
		</div>
	</div>
</div>
