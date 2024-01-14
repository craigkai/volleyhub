<script lang="ts">
	import type { PageData } from '$types';
	import { Tournament } from '$lib/tournament';
	import Matches from '$lib/components/tournament/Matches.svelte';

	export let data: PageData;
	let tournament: Tournament = data?.tournament;
</script>

<div class="flex flex-col items-center">
	{tournament?.settings?.name}
	<Matches {tournament} readOnly={true} />
</div>
