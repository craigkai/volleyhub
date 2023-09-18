<script lang="ts">
	import type { PageData } from './$types';
	import Teams from '$lib/components/Teams.svelte';

	export let data: PageData;
</script>

<div class="flex justify-center">
	<div class="w-1/2">
		Teams playing this session:
		<Teams {data} />
	</div>
</div>
