<script lang="ts">
	import type { PageData } from './$types';
	import { CirclePlusOutline } from 'flowbite-svelte-icons';
	import { Button } from '$components/ui/button/index.js';
	import * as Card from '$components/ui/card/index.js';
	import { parseDateTime } from '@internationalized/date';

	import { goto } from '$app/navigation';
	import EventsCards from '$components/eventsCards.svelte';

	export let data: PageData;
	const events = data?.events;
</script>

<div class="flex flex-col items-center">
	A place to see your tournaments you manage
	{#if events && events.length > 0}
		<div class="m-2">
			<EventsCards {events} />
		</div>
	{/if}

	<div class="flex flex-row">
		<Button on:click={() => goto('/protected-routes/events/create')}>Create</Button>
	</div>
</div>
