<script lang="ts">
	import '../app.css';
	import Header from '$components/Header.svelte';
	import Footer from '$components/Footer.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import toast, { Toaster } from 'svelte-5-french-toast';
	import { writable } from 'svelte/store';

	inject({
		mode: dev ? 'development' : 'production'
	});

	let { data = $bindable(), children } = $props();

	let { session, supabase, isMobile, user, is_admin, approved } = $derived(data);

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

	export const navigating = writable(false);

	onMount(() => {
		beforeNavigate(() => navigating.set(true));
		afterNavigate(() => navigating.set(false));
	});
</script>

<svelte:window onerror={handleError} />

<svelte:head>
	<title>VolleyHub</title>
</svelte:head>

{#if $navigating}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="flex flex-col items-center space-y-4">
			<div
				class="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"
			></div>
			<p class="font-medium text-white">Loading...</p>
		</div>
	</div>
{/if}

<div
	class="flex min-h-screen flex-col overflow-x-hidden overflow-y-hidden bg-white text-gray-900 dark:bg-slate-800 dark:text-white"
>
	<ModeWatcher defaultMode="light" track={false} />
	<Toaster position="top-right" />
	<Header {isMobile} {user} {is_admin} {approved} />

	<div class="flex-grow">
		<div class="mx-auto max-w-7xl p-4">
			{@render children()}
		</div>
	</div>

	<Footer />
</div>
