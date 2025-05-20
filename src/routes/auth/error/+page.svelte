<script>
	import { Button } from '$components/ui/button';
	import { goto } from '$app/navigation';

	function goHome() {
		goto('/');
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-100 p-6 dark:bg-gray-900">
	<div class="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
		<h1 class="mb-2 text-2xl font-bold text-red-600 dark:text-red-400">Login Error</h1>
		<p class="mb-6 text-gray-700 dark:text-gray-300">
			Something went wrong with your login link. It may have expired or already been used.
		</p>
		<div class="flex justify-between gap-4">
			<Button onclick={() => goto('/auth')} class="w-full">Try Again</Button>
			<Button variant="outline" onclick={goHome} class="w-full">Go Home</Button>
		</div>
	</div>
</div>
