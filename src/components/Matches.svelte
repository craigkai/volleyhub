<script lang="ts">
	import ViewMatch from './Match.svelte';
	import { Matches } from '$lib/matches.svelte';
	import type { RealtimeChannel } from '@supabase/supabase-js';
	import Zap from 'lucide-svelte/icons/zap';
	import ZapOff from 'lucide-svelte/icons/zap-off';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import { onDestroy, onMount } from 'svelte';
	import toast from 'svelte-5-french-toast';
	import EditRef from './EditRef.svelte';
	import { Match } from '$lib/match.svelte';
	import * as Table from '$components/ui/table/index.js';
	import * as Alert from '$components/ui/alert/index.js';
	import { Button } from '$components/ui/button';
	import * as Popover from '$components/ui/popover/index.js';
	import { MatchSupabaseDatabaseService } from '$lib/database/match';
	import Plus from 'lucide-svelte/icons/plus';
	import PlusCircle from 'lucide-svelte/icons/plus-circle';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import MoreVertical from 'lucide-svelte/icons/more-vertical';
	import Grid3X3 from 'lucide-svelte/icons/grid-3x3';
	import List from 'lucide-svelte/icons/list';
	import RoundViewer from './RoundViewer.svelte';
	import { sendRoundNotifications } from '$lib/pushNotifications';
	import { PairingGenerator } from '$lib/pairingGenerator.svelte';
	import { calculateIndividualStandings } from '$lib/individualStandings.svelte';
	import { PlayerTeamsSupabaseDatabaseService } from '$lib/database/playerTeams';

	let { readOnly = false, defaultTeam, data, onVisibilityChange, onOnline, onOffline } = $props();

	const matcheSupabaseDatabaseService = new MatchSupabaseDatabaseService(
		data.tournament.databaseService.supabaseClient
	);
	const match = new Match(matcheSupabaseDatabaseService);

	let showGenerateMatchesAlert = $state(false);
	let matchesSubscription: RealtimeChannel | undefined = $state();
	let eventSubscription: RealtimeChannel | undefined = $state();
	let teamsSubscription: RealtimeChannel | undefined = $state();
	let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
	const HEARTBEAT_INTERVAL_MS = 10000;
	let viewMode = $state<'schedule' | 'rounds'>('schedule');

	let subscriptionStatus: 'SUBSCRIBED' | 'CLOSED' = $derived.by(() => {
		const matchStatus = data.matches?.subscriptionStatus;
		const eventStatus = data.tournament?.subscriptionStatus;
		const teamsStatus = data.teams?.subscriptionStatus;
		return matchStatus === 'SUBSCRIBED' &&
			eventStatus === 'SUBSCRIBED' &&
			teamsStatus === 'SUBSCRIBED'
			? 'SUBSCRIBED'
			: 'CLOSED';
	});
	let tableContainer: HTMLElement | undefined = $state();
	let showScrollIndicator = $state(false);

	// Check if table needs horizontal scroll
	$effect(() => {
		if (tableContainer) {
			const checkScroll = () => {
				showScrollIndicator = tableContainer.scrollWidth > tableContainer.clientWidth;
			};
			checkScroll();
			window.addEventListener('resize', checkScroll);
			return () => window.removeEventListener('resize', checkScroll);
		}
	});

	function heartbeatCheck() {
		try {
			// Don't try to reconnect if we don't have an event or matches
			if (!data.tournament?.id || !data.matches?.matches?.length) {
				return;
			}

			const matchState = matchesSubscription?.state;
			const eventState = eventSubscription?.state;
			const teamsState = teamsSubscription?.state;

			const isDisconnected =
				matchState !== 'joined' || eventState !== 'joined' || teamsState !== 'joined';

			if (isDisconnected) {
				console.warn('Heartbeat: Detected lost subscription. Attempting to resubscribe...');
				toast('Reconnecting match data...', { duration: 1500 });
				subscribe();
			}
		} catch (error) {
			console.error('Heartbeat check error:', error);
		}
	}

	onMount(async () => {
		// Only subscribe if we have an actual event (not on create page)
		if (data.tournament?.id) {
			subscribe();
			heartbeatInterval = setInterval(heartbeatCheck, HEARTBEAT_INTERVAL_MS);
		}
	});

	onDestroy(() => {
		if (matchesSubscription) matchesSubscription.unsubscribe();
		if (eventSubscription) eventSubscription.unsubscribe();
		if (teamsSubscription) teamsSubscription.unsubscribe();
		if (heartbeatInterval) clearInterval(heartbeatInterval);
	});

	async function subscribe(): Promise<void> {
		try {
			// Ensure matches exist before subscribing
			if (data.matches?.event_id && data.matches?.matches?.length > 0) {
				if (data.matches?.subscriptionStatus !== 'SUBSCRIBED') {
					matchesSubscription?.unsubscribe();
					matchesSubscription = await data.matches.subscribeToMatches();
				}

				// Events (current round)
				if (data.tournament?.id && data.tournament?.subscriptionStatus !== 'SUBSCRIBED') {
					eventSubscription?.unsubscribe();
					eventSubscription = await data.tournament.subscribeToCurrentRound();
				}

				// Teams
				if (data.teams?.eventId && data.teams?.subscriptionStatus !== 'SUBSCRIBED') {
					teamsSubscription?.unsubscribe();
					teamsSubscription = await data.teams.subscribeToTeams();
				}
			}
		} catch (error) {
			console.error('Subscription failed:', error);
			toast.error('Failed to subscribe to tournament data');
		}
	}

	function handleVisibilityChange() {
		onVisibilityChange?.();
		subscribe();
	}

	function checkGenerateMatches() {
		if (readOnly) return;

		if ((data.matches?.matches?.length ?? 0) > 0) {
			showGenerateMatchesAlert = true;
		} else {
			generateMatches();
		}
	}

	async function handleOnline() {
		onOnline?.();
		await subscribe();
	}

	function handleOffline() {
		onOffline?.();
		toast.error('You are offline. Matches cannot be updated.');
	}

	$effect(() => {
		if (subscriptionStatus === 'SUBSCRIBED') {
			data.matches.load(data.matches.event_id);
			data.tournament.load(data.tournament.id);
		}
	});

	let loading: boolean = $state(false);
	async function generateMatches(): Promise<void> {
		try {
			loading = true;
			if (matchesSubscription) {
				await matchesSubscription.unsubscribe();
				matchesSubscription = undefined;
			}

			const isMixAndMatch = data.tournament?.tournament_type === 'mix-and-match';

			// Declare variable to hold teams for matching
			let teamsForMatching: Array<{ id: number; name: string }> = [];

			// For mix-and-match, generate teams first
			if (isMixAndMatch) {
				// Check if we have players instead of teams
				if (!data.players || data.players.players.length < 2) {
					const playerCount = data.players?.players?.length ?? 0;
					const message =
						playerCount === 0
							? 'No players found. Please add players before generating matches.'
							: `Only ${playerCount} player found. Need at least 2 players to generate matches.`;
					toast.error(message);
					return;
				}

				// Generate teams and matches for ALL rounds based on pools setting
				const teamSize = data.tournament?.team_size || 2;
				const numRounds = data.tournament?.pools || 1;
				const standings = calculateIndividualStandings(
					data.players.players,
					data.playerStats?.stats ?? []
				);

				const pairingGenerator = new PairingGenerator();
				const playerTeamsService = new PlayerTeamsSupabaseDatabaseService(
					data.tournament.databaseService.supabaseClient
				);

				// Clean up existing temporary teams and their matches before generating new ones
				const supabase = data.tournament.databaseService.supabaseClient;

				// First, get all temporary team IDs for this event
				const { data: tempTeams, error: tempTeamsError } = await supabase
					.from('teams')
					.select('id')
					.eq('event_id', data.tournament.id)
					.eq('is_temporary', true);

				if (tempTeamsError) {
					console.error('Error fetching temporary teams:', tempTeamsError);
					toast.error('Failed to clean up previous teams. Please try again.');
					loading = false;
					return;
				} else if (tempTeams && tempTeams.length > 0) {
					const tempTeamIds = tempTeams.map((t) => t.id);

					// Delete matches where team1 or team2 is a temporary team
					const { error: matchesError } = await supabase
						.from('matches')
						.delete()
						.or(`team1.in.(${tempTeamIds.join(',')}),team2.in.(${tempTeamIds.join(',')})`);

					if (matchesError) {
						console.error('Error deleting matches:', matchesError);
						toast.error('Failed to delete old matches. Please try again.');
						loading = false;
						return;
					}

					// Delete temporary teams (CASCADE will automatically delete player_teams)
					const { error: teamsError } = await supabase
						.from('teams')
						.delete()
						.in('id', tempTeamIds);

					if (teamsError) {
						console.error('Error deleting temporary teams:', teamsError);
						toast.error('Failed to delete old teams. Please try again.');
						loading = false;
						return;
					}
				}

				// Generate and create all teams for all rounds first
				const allCreatedTeams: Array<{ id: number; name: string; round?: number }> = [];

				for (let roundNum = 1; roundNum <= numRounds; roundNum++) {
					// For mix-and-match, rotate player order each round for different pairings
					// Round 1: original order, Round 2: rotate by 1, Round 3: rotate by 2, etc.
					const rotateBy = (roundNum - 1) % standings.length;
					const rotatedStandings = [
						...standings.slice(rotateBy),
						...standings.slice(0, rotateBy)
					];
					const generatedTeams = await pairingGenerator.generateSnakeDraftPairings(
						data.players.players,
						data.tournament.id,
						roundNum,
						rotatedStandings,
						teamSize
					);

					// Create teams for this round
					for (const { team: teamData, playerIds } of generatedTeams) {
						const createdTeam = await data.teams.create(teamData);

						if (createdTeam && createdTeam.id) {
							allCreatedTeams.push({
								id: createdTeam.id,
								name: createdTeam.name,
								round: createdTeam.round
							});

							const playerTeamRecords = playerIds.map((playerId) => ({
								team_id: createdTeam.id,
								player_id: playerId,
								position: null
							}));

							await playerTeamsService.createMany(playerTeamRecords);
						}
					}
				}

				// Now create all matches at once (this will only delete matches once)
				if (allCreatedTeams.length >= 2) {
					await data.matches.create(data.tournament, allCreatedTeams);
				} else {
					console.warn(`Not enough teams (${allCreatedTeams.length}) to create matches`);
					toast.error(`Failed to create matches: need at least 2 teams, got ${allCreatedTeams.length}`);
				}

				// Reload teams to update the UI
				const loadedTeams = await data.teams.load(data.tournament.id);
				if (loadedTeams) {
					data.teams.teams = loadedTeams;
				}

				// Reload matches to update the UI
				await data.matches.load(data.tournament.id);

				toast.success(`Generated ${numRounds} rounds of matches`);

				// Skip the normal match creation below since we already created matches for each round
				teamsForMatching = [];
			} else {
				// For fixed-teams tournaments, use all teams
				// Check teams count before generating matches
				if (data.teams.teams.length < 2) {
					const teamCount = data.teams.teams.length;
					const message =
						teamCount === 0
							? 'No teams found. Please add teams before generating matches.'
							: `Only ${teamCount} team found. Need at least 2 teams to generate matches.`;
					toast.error(message);
					return;
				}

				teamsForMatching = data.teams.teams.map(
					(team: { id: number; name: string; round?: number }) => ({
						id: team.id,
						name: team.name,
						round: team.round
					})
				);
			}

			// Only create matches if we have teams (for fixed-teams tournaments)
			// For mix-and-match, we already created matches in the loop above
			if (teamsForMatching.length > 0) {
				const res: Matches | undefined = await data.matches.create(
					data.tournament,
					teamsForMatching
				);

				if (!res) {
					toast.error('Failed to create matches');
					return;
				}
			}
			// Ensure all subscriptions are active for realtime updates
			await subscribe();

			// Safety reload after a short delay to ensure all matches were received via realtime
			setTimeout(async () => {
				const currentMatchCount = data.matches?.matches?.length ?? 0;
				if (currentMatchCount === 0) {
					console.warn('No matches received via realtime, doing safety reload');
					data.matches = await data.matches.load(data.matches.event_id);
				}
			}, 2000);
		} catch (err: unknown) {
			console.error('Match generation failed:', err);
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to generate matches. Please try again.';
			toast.error(errorMessage);
		} finally {
			showGenerateMatchesAlert = false;
			loading = false;
		}
	}

	let rounds = $derived(
		Math.max.apply(Math, data.matches?.matches?.map((m: { round: number }) => m.round) ?? [0]) +
			1 || 1
	);

	function roundHasDefaultTeam(roundIndex: number): boolean {
		if (!defaultTeam) return false;

		return data.matches.matches.some((m: Match) => {
			if (typeof m.round === 'undefined' || m.round.toString() !== roundIndex.toString())
				return false;

			const team1 = data.teams.teams.find((t: { id: number; name: string }) => t.id === m.team1);
			const team2 = data.teams.teams.find((t: { id: number; name: string }) => t.id === m.team2);

			return team1?.name === defaultTeam || team2?.name === defaultTeam;
		});
	}

	function addMatch(round: number, court: number) {
		const newMatch = {
			event_id: data.matches.event_id,
			court,
			round,
			state: 'INCOMPLETE' as 'INCOMPLETE'
		};

		match
			.create(newMatch)
			.then(() => toast.success('Match added'))
			.catch((err: { message: string }) => toast.error('Failed to add match: ' + err.message));
	}

	let addingRound = $state(false);

	async function addRound() {
		if (addingRound) return;

		addingRound = true;
		const newRound = rounds;
		const numCourts = data.tournament.courts ?? 1;

		try {
			for (let court = 0; court < numCourts; court++) {
				await match.create({
					event_id: data.matches.event_id,
					round: newRound,
					court,
					state: 'INCOMPLETE'
				});
			}

			rounds++;
			await data.matches.load(data.matches.event_id);
			toast.success(
				`Added round ${newRound + 1} with ${numCourts} ${numCourts === 1 ? 'court' : 'courts'}`
			);
		} catch (err: unknown) {
			toast.error('Failed to add round: ' + (err instanceof Error ? err.message : 'Unknown error'));
		} finally {
			addingRound = false;
		}
	}

	async function setCurrentRound(round: number) {
		if (round < 0 || round >= rounds) {
			toast.error('Invalid round number');
			return;
		}

		try {
			await data.tournament.setCurrentRound(round);
			data.tournament.current_round = round;
			toast.success(`Set current round to ${round + 1}`);

			// Send push notifications for this round
			try {
				const result = await sendRoundNotifications(data.supabase, data.eventId, round);
				if (result.success) {
				} else {
					console.warn('Round notifications failed:', result.message);
				}
			} catch (error) {
				console.error('Error sending round notifications:', error);
			}
		} catch (err: unknown) {
			toast.error(
				'Failed to set current round: ' + (err instanceof Error ? err.message : 'Unknown error')
			);
		}
	}

	async function deleteRound(round: number) {
		if (
			!confirm(`Are you sure you want to delete Round ${round + 1}? This action cannot be undone.`)
		) {
			return;
		}

		try {
			await data.matches.deleteRound(round);

			// Reload matches data to ensure UI updates
			data.matches = await data.matches.load(data.matches.event_id);

			toast.success(`Round ${round + 1} deleted successfully`);

			// Update current_round if necessary
			const currentRound = data.tournament.current_round ?? 0;
			if (currentRound > round) {
				await data.tournament.setCurrentRound(currentRound - 1);
				data.tournament.current_round = currentRound - 1;
			} else if (currentRound === round && currentRound > 0) {
				await data.tournament.setCurrentRound(currentRound - 1);
				data.tournament.current_round = currentRound - 1;
			}
		} catch (err: unknown) {
			toast.error(
				'Failed to delete round: ' + (err instanceof Error ? err.message : 'Unknown error')
			);
		}
	}

	async function deleteFromRound(fromRound: number) {
		if (
			!confirm(
				`Are you sure you want to delete Round ${fromRound + 1} and all following rounds? This action cannot be undone.`
			)
		) {
			return;
		}

		try {
			await data.matches.deleteFromRound(fromRound);

			// Reload matches data to ensure UI updates
			data.matches = await data.matches.load(data.matches.event_id);

			toast.success(`Rounds ${fromRound + 1} and onwards deleted successfully`);

			// Update current_round if necessary
			const currentRound = data.tournament.current_round ?? 0;
			if (currentRound >= fromRound) {
				const newCurrentRound = Math.max(0, fromRound - 1);
				await data.tournament.setCurrentRound(newCurrentRound);
				data.tournament.current_round = newCurrentRound;
			}
		} catch (err: unknown) {
			toast.error(
				'Failed to delete rounds: ' + (err instanceof Error ? err.message : 'Unknown error')
			);
		}
	}
