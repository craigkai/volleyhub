<script lang="ts">
	import type { PageData } from './$types';
	import { error } from '$lib/toast';

	export let data: PageData;

	let events: any;
	async function loadEvents() {
		data.supabase
			.from('events')
			.select('*')
			.eq('owner', '0754f3cc-9e9b-44b5-a928-e437f141fd29') //data?.session?.user?.id)
			.then((data: any) => {
				if (data.error) {
					error(data.error);
				}
				events = data?.data;
			});
	}
	let loadingEventPromise = loadEvents();

	const dNow = new Date();
	dNow.valueOf();
</script>

{#await loadingEventPromise}
	loading your events...
{:then}
	A place to see your tournaments you manage
	{#if events && events.length > 0}
		<div class="flex flex-col">
			UPCOMING EVENTS
			{#each events as event}
				{#if event.date > dNow.valueOf()}
					JSON.stringify(event)
				{/if}
			{/each}
		</div>
	{/if}
{/await}
