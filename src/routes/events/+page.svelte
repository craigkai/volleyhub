<script lang="ts">
	import { create_schedule } from '$lib/schedule';

	let schedule: any;
	let teams: any, courts: any, pools: any;

	function setSchedule() {
		teams = teams.split(',');
		schedule = create_schedule({ teams, courts, pools });
	}
</script>

<div class="flex flex-col place-content-center place-items-center place-self-center">
	<div class="w-1/2 m-2">
		Teams:
		<input class="bg-gray-200 p-2 rounded" type="text" bind:value={teams} />
	</div>
	<div class="w-1/2 m-2">
		Numbr of Courts:
		<input class="bg-gray-200 p-2 rounded" type="number" bind:value={courts} />
	</div>

	<div class="w-1/2 m-2">
		Number of Pool Play Games:
		<input class="bg-gray-200 p-2 rounded" type="number" bind:value={pools} />
	</div>
	<div class="w-1/2 m-2">
		<button class="rounded bg-gray-400 p-4 hover:bg-gray-600" on:click={() => setSchedule()}
			>Generate Schedule</button
		>
	</div>
	<div class="w-1/2 m-2">
		{#if schedule}
			<ul>
				{#each schedule.pool_matches as match, i}
					Round {i + 1}
					{#each match.game_matches as court}
						<li>{JSON.stringify(court)}</li>
					{/each}
				{/each}
			</ul>
		{/if}
	</div>
</div>
