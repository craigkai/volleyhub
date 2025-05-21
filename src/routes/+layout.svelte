<script lang="ts">
	import '../app.css';
	import Header from '$components/Header.svelte';
	import Footer from '$components/Footer.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import toast, { Toaster } from 'svelte-5-french-toast';

	inject({
		mode: dev ? 'development' : 'production'
	});

	let { data = $bindable(), children } = $props();

	let { session, supabase, isMobile, user } = $derived(data);

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => data.subscription.unsubscribe();
	});

	function handleError(event: ErrorEvent) {
		toast.error(event.message);
	}
</script>

<svelte:window onerror={handleError} />

<svelte:head>
	<title>VolleyHub</title>
</svelte:head>

<div
	class="flex min-h-screen flex-col overflow-x-hidden bg-white text-gray-900 dark:bg-slate-800 dark:text-white"
>
	<ModeWatcher defaultMode="light" track={false} />
	<Toaster position="top-right" />
	<Header {isMobile} {user} />

	<div class="mb-8 flex-grow">
		<div class="mx-auto max-w-7xl p-4">
			{@render children()}
		</div>
	</div>

	<Footer />
</div>
