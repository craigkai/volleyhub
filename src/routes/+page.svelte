<script lang="ts">
	import UpcomingEvents from '$components/UpcomingEvents.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Dashboard - Volleyhub</title>
</svelte:head>

<main class="mx-auto max-w-7xl px-3 py-6 sm:px-6 lg:px-8">
	<UpcomingEvents {data} />
</main>
