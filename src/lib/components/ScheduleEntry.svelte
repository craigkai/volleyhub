<script lang="ts">
	import { Card } from 'flowbite-svelte';
	export let game: any;
</script>

<Card href="/cards">
	<p class="font-normal text-gray-700 dark:text-gray-400 leading-tight">Court #{game.court}</p>

	<p class="mb-2 font-bold tracking-tight text-gray-900 dark:text-white">
		{game.versus[0]} vs {game.versus[1]}
	</p>
</Card>
