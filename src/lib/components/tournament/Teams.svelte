<script lang="ts">
	import type { Tournament } from '$lib/tournament';
	import { Table, TableBody, TableBodyCell, TableBodyRow } from 'flowbite-svelte';

	export let tournament: Tournament;
</script>

<!-- svelte-ignore a11y-label-has-associated-control -->
<label class="block text-gray-700 text-sm font-bold mb-2">Teams:</label>

{#if tournament?.settings?.teams}
	<Table>
		<TableBody>
			{#each tournament?.settings?.teams as team}
				<TableBodyRow>
					<TableBodyCell>{team.name}</TableBodyCell>
					<TableBodyCell>
						<a
							href="/tables"
							class="font-medium text-blue-600 hover:underline dark:text-primary-500">Remove</a
						></TableBodyCell
					>
				</TableBodyRow>
			{/each}
			<TableBodyRow>
				<TableBodyCell>new team...</TableBodyCell>
				<TableBodyCell>
					<a href="/tables" class="font-medium text-blue-600 hover:underline dark:text-primary-500"
						>Add</a
					></TableBodyCell
				>
			</TableBodyRow>
		</TableBody>
	</Table>
{/if}
