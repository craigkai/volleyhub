<script lang="ts">
	import { create_schedule } from '$lib/schedule';

	let schedule: any;
	let teams: any, courts: any, pools: any;

	function setSchedule() {
		teams = teams.split(',');
		schedule = create_schedule({ teams, courts, pools });
	}
</script>

Teams:
<input class="bg-gray-200 p-2 rounded" type="text" bind:value={teams} />

Numbr of Courts:
<input class="bg-gray-200 p-2 rounded" type="text" bind:value={courts} />

Number of Pool Play Games:
<input class="bg-gray-200 p-2 rounded" type="text" bind:value={pools} />

<button class="rounded bg-gray-400 p-4 hover:bg-gray-600" on:click={() => setSchedule()}
	>Generate Schedule</button
>

{JSON.stringify(schedule)}
