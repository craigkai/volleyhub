<script lang="ts">
	import { Label } from '$components/ui/label/index.js';
	import { Input } from '$components/ui/input/index.js';
	import { Button } from '$components/ui/button';
	import * as Select from '$components/ui/select/index.js';
	import * as AlertDialog from '$components/ui/alert-dialog/index.js';
	import { updateMatch } from '$lib/helper.svelte';
	import { error } from '@sveltejs/kit';
	import toast from 'svelte-5-french-toast';
	import { Match } from '$lib/match.svelte';
	import { Team } from '$lib/team.svelte';
	import XIcon from 'lucide-svelte/icons/x';

	let { matchId, matches, teams, tournament } = $props();

	let match = $state(matches?.matches?.find((m: { id: number }) => m.id === matchId) as Match);

	// Derive initial player lists from match_teams
	const initialHomePlayerIds = $derived.by(() => {
		if (match?.match_teams && Array.isArray(match.match_teams)) {
			return match.match_teams
				.filter((mt: any) => mt.side === 'home')
				.map((mt: any) => mt.team_id);
		}
		return [];
	});

	const initialAwayPlayerIds = $derived.by(() => {
		if (match?.match_teams && Array.isArray(match.match_teams)) {
			return match.match_teams
				.filter((mt: any) => mt.side === 'away')
				.map((mt: any) => mt.team_id);
		}
		return [];
	});

	// Track match_teams for individual format - mutable for user edits
	let homePlayerIds = $state<number[]>([]);
	let awayPlayerIds = $state<number[]>([]);

	// Sync with initial values when match changes
	$effect(() => {
		homePlayerIds = [...initialHomePlayerIds];
		awayPlayerIds = [...initialAwayPlayerIds];
	});

	async function saveMatch() {
		try {
			const isComplete = match.team1_score != null && match.team2_score != null;
			if (isComplete) {
				match.state = 'COMPLETE';
			} else {
				match.state = 'INCOMPLETE';
			}

			// For individual format, update match_teams
			if (tournament?.format === 'individual') {
				await updateMatchTeams();
			}

			const updatedMatch = await updateMatch(match);

			const team1 = updatedMatch
				? teams.teams.find((t: Team) => t.id === updatedMatch.team1)
				: null;
			const team2 = updatedMatch
				? teams.teams.find((t: Team) => t.id === updatedMatch.team2)
				: null;
			toast.success(`Match updated successfully`);
		} catch (err) {
			console.error('Failed to save match:', err);
			toast.error('Failed to save match');
		}
	}

	async function updateMatchTeams() {
		// Import the service
		const { MatchTeamsSupabaseDatabaseService } = await import('$lib/database/matchTeams');
		const matchTeamsService = new MatchTeamsSupabaseDatabaseService(
			match.databaseService.supabaseClient
		);

		// Delete existing match_teams
		await matchTeamsService.deleteByMatch(match.id!);

		// Create new match_teams entries
		const newMatchTeams = [
			...homePlayerIds.map((teamId) => ({
				match_id: match.id!,
				team_id: teamId,
				side: 'home'
			})),
			...awayPlayerIds.map((teamId) => ({
				match_id: match.id!,
				team_id: teamId,
				side: 'away'
			}))
		];

		await matchTeamsService.createMany(newMatchTeams);

		// Update the match object to reflect the changes
		match.match_teams = newMatchTeams.map((mt, index) => ({
			...mt,
			id: index,
			created_at: new Date().toISOString()
		}));
	}

	// Function to delete an existing match with confirmation
	async function deleteMatch() {
		const confirmation = window.confirm(
			'Are you sure you want to delete this match? This action cannot be undone.'
		);

		if (confirmation) {
			try {
				await match.delete();
				matches.matches = matches.matches.filter((m: Match) => m.id !== match.id);

				toast.success('Match deleted successfully');
			} catch (err) {
				toast.error('Failed to delete match');
			}
		} else {
			toast('Match deletion canceled');
		}
	}

	type MatchKeys = 'team1' | 'team2' | 'team1_score' | 'team2_score';
	type ScoreKeys = 'team1_score' | 'team2_score';

	// Get available players (excluding those already selected)
	function getAvailablePlayers(side: 'home' | 'away', slotIndex: number) {
		const selectedIds = side === 'home' ? homePlayerIds : awayPlayerIds;
		const otherSideIds = side === 'home' ? awayPlayerIds : homePlayerIds;
		const currentPlayerId = selectedIds[slotIndex];

		return teams.teams.filter((team: Team) => {
			// Include the current player
			if (team.id === currentPlayerId) return true;
			// Exclude players already selected on this side (except current slot)
			if (selectedIds.includes(team.id!) && team.id !== currentPlayerId) return false;
			// Exclude players on the other side
			if (otherSideIds.includes(team.id!)) return false;
			// Include all others
			return true;
		});
	}

	function updatePlayer(side: 'home' | 'away', slotIndex: number, newPlayerId: number) {
		if (side === 'home') {
			homePlayerIds[slotIndex] = newPlayerId;
			homePlayerIds = [...homePlayerIds]; // Trigger reactivity
		} else {
			awayPlayerIds[slotIndex] = newPlayerId;
			awayPlayerIds = [...awayPlayerIds]; // Trigger reactivity
		}
	}
