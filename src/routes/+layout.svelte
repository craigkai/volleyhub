<script lang="ts">
	import '../app.postcss';
	import Header from '$components/Header.svelte';
	import Footer from '$components/Footer.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import type { SvelteToastOptions } from '@zerodevx/svelte-toast/stores';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';
	import { error } from '$lib/toast';
	import { goto, invalidate } from '$app/navigation';
	import { onMount } from 'svelte';

	inject({ mode: dev ? 'development' : 'production' });

	let { data = $bindable(), children } = $props();
	let { session, supabase, isMobile } = data;

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
			if (!newSession) {
				/**
				 * Queue this as a task so the navigation won't prevent the
				 * triggering function from completing
				 */
				setTimeout(() => {
					goto('/', { invalidateAll: true });
				});
			}
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => data.subscription.unsubscribe();
	});

	const options = {};

	function handleError(err: string | SvelteToastOptions) {
		error(err);
	}
</script>

<svelte:window on:error={handleError} />
<svelte:head>
	<title>VolleyHub</title>
</svelte:head>

<div class="dark:bg-gray-900 dark:text-gray-100 text-gray-900 bg-white">
	<ModeWatcher defaultMode={'light'} />

	<Header {supabase} {isMobile} />

	<div class="min-h-screen">
		<div class="wrap">
			<SvelteToast {options} />
		</div>
		{@render children()}
	</div>

	<Footer />
</div>
