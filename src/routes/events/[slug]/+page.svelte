<script lang="ts">
	import type { PageData } from '$types';
	import { Event } from '$lib/event';
	import { Matches as MatchesInstance } from '$lib/matches';
	import Matches from '$lib/components/tournament/Matches.svelte';
	import type { Teams } from '$lib/teams';

	export let data: PageData;
	const event: Event = data?.tournament;
	const matches: MatchesInstance = data?.matches;
	const teams: Teams = data?.teams;
</script>

<div class="flex flex-col items-center">
	{event?.name}
	<Matches tournament={event} {matches} {teams} readOnly={true} />
</div>
