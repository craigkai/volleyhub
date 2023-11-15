<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.postcss';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { LayoutData } from './$types';
	import { SvelteToast } from '@zerodevx/svelte-toast';

	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';

	inject({ mode: dev ? 'development' : 'production' });

	export let data: LayoutData;

	$: ({ supabase, session } = data);

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, _session) => {
			if (_session?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});

	const options = {
		classes: ['rounded', 'bg-red-300']
	};
</script>

<Header {data} />

<SvelteToast {options} />

<div class="flex-col min-h-screen overflow-hidden p-4">
	<slot {data} />
</div>

<Footer {data} />
