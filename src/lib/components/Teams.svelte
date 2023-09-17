<!-- Teams that the provided user is a member of -->
<script lang="ts">
	import { getAllTeams } from '$lib/teams';
	import type { PageData } from './$types';

	export let data: PageData;
	// Optional member query value, if member is provided then we can limit the
	// teams that we return etc etc.
	export let member: any | null = null;

	let loadingTeamsPromise = getAllTeams(
		data.supabase,
		member ? data?.session?.user?.id : undefined
	);
</script>

{#await loadingTeamsPromise}
	<div class="flex justify-center">
		<div
			class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
			role="status"
		>
			<span
				class="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"
				>Loading...</span
			>
		</div>
	</div>
{:then loadedTeams}
	<ul>
		{#each ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as day}
			{@const teamsForToday = loadedTeams.filter((t) => t.day === day)}
			<li class="bg-purple-200 p-2">
				{day}:
				{#if teamsForToday.length > 0}
					{@const levels = Object.keys(
						teamsForToday.reduce((accumulator, currentValue) => {
							accumulator[currentValue.level] = 1;
							return accumulator;
						}, {})
					)}
					{#each levels as level}
						{@const teamsForLevel = teamsForToday.filter((t) => t.level === level)}
						<div class="bg-green-200 m-2 p-2">
							{level}:
							<div class="m-2 bg-blue-200 p-2">
								{#each teamsForLevel as team}
									<div class="border-solid border-2 p-2">{team.name}</div>
								{/each}
							</div>
						</div>
					{/each}
				{/if}
			</li>
		{/each}
	</ul>
{/await}
