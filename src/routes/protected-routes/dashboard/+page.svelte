<script lang="ts">
	import type { PageData } from './$types';
	import { error } from '$lib/toast';
	import { Spinner } from 'flowbite-svelte';
	import { CirclePlusOutline } from 'flowbite-svelte-icons';
	import { Card } from 'flowbite-svelte';

	export let data: PageData;

	let events: string | any[] | null;
	async function loadEvents() {
		data.supabase
			.from('events')
			.select('*')
			.eq('owner', data.session?.user.id as string)
			.then((data) => {
				if (data.error) {
					error(data.error.message);
				}
				events = data.data;
			});
	}
	let loadingEventPromise = loadEvents();

	const dNow = new Date();
	dNow.valueOf();
</script>

{#await loadingEventPromise}
	<Spinner color="blue" />
{:then}
	A place to see your tournaments you manage
	{#if events && events.length > 0}
		<div class="flex flex-col">
			{#each events as event}
				<!-- {#if event.date > dNow.valueOf()} -->
				<Card href="/protected-routes/events/{event.id}">
					<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
						{event.name}: {event.date}
					</h5>
					<p class="font-normal text-gray-700 dark:text-gray-400 leading-tight">
						{event.teams}
					</p>
				</Card>
				<!-- {/if} -->
			{/each}
		</div>
	{/if}
{/await}

<div class="flex flex-row">
	Create a new tournament:
	<a class="ml-2" href="/protected-routes/events/create"><CirclePlusOutline /></a>
</div>
