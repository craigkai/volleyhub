<script lang="ts">
	import type { PageData } from './$types';
	import { CirclePlusOutline } from 'flowbite-svelte-icons';
	import { Card } from 'flowbite-svelte';
	import { Button } from '$components/ui/button';
	import dayjs from 'dayjs';
	import { goto } from '$app/navigation';

	export let data: PageData;
	const events = data?.events;
</script>

<div class="flex flex-col items-center">
	A place to see your tournaments you manage
	{#if events && events.length > 0}
		<div class="m-2">
			{#each events as event}
				<!-- {#if event.date > dNow.valueOf()} -->
				<Card class="m-2" href="/protected-routes/events/{event.id}">
					<h5 class="mb-2 text-2xl font-bold tracking-tight">
						{event.name}
					</h5>
					<h4 class="mb-2 text-xl font-bold tracking-tight">
						{dayjs(event.date).format('YYYY-MM-DD')}
					</h4>
				</Card>
				<!-- {/if} -->
			{/each}
		</div>
	{/if}

	<div class="flex flex-row">
		<Button on:click={() => goto('/protected-routes/events/create')}><CirclePlusOutline /></Button>
	</div>
</div>
