<script lang="ts">
	import type { PageData } from '$types';
	import { Event } from '$lib/event';
	import { Matches as MatchesInstance } from '$lib/matches';
	import { Teams } from '$lib/teams';
	import Matches from '$lib/components/tournament/Matches.svelte';
	import { SupabaseDatabaseService } from '$lib/supabaseDatabaseService';
	import { error } from '$lib/toast';
	import type { HttpError } from '@sveltejs/kit';

	export let data: PageData;
	const databaseService = new SupabaseDatabaseService(data?.supabase);
	const tournament = new Event(data.event_id, databaseService);
	const matches = new MatchesInstance(data.event_id, databaseService);
	const teams = new Teams(data.event_id, databaseService);

	async function loadInitialData(): Promise<any> {
		return await tournament
			.load()
			.catch((err: HttpError) => {
				error(err?.body?.message);
			})
			.then(async () => {
				return await matches
					.load()
					.catch((err: HttpError) => {
						error(err?.body?.message);
					})
					.then(async () => {
						return await teams.load().catch((err: HttpError) => {
							error(err?.body?.message);
						});
					});
			});
	}
	const loadingInitialDataPromise = loadInitialData();
</script>

{#await loadingInitialDataPromise}
	loading...
{:then}
	<div class="flex flex-col items-center">
		{tournament?.name}
		<Matches {tournament} {matches} {teams} readOnly={true} />
	</div>
{/await}