</script>

{#snippet editIndividualPlayers(side: 'home' | 'away', playerIds: number[], label: string)}
	<div class="mb-6">
		<Label class="mb-3 block font-medium text-white">{label}:</Label>
		<div class="space-y-3">
			{#each playerIds as playerId, index (playerId)}
				{@const availablePlayers = getAvailablePlayers(side, index)}
				{@const currentPlayer = teams.teams.find((t: Team) => t.id === playerId)}
				<div class="flex items-center space-x-3">
					<span class="text-sm text-gray-400">Player {index + 1}:</span>
					<Select.Root
						type="single"
						value={playerId?.toString()}
						onValueChange={(value) => {
							if (value) {
								updatePlayer(side, index, parseInt(value, 10));
							}
						}}
					>
						<Select.Trigger
							class="flex-1 border-gray-600 bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-blue-500"
						>
							{currentPlayer?.name || 'Select player'}
						</Select.Trigger>
						<Select.Content class="border border-gray-700 bg-gray-800 text-white">
							{#each availablePlayers as player (player.id)}
								{#if player.id}
									<Select.Item
										value={player.id.toString()}
										label={player.name}
										class="hover:bg-gray-700"
									>
										{player.name}
									</Select.Item>
								{/if}
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet editEntity(entityType: string, entityId: MatchKeys, scoreProp?: ScoreKeys)}
	{@const entity = teams.teams.find((t: Team) => t.id === match[entityId])}
	<div class="mb-6 flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
		<Label class="min-w-[100px] font-medium text-white" for="{entityId}-select">
			{entityType}:
		</Label>

		<Select.Root
			type="single"
			onValueChange={(value) => {
				if (value) {
					match[entityId] = parseInt(value, 10);
				}
			}}
		>
			<Select.Trigger
				class="w-full border-gray-600 bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 md:w-[180px]"
				>{entity?.name}</Select.Trigger
			>
			<Select.Content class="border border-gray-700 bg-gray-800 text-white">
				{#each teams.teams as team (team.id)}
					{#if team.id}
						<Select.Item value={team.id.toString()} label={team.name} class="hover:bg-gray-700"
							>{team.name}</Select.Item
						>
					{/if}
				{/each}
			</Select.Content>
		</Select.Root>

		{#if scoreProp}
			<div class="flex flex-col md:ml-4 md:flex-row md:items-center">
				<Label class="min-w-[50px] font-medium text-white" for="{entityId}-score-input"
					>Score:</Label
				>
				<Input
					class="mt-2 max-w-[100px] rounded border border-blue-500 bg-gray-700 px-3 py-2 text-center leading-tight text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-400 md:mt-0 md:ml-2"
					id="{entityId}-score-input"
					type="text"
					inputmode="numeric"
					pattern="[0-9]*"
					aria-label="Score input for {entityType}"
					bind:value={match[scoreProp]}
					oninput={(e) => {
						// Only allow numeric input
						const input = e.target as HTMLInputElement;
						input.value = input.value.replace(/[^0-9]/g, '');
						// Update the bound value
						if (scoreProp) {
							match[scoreProp] = input.value ? parseInt(input.value, 10) : null;
						}
					}}
				/>
			</div>
		{/if}
	</div>
{/snippet}

{#if match}
	<div class="rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-lg">
		<div class="relative mb-6">
			<h2 class="text-center text-xl font-bold text-white">Edit Match</h2>
			<AlertDialog.Cancel
				class="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border-none bg-transparent p-0 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-blue-500"
			>
				<XIcon class="h-5 w-5" />
				<span class="sr-only">Close</span>
			</AlertDialog.Cancel>
		</div>

		{#if tournament?.format === 'individual' && homePlayerIds.length > 0 && awayPlayerIds.length > 0}
			<!-- Individual format: Edit individual players -->
			<div class="space-y-6">
				{@render editIndividualPlayers('home', homePlayerIds, 'Home Side')}
				{@render editIndividualPlayers('away', awayPlayerIds, 'Away Side')}

				<!-- Scores section -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<Label class="mb-2 block font-medium text-white" for="team1-score">Home Score:</Label>
						<Input
							class="w-full rounded border border-blue-500 bg-gray-700 px-3 py-2 text-center leading-tight text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
							id="team1-score"
							type="text"
							inputmode="numeric"
							pattern="[0-9]*"
							bind:value={match.team1_score}
							oninput={(e) => {
								const input = e.target as HTMLInputElement;
								input.value = input.value.replace(/[^0-9]/g, '');
								match.team1_score = input.value ? parseInt(input.value, 10) : null;
							}}
						/>
					</div>
					<div>
						<Label class="mb-2 block font-medium text-white" for="team2-score">Away Score:</Label>
						<Input
							class="w-full rounded border border-blue-500 bg-gray-700 px-3 py-2 text-center leading-tight text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
							id="team2-score"
							type="text"
							inputmode="numeric"
							pattern="[0-9]*"
							bind:value={match.team2_score}
							oninput={(e) => {
								const input = e.target as HTMLInputElement;
								input.value = input.value.replace(/[^0-9]/g, '');
								match.team2_score = input.value ? parseInt(input.value, 10) : null;
							}}
						/>
					</div>
				</div>

				<!-- Referee section for individual format -->
				{#if tournament?.refs !== 'provided'}
					{@const playersInMatch = [...homePlayerIds, ...awayPlayerIds]}
					{@const availableRefs = teams.teams.filter((t: Team) => t.id && !playersInMatch.includes(t.id))}
					{@const currentRef = teams.teams.find((t: Team) => t.id === match.ref)}
					<div class="mb-6">
						<Label class="mb-3 block font-medium text-white" for="referee-select">Referee:</Label>
						<Select.Root
							type="single"
							value={match.ref?.toString() || ''}
							onValueChange={(value) => {
								if (value) {
									match.ref = parseInt(value, 10);
								} else {
									match.ref = null;
								}
							}}
						>
							<Select.Trigger
								id="referee-select"
								class="w-full border-gray-600 bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-blue-500"
							>
								{currentRef?.name || 'No referee assigned'}
							</Select.Trigger>
							<Select.Content class="border border-gray-700 bg-gray-800 text-white">
								<Select.Item value="" label="No referee" class="hover:bg-gray-700">
									No referee
								</Select.Item>
								{#each availableRefs as ref (ref.id)}
									{#if ref.id}
										<Select.Item
											value={ref.id.toString()}
											label={ref.name}
											class="hover:bg-gray-700"
										>
											{ref.name}
										</Select.Item>
									{/if}
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				{/if}
			</div>
		{:else}
			<!-- Fixed teams format: Traditional team selection -->
			<div class="space-y-6">
				{@render editEntity('Home Team', 'team1', 'team1_score')}
				{@render editEntity('Away Team', 'team2', 'team2_score')}

				<!-- Referee section for fixed teams format -->
				{#if tournament?.refs !== 'provided'}
					{@const teamsInMatch = [match.team1, match.team2]}
					{@const availableRefs = teams.teams.filter((t: Team) => t.id && !teamsInMatch.includes(t.id))}
					{@const currentRef = teams.teams.find((t: Team) => t.id === match.ref)}
					<div class="mb-6">
						<Label class="mb-3 block font-medium text-white" for="referee-select-fixed">Referee:</Label>
						<Select.Root
							type="single"
							value={match.ref?.toString() || ''}
							onValueChange={(value) => {
								if (value) {
									match.ref = parseInt(value, 10);
								} else {
									match.ref = null;
								}
							}}
						>
							<Select.Trigger
								id="referee-select-fixed"
								class="w-full border-gray-600 bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-blue-500"
							>
								{currentRef?.name || 'No referee assigned'}
							</Select.Trigger>
							<Select.Content class="border border-gray-700 bg-gray-800 text-white">
								<Select.Item value="" label="No referee" class="hover:bg-gray-700">
									No referee
								</Select.Item>
								{#each availableRefs as ref (ref.id)}
									{#if ref.id}
										<Select.Item
											value={ref.id.toString()}
											label={ref.name}
											class="hover:bg-gray-700"
										>
											{ref.name}
										</Select.Item>
									{/if}
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				{/if}
			</div>
		{/if}

		<div class="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
			<Button
				class="w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none sm:w-auto"
				onclick={saveMatch}
			>
				Save Changes
			</Button>

			<Button
				onclick={() => deleteMatch()}
				class="mt-2 w-full rounded-md bg-red-600 px-6 py-3 font-medium text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none sm:mt-0 sm:w-auto"
			>
				Delete Match
			</Button>
		</div>
	</div>
{/if}
