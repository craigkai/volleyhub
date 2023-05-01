<script lang="ts">
	import type { PageData } from './$types';
	import Teams from '$lib/Teams.svelte';

	export let data: PageData;
</script>

This page will show Holidays Sports Bar and Grill current session standings Low Rec: xyz High Rec:
xyz Intermediate: xyz

<div>
	Teams this session:
	<Teams {data} />
</div>
