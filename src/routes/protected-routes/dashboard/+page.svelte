<script lang="ts">
	import type { PageData } from './$types';
	import Teams from '$lib/components/Teams.svelte';

	export let data: PageData;
</script>

<div class="flex justify-center">
	<div class="flex-col">
		<h2>Your Memberships:</h2>
		<Teams {data} member={data?.session?.user} />
	</div>
</div>
