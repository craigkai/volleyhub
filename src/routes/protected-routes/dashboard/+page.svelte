<script lang="ts">
	import type { PageData } from './$types';
	import Teams from '$lib/Teams.svelte';

	export let data: PageData;
</script>

This page will show a list of your "teams" that you can edit Maybe also the teams you're subscribed
to so you can unsub.

<Teams {data} member={data?.session?.user} />