</script>

<svelte:document onvisibilitychange={handleVisibilityChange} />
<svelte:window ononline={handleOnline} onoffline={handleOffline} />

<div class="space-y-4 p-3 sm:space-y-6 sm:p-0">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
			<h2 class="text-base font-semibold text-gray-800 sm:text-lg dark:text-white">
				Tournament Matches
			</h2>
			<div
				class="flex h-5 w-fit items-center gap-1 rounded-full px-2 text-xs font-medium sm:h-6"
				class:bg-emerald-100={subscriptionStatus === 'SUBSCRIBED'}
				class:text-emerald-700={subscriptionStatus === 'SUBSCRIBED'}
				class:bg-red-100={subscriptionStatus !== 'SUBSCRIBED'}
				class:text-red-700={subscriptionStatus !== 'SUBSCRIBED'}
			>
				{#if subscriptionStatus === 'SUBSCRIBED'}
					<Zap class="h-3 w-3 sm:h-3.5 sm:w-3.5" />
					<span>Live</span>
				{:else}
					<ZapOff class="h-3 w-3 sm:h-3.5 sm:w-3.5" />
					<span>Offline</span>
				{/if}
			</div>

			<!-- View Mode Toggle -->
			<div
				class="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800"
			>
				<Button
					variant="ghost"
					size="sm"
					onclick={() => (viewMode = 'schedule')}
					class={`h-6 px-2 text-xs ${
						viewMode === 'schedule'
							? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
							: 'text-gray-600'
					}`}
				>
					<Grid3X3 class="mr-1 h-3 w-3" />
					Schedule
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onclick={() => (viewMode = 'rounds')}
					class={`h-6 px-2 text-xs ${
						viewMode === 'rounds'
							? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
							: 'text-gray-600'
					}`}
				>
					<List class="mr-1 h-3 w-3" />
					Rounds
				</Button>
			</div>
		</div>

		{#if !readOnly}
			<div class="w-full sm:w-auto sm:justify-end">
				<Button
					onclick={checkGenerateMatches}
					class="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none sm:w-auto sm:px-4 sm:py-2 dark:bg-emerald-600 dark:hover:bg-emerald-700"
					disabled={loading}
					aria-label={loading ? 'Generating matches...' : 'Generate tournament matches'}
				>
					<RefreshCw class={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
					<span>{loading ? 'Generating...' : 'Generate Matches'}</span>
				</Button>
			</div>
		{/if}
	</div>

	{#if !readOnly && showGenerateMatchesAlert}
		<Alert.Root
			class="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
		>
			<div class="flex items-start gap-3">
				<AlertCircle class="h-5 w-5 text-amber-500" />
				<div class="flex-1">
					<Alert.Title class="mb-1 text-base font-semibold">Generate new matches?</Alert.Title>
					<Alert.Description class="text-sm">
						You already have match data. Generating new matches will delete all existing matches and
						scores.
					</Alert.Description>
					<div class="mt-4 flex flex-col gap-2 sm:flex-row">
						<Button
							onclick={generateMatches}
							class="inline-flex items-center justify-center rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 focus:ring-2 focus:ring-amber-500/40 focus:outline-none dark:bg-amber-700 dark:hover:bg-amber-600"
						>
							Yes, generate new matches
						</Button>
						<Button
							onclick={() => (showGenerateMatchesAlert = false)}
							class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
						>
							Cancel
						</Button>
					</div>
				</div>
			</div>
		</Alert.Root>
	{/if}

	{#if loading}
		<div
			class="flex h-32 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 sm:h-40 dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="flex flex-col items-center gap-2">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600 sm:h-10 sm:w-10"
					role="status"
				>
					<span class="sr-only">Loading...</span>
				</div>
				<p class="text-xs text-gray-500 sm:text-sm dark:text-gray-400">Generating matches...</p>
			</div>
		</div>
	{:else if data.matches && data.matches.matches && data.matches?.matches?.length > 0}
		<div
			class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
		>
			{#if defaultTeam}
				<div
					class="border-b border-yellow-100 bg-yellow-50 px-3 py-2 sm:px-4 dark:border-yellow-900/30 dark:bg-yellow-900/20"
				>
					<div class="flex items-center gap-2">
						<div class="h-2 w-2 rounded-full bg-yellow-300 sm:h-3 sm:w-3 dark:bg-yellow-500"></div>
						<p class="text-xs font-medium text-yellow-800 sm:text-sm dark:text-yellow-300">
							Viewing matches for: <span class="font-semibold">{defaultTeam}</span>
						</p>
					</div>
				</div>
			{/if}

			<div class="relative"></div>

			{#if viewMode === 'schedule'}
			{#if showScrollIndicator}
				<div class="mb-2 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 sm:hidden">
					<svg class="h-4 w-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
					</svg>
					<span>Scroll right to see more courts</span>
					<svg class="h-4 w-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
					</svg>
				</div>
			{/if}
				<div
					bind:this={tableContainer}
				class="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-600 relative overflow-x-auto"
			>
				<!-- Scroll gradient indicator -->
				{#if showScrollIndicator}
					<div class="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-white to-transparent dark:from-gray-800 sm:hidden"></div>
				{/if}
					<Table.Root>
						<Table.Header>
							<Table.Row class="sticky top-0 z-20 bg-gray-50 dark:bg-gray-900">
								<Table.Head
									class="sticky left-0 z-10 w-16 bg-gray-50 py-3 pl-3 text-left text-xs font-medium text-gray-700 sm:w-20 sm:py-3 sm:pl-4 sm:text-sm dark:bg-gray-900 dark:text-gray-300"
								>
									Round
								</Table.Head>
								{#each Array(data.tournament.courts) as _, i}
									{@const index = i + 1}
									<Table.Head
										class="py-3 text-center text-xs font-medium text-gray-700 sm:py-3 sm:text-sm dark:text-gray-300 {data.tournament.courts === 1 ? 'min-w-[300px] sm:min-w-[400px]' : 'min-w-[120px] sm:min-w-[140px]'}"
									>
										Court {index}
									</Table.Head>
								{/each}
								{#if data.tournament.refs === 'teams'}
									<Table.Head
										class="min-w-[100px] py-3 pr-3 text-center text-xs font-medium text-gray-700 sm:pr-4 sm:text-sm dark:text-gray-300"
									>
										Referee
									</Table.Head>
								{/if}
							</Table.Row>
						</Table.Header>

						<Table.Body>
							{#if rounds > 0}
								{#each Array(rounds) as _, round}
									{@const hasDefaultTeam = roundHasDefaultTeam(round)}

									<Table.Row
										class="border-t border-gray-200 dark:border-gray-700 {`
										${round % 2 === 1 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
										${hasDefaultTeam ? 'default-team-row' : ''}
									`}"
									>
										<Table.Cell
											class="sticky left-0 z-10 bg-white py-3 pl-3 text-xs font-medium text-gray-800 sm:py-3 sm:pl-4 sm:text-sm
			dark:bg-gray-800 dark:text-gray-200"
											style="top: 48px;"
										>
											<div
												class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2"
											>
												<span class="font-semibold">Round {round + 1}</span>

												<div class="flex items-center gap-1">
													{#if round === (data.tournament.current_round ?? 0)}
														<span
															class="inline-block rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 sm:px-2 sm:text-xs dark:bg-indigo-900 dark:text-indigo-300"
														>
															Current
														</span>
													{:else if !readOnly && round !== (data.tournament.current_round ?? 0)}
														<Button
															variant="ghost"
															size="sm"
															class="h-6 px-2 py-0.5 text-[10px] text-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 sm:text-xs dark:hover:bg-indigo-900/30"
															onclick={() => setCurrentRound(round)}
														>
															Set Current
														</Button>
													{/if}

													{#if !readOnly}
														<Popover.Root>
															<Popover.Trigger
																class="inline-flex h-6 w-6 items-center justify-center rounded border-0 bg-transparent p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
															>
																<MoreVertical class="h-3 w-3" />
															</Popover.Trigger>
															<Popover.Content class="w-48 p-1" align="end">
																<div class="space-y-1">
																	<Button
																		variant="ghost"
																		size="sm"
																		class="w-full justify-start text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
																		onclick={() => deleteRound(round)}
																	>
																		<Trash2 class="mr-2 h-3 w-3" />
																		Delete This Round
																	</Button>
																	{#if round < rounds - 1}
																		<Button
																			variant="ghost"
																			size="sm"
																			class="w-full justify-start text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
																			onclick={() => deleteFromRound(round)}
																		>
																			<Trash2 class="mr-2 h-3 w-3" />
																			Delete From Here
																		</Button>
																	{/if}
																</div>
															</Popover.Content>
														</Popover.Root>
													{/if}
												</div>
											</div>
										</Table.Cell>

										{#each Array(data.tournament.courts) as _, court}
											{@const match = data.matches.matches.find(
												(m: Match) => m?.court === court && (m?.round ?? 0) === round + 1
											)}
											<Table.Cell class="p-2 text-center sm:p-2">
												{#if match}
													<ViewMatch
														matches={data.matches}
														{match}
														teams={data.teams}
														{readOnly}
														{defaultTeam}
														courts={data.tournament.courts ?? 1}
														playerStats={data.playerStats}
													/>
												{:else if !readOnly}
													<div class="group relative">
														<Button
															size="sm"
															variant="outline"
															class="min-h-[70px] w-full border-2 border-dashed border-gray-300 bg-gray-50/50 text-gray-500 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 focus:border-emerald-400 focus:bg-emerald-50 focus:text-emerald-700 focus:ring-2 focus:ring-emerald-200 sm:min-h-[60px] dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400"
															onclick={() => addMatch(round, court)}
														>
															<div class="flex flex-col items-center gap-1">
																<Plus
																	class="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
																/>
																<span class="text-xs font-medium">Add Match</span>
															</div>
														</Button>

														<!-- Subtle hover effect overlay -->
														<div
															class="pointer-events-none absolute inset-0 rounded-md bg-gradient-to-br from-emerald-400/0 to-emerald-600/0 transition-all duration-300 group-hover:from-emerald-400/5 group-hover:to-emerald-600/10"
														></div>
													</div>
												{/if}
											</Table.Cell>
										{/each}

										{#if data.tournament.refs === 'teams'}
											{@const matchesPerRound = data.matches.matches.filter(
												(m: MatchRow) => m.round === round + 1
											)}
											<Table.Cell class="p-2 pr-3 text-center sm:p-2 sm:pr-4">
												<EditRef {readOnly} {matchesPerRound} teams={data.teams} {defaultTeam} />
											</Table.Cell>
										{/if}
									</Table.Row>
								{/each}
							{/if}
							{#if !readOnly}
								<Table.Row
									class="border-t-2 border-dashed border-gray-200 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:border-gray-700 dark:from-gray-800/50 dark:to-gray-900/50"
								>
									<Table.Cell
										colspan={data.tournament.courts + (data.tournament.refs === 'teams' ? 2 : 1)}
										class="p-4 sm:p-6"
									>
										<div class="flex flex-col items-center gap-3">
											<div class="group relative">
												<Button
													onclick={addRound}
													size="lg"
													disabled={addingRound}
													class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl focus:ring-4 focus:ring-emerald-200 focus:outline-none active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:w-auto dark:from-emerald-600 dark:to-emerald-700 dark:hover:from-emerald-700 dark:hover:to-emerald-800 {addingRound
														? 'add-round-loading'
														: ''}"
												>
													<PlusCircle
														class="plus-circle h-5 w-5 transition-transform duration-200 group-hover:rotate-90 {addingRound
															? 'animate-spin'
															: ''}"
													/>
													<span>{addingRound ? 'Adding Round...' : 'Add New Round'}</span>
													{#if !addingRound}
														<Calendar class="h-4 w-4 opacity-75" />
													{/if}
												</Button>

												<!-- Glow effect -->
												<div
													class="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-20"
												></div>
											</div>

											<p class="max-w-xs text-center text-xs text-gray-500 dark:text-gray-400">
												Create round {rounds + 1} with {data.tournament.courts}
												{data.tournament.courts === 1 ? 'court' : 'courts'}
											</p>
										</div>
									</Table.Cell>
								</Table.Row>
							{/if}
						</Table.Body>
					</Table.Root>
				</div>
			{:else}
				<RoundViewer
					{readOnly}
					{defaultTeam}
					{data}
					{deleteRound}
					{deleteFromRound}
					{setCurrentRound}
				/>
			{/if}
		</div>
	{:else}
		<div
			class="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 sm:h-40 dark:border-gray-700 dark:bg-gray-800/50"
		>
			{#if !readOnly}
				<RefreshCw class="mb-2 h-8 w-8 text-gray-400 sm:h-10 sm:w-10" />
			{/if}
			{#if !readOnly}
				<h3 class="mb-1 text-xs font-medium text-gray-700 sm:text-sm dark:text-gray-300">
					No matches generated
				</h3>

				<p class="text-xs text-gray-500 dark:text-gray-400">
					Click "Generate Matches" to create the tournament schedule
				</p>
			{:else}
				<p class="text-xs text-gray-500 dark:text-gray-400">
					No matches available. Please contact the tournament organizer.
				</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.scrollbar-thin::-webkit-scrollbar {
		height: 6px;
	}

	@media (min-width: 640px) {
		.scrollbar-thin::-webkit-scrollbar {
			height: 8px;
		}
	}

	.scrollbar-thin::-webkit-scrollbar-track {
		background: transparent;
	}

	.scrollbar-thin::-webkit-scrollbar-thumb {
		background-color: rgb(209, 213, 219);
		border-radius: 20px;
	}

	:global(.default-team-row) {
		background-color: rgba(253, 224, 71, 0.15) !important;
		border-left: 3px solid rgb(253, 224, 71) !important;
	}

	@media (min-width: 640px) {
		:global(.default-team-row) {
			border-left: 4px solid rgb(253, 224, 71) !important;
		}
	}

	:global(.dark .default-team-row) {
		background-color: rgba(253, 224, 71, 0.05) !important;
		border-left: 3px solid rgb(202, 179, 57) !important;
	}

	@media (min-width: 640px) {
		:global(.dark .default-team-row) {
			border-left: 4px solid rgb(202, 179, 57) !important;
		}
	}

	:global(Button:focus-visible) {
		outline: 2px solid rgb(16 185 129 / 0.5);
		outline-offset: 2px;
	}

	/* Enhanced button animations */
	:global(.group:hover .plus-icon) {
		transform: scale(1.1) rotate(90deg);
	}

	/* Subtle pulse animation for add buttons */
	@keyframes subtle-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.8;
		}
	}

	:global(.add-match-btn:hover) {
		animation: subtle-pulse 2s ease-in-out infinite;
	}

	/* Custom focus styles for better accessibility */
	:global(.add-round-btn:focus-visible) {
		outline: 3px solid rgb(16 185 129 / 0.5);
		outline-offset: 2px;
	}

	/* Loading state for add round button */
	:global(.add-round-loading) {
		pointer-events: none;
		opacity: 0.7;
	}

	:global(.add-round-loading .plus-circle) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* Enhanced mobile scrollbar visibility */
	@media (max-width: 768px) {
		.scrollbar-thin::-webkit-scrollbar {
			height: 8px;
		}

		.scrollbar-thin::-webkit-scrollbar-thumb {
			background-color: rgb(156, 163, 175);
		}
	}
</style>
