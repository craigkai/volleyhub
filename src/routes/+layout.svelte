<!-- src/routes/+layout.svelte -->

<script lang="ts">
	import '../app.postcss';
	import Header from '$components/Header.svelte';
	import Footer from '$components/Footer.svelte';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { LayoutData } from './$types';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import type { SvelteToastOptions } from '@zerodevx/svelte-toast/stores';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';
	import { error } from '$lib/toast';
	import { derived, writable } from 'svelte/store';

	inject({ mode: dev ? 'development' : 'production' });

	export let data: LayoutData;
	let supabaseStore = writable<typeof supabase>();
	$: supabaseStore.set(supabase);

	$: ({ supabase, session } = data);

	// this is necessary to ensure that subscriptions to old supabase clients are cleaned up properly
	// when a new client is retrieved from the loader.
	let supabaseAuthStateChangeSubscriptionStore = derived(
		supabaseStore,
		(
			$supabaseStore: {
				auth: {
					onAuthStateChange: (
						arg0: (event: any, _session: any) => void
					) => { data: { subscription: any } };
				};
			},
			set: (arg0: any) => void
		) => {
			const {
				data: { subscription }
			} = $supabaseStore.auth.onAuthStateChange((event, _session) => {
				if (_session?.expires_at !== session?.expires_at) {
					invalidate('supabase:auth');
				}
			});
			set(subscription);
			return subscription.unsubscribe;
		}
	);

	onMount(() => {
		/* eslint-disable-next-line @typescript-eslint/no-empty-function */
		return supabaseAuthStateChangeSubscriptionStore.subscribe(() => {});
	});

	const options = {};

	function handleError(err: string | SvelteToastOptions) {
		error(err);
	}
</script>

<svelte:window on:error={handleError} />

<html lang="en">
	<div class="dark:text-nord-12">
		<Header {data} />

		<div class="min-h-screen">
			<SvelteToast {options} />

			<slot {data} />
		</div>

		<Footer {data} />
	</div>
</html>
