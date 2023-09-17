<script lang="ts">
	import type { PageData } from './$types';
	import Teams from '$lib/components/Teams.svelte';

	export let data: PageData;
</script>

<div class="flex justify-center">
	<div class="flex-col">
		<div>
			Teams playing this session:
			<Teams {data} />
		</div>
	</div>
</div>
