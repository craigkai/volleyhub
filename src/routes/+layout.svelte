<script lang="ts">
	import '../app.postcss';
	import Header from '$components/Header.svelte';
	import Footer from '$components/Footer.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';
	import { goto, invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import toast, { Toaster } from 'svelte-french-toast';

	inject({
		mode: dev ? 'development' : 'production'
	});

	let { data = $bindable(), children } = $props();

	let { session, supabase, isMobile } = data;

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
			if (!newSession && event !== 'INITIAL_SESSION') {
				/**
				 * Queue this as a task so the navigation won't prevent the
				 * triggering function from completing
				 */
				setTimeout(() => {
					goto('/', {
						invalidateAll: true
					});
				});
			}

			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => data.subscription.unsubscribe();
	});

	function handleError(err: string) {
		toast.error(err);
	}
</script>

<svelte:window on:error={handleError} />

<svelte:head>
	<title>VolleyHub</title>
</svelte:head>

<div
	class="dark:bg-slate-800 flex min-h-screen flex-col overflow-x-hidden bg-white text-gray-900 dark:text-white"
>
	<div class="mb-8 flex-grow">
		<ModeWatcher defaultMode={'light'} track={false}></ModeWatcher>
		<Header {supabase} {isMobile}></Header>
		<div class="mx-auto max-w-7xl p-4">
			<Toaster></Toaster>
		</div>
		{@render children()}
	</div>

	<Footer></Footer>
</div>
