<script lang="ts">
	import type { PageData } from './$types';
	import { error } from '$lib/toast';
	import { Spinner } from 'flowbite-svelte';
	import { CirclePlusOutline } from 'flowbite-svelte-icons';
	import { Card } from 'flowbite-svelte';
	import { loadEvents } from '$lib/tournament';
	import dayjs from 'dayjs';
	import type { HttpError } from '@sveltejs/kit';

	export let data: PageData;

	let loadingEventPromise = loadEvents(data?.supabase, data.session?.user.id as string).catch(
		(err: HttpError) => error(err.body.message)
	);
</script>

{#await loadingEventPromise}
	<Spinner color="blue" />
{:then events}
	A place to see your tournaments you manage
	{#if events && events.length > 0}
		<div class="flex flex-col">
			{#each events as event}
				<!-- {#if event.date > dNow.valueOf()} -->
				<Card href="/protected-routes/events/{event.id}">
					<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
						{event.name}
					</h5>
					<h4 class="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
						{dayjs(event.date).format('YYYY-MM-DD')}
					</h4>
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
