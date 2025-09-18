import type { MatchesSupabaseDatabaseService } from '$lib/database/matches';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Base } from './base';
import type { Brackets } from './brackets/brackets.svelte';
import { Event } from '$lib/event.svelte';
import { Match } from './match.svelte';
import { MatchSupabaseDatabaseService } from './database/match';
import { Team } from './team.svelte';

/**
 * The Matches class represents the matches in a tournament.
 * It provides methods to load, create, update, and manage matches.
 */
export class Matches extends Base {
	public databaseService: MatchesSupabaseDatabaseService;
	event_id?: number;
	matches = $state<Match[]>([]);
	subscriptionStatus = $state();
	type = 'pool';

	constructor(databaseService: MatchesSupabaseDatabaseService) {
		super();
		this.databaseService = databaseService;
	}

	/**
	 * Loads matches for the specified event ID and match type.
	 *
	 * @param {number} id - The ID of the event.
	 * @returns {Promise<Matches>} - A promise resolving to the updated Matches instance.
	 */
	async load(id: number): Promise<Matches> {
		try {
			const res = await this.databaseService.load(id, {
				column: 'type',
				operator: 'eq',
				value: this.type
			});
			this.event_id = id;

			const matchSupabaseDatabaseService = new MatchSupabaseDatabaseService(
				this.databaseService.supabaseClient
			);
			const matches: Match[] = [];
			if (res) {
				for (let i = 0; i < res.length; i++) {
					let match = new Match(matchSupabaseDatabaseService);

					const matchRow = res[i];
					if (matchRow) Object.assign(match, matchRow);
					matches.push(match);
				}
				this.matches = matches;
			}
		} catch (err) {
			this.handleError(500, `Failed to load matches: ${(err as Error).message}`);
		}
		return this;
	}

	/**
	 * Handles real-time updates from Supabase subscriptions.
	 *
	 * @param {Matches | Brackets} self - Instance of Matches or Brackets to update.
	 * @param {RealtimePostgresChangesPayload<Record<string, unknown>>} payload - Supabase change payload.
	 * @returns {Promise<void>} - Resolves after handling the update.
	 */
	async handleUpdate(
		self: Matches | Brackets,
		payload: RealtimePostgresChangesPayload<Record<string, unknown>>
	): Promise<void> {
		if (!self.event_id) {
			throw new Error('Event ID is required to handle updates.');
		}

		const old = payload.old as MatchRow;
		const updated = payload.new as MatchRow;

		// If updating for another type of match, ignore it
		if (self.type !== updated.type) return;

		if (payload.eventType === 'INSERT') {
			const matchSupabaseDatabaseService = new MatchSupabaseDatabaseService(
				self.databaseService.supabaseClient
			);
			const newMatchInstance = new Match(matchSupabaseDatabaseService);
			Object.assign(newMatchInstance, updated);

			self.matches.push(newMatchInstance);

			return;
		}

		if (import.meta.env.DEV) {
			console.info(`handleUpdate: ${JSON.stringify(payload)}`);
		}

		if (self.type === 'bracket') {
			await self.load(self.event_id);
			(self as Brackets).nextRound(updated);
		}

		if (!self.matches) {
			await self.load(self.event_id);
			return;
		}

		let updatedMatch = self.matches.find((m: Match) => m.id === old.id);

		if (updatedMatch && updatedMatch.id) {
			// Update match directly from realtime payload
			Object.assign(updatedMatch, updated);
		} else {
			self.handleError(
				400,
				`Failed to find match to update for payload: ${JSON.stringify(payload)}`
			);
		}
	}

	/**
	 * Subscribes to live changes for matches belonging to the current event.
	 *
	 * @returns {Promise<RealtimeChannel>} - Promise resolving with the Supabase real-time channel.
	 */
	async subscribeToMatches(): Promise<RealtimeChannel> {
		if (!this.event_id) {
			throw new Error('Event ID is required to subscribe to matches.');
		}

		const channel = await this.databaseService.subscribeToChanges(
			this,
			this.handleUpdate,
			'matches',
			`event_id=eq.${this.event_id}`
		);
		this.subscriptionStatus = channel.state;
		return channel;
	}

	/**
	 * Creates a new set of matches for the given event using the configured structure.
	 *
	 * @param {Event | Partial<EventRow>} eventDetails - Tournament setup configuration.
	 * @param {Team[]} teams - Participating teams.
	 * @returns {Promise<Matches | undefined>} - Returns the Matches instance or undefined if creation fails.
	 */
	async create(
		{ pools = 0, courts, refs = 'provided' }: Event | Partial<EventRow>,
		teams: Team[]
	): Promise<Matches | undefined> {
		if (!this.event_id) {
			this.handleError(400, 'Event ID is required to create matches.');
			return;
		}

		try {
			if (!teams || teams.length <= 1) {
				this.handleError(400, "Can't generate matches without Teams");
				return;
			}

			if (!pools || pools <= 0) {
				this.handleError(400, "Can't generate matches without Pools");
				return;
			}

			if (!courts || courts <= 0) {
				this.handleError(400, "Can't generate matches without courts");
				return;
			}

			if (teams.length <= 2 && refs === 'teams') {
				this.handleError(400, 'Cannot have refs with less than 3 teams');
				return;
			}

			await this.databaseService.deleteMatchesByEvent(this.event_id);

			// Total rounds should be the maximum number of rounds needed to ensure each team plays the desired number of games
			const totalRounds = Math.floor(teams.length * (pools / (teams.length - 1)));
			let rounds = this.calculateMatches(teams, [], 0, totalRounds, pools);

			let matches = this.calculateCourtsAndRounds(rounds, courts, teams, refs ?? 'provided');

			const res = await this.databaseService.insertMatches(matches);
			const matchSupabaseDatabaseService = new MatchSupabaseDatabaseService(
				this.databaseService.supabaseClient
			);

			const matchInstances: Match[] = [];
			if (res) {
				for (let i = 0; i < res.length; i++) {
					let match = new Match(matchSupabaseDatabaseService);

					const matchRow = res[i];
					matchInstances.push(Object.assign(match, matchRow));
				}
				this.matches = matchInstances;
			}

			return this;
		} catch (err) {
			this.handleError(500, err instanceof Error ? err.message : (err as string));
		}
	}

	/**
	 * Allocates matches to courts and optionally assigns referees.
	 *
	 * @param {[number, number][][]} rounds - Match pairings per round.
	 * @param {number} courts - Total number of available courts.
	 * @param {Partial<TeamRow>[]} teams - Team data.
	 * @param {string} refs - Referee assignment type ('provided' | 'teams').
	 * @returns {Partial<MatchRow>[]} - List of match rows ready for insertion.
	 */
	protected calculateCourtsAndRounds(
		rounds: [number, number][][],
		courts: number,
		teams: Partial<TeamRow>[],
		refs: string = 'provided'
	): Partial<MatchRow>[] {
		const activeTeamIds = teams.filter((t) => t.id && t.name !== 'bye').map((t) => t.id!);

		if (refs === 'teams') {
			return this.calculateMatchesWithBalancedRefs(rounds, courts, activeTeamIds);
		} else {
			return this.calculateMatchesWithoutRefs(rounds, courts);
		}
	}

	/**
	 * Calculate matches without referee assignments
	 */
	private calculateMatchesWithoutRefs(
		rounds: [number, number][][],
		courts: number
	): Partial<MatchRow>[] {
		const matches: Partial<MatchRow>[] = [];
		let courtNumber = 0;
		let scheduleRoundNumber = 0;

		rounds.forEach((round: [number, number][]) => {
			round.forEach((match: [number, number]) => {
				if (match) {
					matches.push({
						team1: match[0],
						team2: match[1],
						round: scheduleRoundNumber,
						court: courtNumber,
						event_id: this.event_id
					});

					courtNumber = (courtNumber + 1) % courts;
					if (courtNumber === 0) {
						scheduleRoundNumber++;
					}
				}
			});
		});

		return matches;
	}

	/**
	 * Calculate matches with balanced referee assignments
	 */
	private calculateMatchesWithBalancedRefs(
		rounds: [number, number][][],
		courts: number,
		activeTeamIds: number[]
	): Partial<MatchRow>[] {
		const allMatches = this.createAllMatches(rounds);

		const scheduledMatches = this.assignRoundAndCourtNumbers(allMatches, courts);
		const refereeCounts = new Map<number, number>();

		activeTeamIds.forEach((teamId) => {
			refereeCounts.set(teamId, 0);
		});

		const matchesByRound = new Map<number, Partial<MatchRow>[]>();
		scheduledMatches.forEach((match) => {
			const round = match.round!;
			if (!matchesByRound.has(round)) {
				matchesByRound.set(round, []);
			}
			matchesByRound.get(round)!.push(match);
		});

		const lastRefRound = new Map<number, number>();

		for (const [round, roundMatches] of matchesByRound.entries()) {
			const playingTeams = new Set<number>();
			roundMatches.forEach((match) => {
				if (match.team1) playingTeams.add(match.team1);
				if (match.team2) playingTeams.add(match.team2);
			});

			const availableRefs = activeTeamIds.filter((id) => !playingTeams.has(id));
			if (availableRefs.length === 0) {
				throw new Error(`No available referees for round ${round}`);
			}

			const selectedRef = this.selectBalancedReferee(
				availableRefs,
				refereeCounts,
				round,
				lastRefRound
			);

			lastRefRound.set(selectedRef, round);
			roundMatches.forEach((match) => {
				match.ref = selectedRef;
			});

			refereeCounts.set(selectedRef, refereeCounts.get(selectedRef)! + roundMatches.length);
		}

		return scheduledMatches;
	}

	/**
	 * Create all match objects without referee assignments
	 */
	private createAllMatches(rounds: [number, number][][]): Partial<MatchRow>[] {
		const matches: Partial<MatchRow>[] = [];

		rounds.forEach((round: [number, number][]) => {
			round.forEach((match: [number, number]) => {
				if (match) {
					matches.push({
						team1: match[0],
						team2: match[1],
						event_id: this.event_id
					});
				}
			});
		});

		return matches;
	}

	/**
	 * Select referee using balanced algorithm
	 */
	selectBalancedReferee(
		availableRefs: number[],
		refereeCounts: Map<number, number>,
		round: number,
		lastRefRound: Map<number, number>
	): number {
		const MIN_TEAMS_FOR_REF_GAP = 5;

		let refsToChoose = availableRefs;

		if (availableRefs.length >= MIN_TEAMS_FOR_REF_GAP) {
			const filtered = availableRefs.filter((id) => lastRefRound.get(id) !== round - 1);

			if (filtered.length > 0) {
				refsToChoose = filtered;
			}
		}

		refsToChoose.sort((a, b) => {
			const countDiff = refereeCounts.get(a)! - refereeCounts.get(b)!;
			return countDiff !== 0 ? countDiff : a - b;
		});

		return refsToChoose[0];
	}

	/**
	 * Assign round and court numbers to matches
	 */
	private assignRoundAndCourtNumbers(
		matches: Partial<MatchRow>[],
		courts: number
	): Partial<MatchRow>[] {
		matches.forEach((match, index) => {
			match.round = Math.floor(index / courts);
			match.court = index % courts;
		});

		return matches;
	}

	/**
	 * Generates round-robin matchups with optional bye and total match constraints.
	 *
	 * @param {Team[]} teams - Teams participating.
	 * @param {[number, number][][]} rounds - Accumulated round data.
	 * @param {number} round - Current round index.
	 * @param {number} totalRounds - Target number of rounds.
	 * @param {number} maxGames - Maximum games each team should play.
	 * @returns {[number, number][][]} - A 2D array of match pairings per round.
	 */
	protected calculateMatches(
		teams: Team[],
		rounds: [number, number][][] = [],
		round: number = 0,
		totalRounds: number,
		maxGames: number
	): [number, number][][] {
		// Add bye team for odd number of teams
		const workingTeams = [...teams];
		if (workingTeams.length % 2 !== 0) {
			workingTeams.push({ id: 0, name: 'bye' } as Team);
		}

		// Use balanced round-robin algorithm
		return this.generateBalancedRoundRobin(workingTeams, maxGames);
	}

	/**
	 * Creates a balanced round-robin schedule, attempting fair play distribution.
	 *
	 * @param {Team[]} teams - List of teams.
	 * @param {number} maxGames - Max number of games each team can play.
	 * @returns {[number, number][][]} - Schedule grouped into rounds.
	 */
	private generateBalancedRoundRobin(teams: Team[], maxGames: number): [number, number][][] {
		const rounds: [number, number][][] = [];
		const teamGames = new Map<number, number>();
		const playedMatches = new Set<string>();

		// Initialize game counts
		teams.forEach((team) => {
			if (team.id && team.name !== 'bye') {
				teamGames.set(team.id, 0);
			}
		});

		// Generate all possible matchups
		const allMatchups: [number, number][] = [];
		for (let i = 0; i < teams.length; i++) {
			for (let j = i + 1; j < teams.length; j++) {
				const team1 = teams[i];
				const team2 = teams[j];

				if (team1.name !== 'bye' && team2.name !== 'bye') {
					allMatchups.push([team1.id!, team2.id!]);
				}
			}
		}

		// Schedule matches using balanced approach
		while (this.hasTeamsNeedingGames(teamGames, maxGames)) {
			const roundMatches = this.scheduleBalancedRound(
				allMatchups,
				teamGames,
				playedMatches,
				maxGames
			);

			if (roundMatches.length === 0) {
				break; // No more valid matches can be scheduled
			}

			rounds.push(roundMatches);
		}

		return rounds;
	}

	/**
	 * Check if any teams still need more games
	 */
	private hasTeamsNeedingGames(teamGames: Map<number, number>, maxGames: number): boolean {
		return Array.from(teamGames.values()).some((count) => count < maxGames);
	}

	/**
	 * Schedule a balanced round of matches
	 */
	private scheduleBalancedRound(
		allMatchups: [number, number][],
		teamGames: Map<number, number>,
		playedMatches: Set<string>,
		maxGames: number
	): [number, number][] {
		const roundMatches: [number, number][] = [];
		const usedTeams = new Set<number>();

		// Sort matchups by priority (teams with fewer games first)
		const prioritizedMatchups = allMatchups
			.filter(([team1, team2]) => {
				const matchKey = `${Math.min(team1, team2)}-${Math.max(team1, team2)}`;
				return (
					!playedMatches.has(matchKey) &&
					teamGames.get(team1)! < maxGames &&
					teamGames.get(team2)! < maxGames
				);
			})
			.sort(([a1, a2], [b1, b2]) => {
				const priorityA = teamGames.get(a1)! + teamGames.get(a2)!;
				const priorityB = teamGames.get(b1)! + teamGames.get(b2)!;
				return priorityA - priorityB;
			});

		// Schedule matches for this round
		for (const [team1, team2] of prioritizedMatchups) {
			if (!usedTeams.has(team1) && !usedTeams.has(team2)) {
				roundMatches.push([team1, team2]);
				usedTeams.add(team1);
				usedTeams.add(team2);

				// Update game counts and played matches
				teamGames.set(team1, teamGames.get(team1)! + 1);
				teamGames.set(team2, teamGames.get(team2)! + 1);

				const matchKey = `${Math.min(team1, team2)}-${Math.max(team1, team2)}`;
				playedMatches.add(matchKey);
			}
		}

		if (roundMatches.length === 0 && this.hasTeamsNeedingGames(teamGames, maxGames)) {
			const rematchCandidates = allMatchups
				.filter(([team1, team2]) => {
					return (
						!usedTeams.has(team1) &&
						!usedTeams.has(team2) &&
						teamGames.get(team1)! < maxGames &&
						teamGames.get(team2)! < maxGames
					);
				})
				.sort(([a1, a2], [b1, b2]) => {
					const priorityA = teamGames.get(a1)! + teamGames.get(a2)!;
					const priorityB = teamGames.get(b1)! + teamGames.get(b2)!;
					return priorityA - priorityB;
				});

			for (const [team1, team2] of rematchCandidates) {
				if (!usedTeams.has(team1) && !usedTeams.has(team2)) {
					roundMatches.push([team1, team2]);
					usedTeams.add(team1);
					usedTeams.add(team2);

					teamGames.set(team1, teamGames.get(team1)! + 1);
					teamGames.set(team2, teamGames.get(team2)! + 1);
				}
			}
		}

		return roundMatches;
	}

	/**
	 * Determine the referee for a given match.
	 * @param {number[]} teamsPlayingThisRound - The IDs of the teams playing in this round.
	 * @param {number[]} allTeams - The IDs of all teams in the event.
	 * @param {{ [teamId: number]: number }} refereeCounts - The counts of how many times each team has refereed.
	 * @param {number[]} recentRefs - The list of recently used referees.
	 * @returns {number} - The ID of the selected referee.
	 */
	determineReferee(
		teamsPlayingThisRound: number[],
		allTeams: number[],
		refereeCounts: { [teamId: number]: number },
		recentRefs: number[]
	): number {
		// Filter out teams already playing in the current round
		let availableTeams = allTeams.filter((team) => !teamsPlayingThisRound.includes(team));

		if (availableTeams.length === 0) {
			throw new Error(
				'No available teams to assign as referees, too many courts for the number of teams?'
			);
		}

		// Further filter out teams that have recently refereed
		availableTeams = availableTeams.filter((team) => !recentRefs.includes(team));

		// If no teams are left after filtering, reset availableTeams
		if (availableTeams.length === 0) {
			availableTeams = allTeams.filter((team) => !teamsPlayingThisRound.includes(team));
		}

		// Sort available teams by the number of times they have refereed, ascending
		availableTeams.sort((a, b) => refereeCounts[a] - refereeCounts[b]);

		return availableTeams[0];
	}

	/**
	 * Get statistics to evaluate match and referee balance.
	 *
	 * @returns {Object} An object with balance data and flags:
	 * - `playingBalance`: Array of `{ teamId, gamesPlayed }`
	 * - `refereeBalance`: Array of `{ teamId, refCount }`
	 * - `isPlayingBalanced`: Whether all teams played a balanced number of games
	 * - `isRefereeBalanced`: Whether all teams refereed a balanced number of games
	 */
	getBalanceStatistics(): {
		playingBalance: { teamId: number; gamesPlayed: number }[];
		refereeBalance: { teamId: number; refCount: number }[];
		isPlayingBalanced: boolean;
		isRefereeBalanced: boolean;
	} {
		const playingCounts = new Map<number, number>();
		const refereeCounts = new Map<number, number>();

		// Count games played
		this.matches.forEach((match) => {
			if (match.team1) {
				playingCounts.set(match.team1, (playingCounts.get(match.team1) || 0) + 1);
			}
			if (match.team2) {
				playingCounts.set(match.team2, (playingCounts.get(match.team2) || 0) + 1);
			}
			if (match.ref) {
				refereeCounts.set(match.ref, (refereeCounts.get(match.ref) || 0) + 1);
			}
		});

		const playingBalance = Array.from(playingCounts.entries()).map(([teamId, gamesPlayed]) => ({
			teamId,
			gamesPlayed
		}));

		const refereeBalance = Array.from(refereeCounts.entries()).map(([teamId, refCount]) => ({
			teamId,
			refCount
		}));

		// Check balance
		const playingCounts_array = Array.from(playingCounts.values());
		const refereeCounts_array = Array.from(refereeCounts.values());

		const isPlayingBalanced =
			playingCounts_array.length === 0 ||
			Math.max(...playingCounts_array) - Math.min(...playingCounts_array) <= 1;

		const isRefereeBalanced =
			refereeCounts_array.length === 0 ||
			Math.max(...refereeCounts_array) - Math.min(...refereeCounts_array) <= 1;

		return {
			playingBalance,
			refereeBalance,
			isPlayingBalanced,
			isRefereeBalanced
		};
	}

	/**
	 * Delete all matches for the current event.
	 */
	async deleteAllMatches() {
		console.info('deleteAllMatches');
		if (!this.event_id) {
			this.handleError(400, 'Event ID is required to delete all matches.');
			return;
		}

		await this.databaseService.deleteMatchesByEvent(this.event_id);
		this.matches = [];
	}

	/**
	 * Delete all matches in a specific round.
	 * @param {number} round - The round number to delete.
	 */
	async deleteRound(round: number) {
		console.info(`deleteRound: ${round}`);
		if (!this.event_id) {
			this.handleError(400, 'Event ID is required to delete round.');
			return;
		}

		await this.databaseService.deleteMatchesByRound(this.event_id, round);
		// Remove matches from local state
		this.matches = this.matches.filter(match => match.round !== round);
	}

	/**
	 * Delete all matches from a specific round onwards.
	 * @param {number} fromRound - The round number to start deleting from (inclusive).
	 */
	async deleteFromRound(fromRound: number) {
		console.info(`deleteFromRound: ${fromRound}`);
		if (!this.event_id) {
			this.handleError(400, 'Event ID is required to delete rounds.');
			return;
		}

		await this.databaseService.deleteMatchesFromRound(this.event_id, fromRound);
		// Remove matches from local state
		this.matches = this.matches.filter(match => (match.round ?? 0) < fromRound);
	}
}

// Test cases for the Matches class
if (import.meta.vitest) {
	const { describe, vi, it, expect, beforeEach } = import.meta.vitest;

	describe('Matches.create', () => {
		let matches: Matches;
		let mockDatabaseService: any;

		beforeEach(() => {
			mockDatabaseService = {
				deleteMatchesByEvent: vi.fn(),
				insertMatches: vi.fn((matches: Partial<MatchRow>[]) => matches),
				load: vi.fn(() => [])
			};

			matches = new Matches(mockDatabaseService);
			matches.event_id = 1; // Set a valid event ID
		});

		it('should create the correct number of matches for even number of teams', async () => {
			const teams: Team[] = [
				{ id: 1, name: 'Team 1' },
				{ id: 2, name: 'Team 2' },
				{ id: 3, name: 'Team 3' },
				{ id: 4, name: 'Team 4' }
			].map((t) => {
				const teamInstance = new Team(mockDatabaseService);
				return Object.assign(teamInstance, t);
			});

			await matches.create({ pools: 3, courts: 1 }, teams);

			// Check that each team plays 3 matches (since pools = 3)
			const matchCounts: { [teamId: number]: number } = {};
			matches.matches.forEach((match) => {
				expect(match.team1).not.undefined;
				expect(match.team2).not.undefined;

				if (match.team1 && match.team2) {
					if (typeof match.team1 === 'number') {
						if (typeof match.team1 === 'number') {
							matchCounts[match.team1] = (matchCounts[match.team1] || 0) + 1;
						}
					}
					matchCounts[match.team2] = (matchCounts[match.team2] || 0) + 1;
				}
			});

			Object.keys(matchCounts).forEach((teamId) => {
				expect(matchCounts[parseInt(teamId)]).toEqual(3);
			});
		});

		it('should create the correct number of matches for odd number of teams with a bye', async () => {
			/*Let's say you have teams A, B, and C.
			Without a Bye:

				Match 1: A vs. B
				Match 2: A vs. C
				Match 3: B vs. C

			Each team plays 2 matches. This is the standard 3-team round-robin format.
			*/
			const teams: Team[] = [
				{ id: 1, name: 'Team 1' },
				{ id: 2, name: 'Team 2' },
				{ id: 3, name: 'Team 3' }
			].map((t) => {
				const teamInstance = new Team(mockDatabaseService);
				return Object.assign(teamInstance, t);
			});

			await matches.create({ pools: 2, courts: 1 }, teams);

			// Check that each team plays 2 matches
			const matchCounts: { [teamId: number]: number } = {};
			matches.matches.forEach((match) => {
				expect(match.team1).not.undefined;
				expect(match.team2).not.undefined;

				if (match.team1 && match.team2) {
					matchCounts[match.team1] = (matchCounts[match.team1] || 0) + 1;
					matchCounts[match.team2] = (matchCounts[match.team2] || 0) + 1;
				}
			});

			Object.keys(matchCounts).forEach((teamId) => {
				expect(matchCounts[parseInt(teamId)]).toEqual(2);
			});
		});

		it('should not allow a team to play the same team twice unless necessary', async () => {
			const teams: Team[] = [
				{ id: 1, name: 'Team 1' },
				{ id: 2, name: 'Team 2' },
				{ id: 3, name: 'Team 3' },
				{ id: 4, name: 'Team 4' }
			].map((t) => {
				const teamInstance = new Team(mockDatabaseService);
				return Object.assign(teamInstance, t);
			});

			await matches.create({ pools: 3, courts: 2 }, teams);

			// Ensure that no team plays the same opponent twice
			const playedMatches = new Set<string>();
			matches.matches.forEach((match) => {
				const matchKey = `${match.team1}-${match.team2}`;
				const reverseMatchKey = `${match.team2}-${match.team1}`;
				expect(playedMatches.has(matchKey)).toBe(false);
				expect(playedMatches.has(reverseMatchKey)).toBe(false);
				playedMatches.add(matchKey);
				playedMatches.add(reverseMatchKey);
			});
		});

		it('should correctly schedule matches for 11 teams', async () => {
			const teams: Team[] = [
				{ id: 1, name: 'Team 1' },
				{ id: 2, name: 'Team 2' },
				{ id: 3, name: 'Team 3' },
				{ id: 4, name: 'Team 4' },
				{ id: 5, name: 'Team 5' },
				{ id: 6, name: 'Team 6' },
				{ id: 7, name: 'Team 7' },
				{ id: 8, name: 'Team 8' },
				{ id: 9, name: 'Team 9' },
				{ id: 10, name: 'Team 10' },
				{ id: 11, name: 'Team 11' }
			].map((t) => {
				const teamInstance = new Team(mockDatabaseService);
				return Object.assign(teamInstance, t);
			});

			await matches.create({ pools: 3, courts: 2 }, teams);

			// Ensure that no team plays the same opponent twice
			const playedMatches = new Set<string>();
			matches.matches.forEach((match) => {
				const matchKey = `${match.team1}-${match.team2}`;
				const reverseMatchKey = `${match.team2}-${match.team1}`;
				expect(playedMatches.has(matchKey)).toBe(false);
				expect(playedMatches.has(reverseMatchKey)).toBe(false);
				playedMatches.add(matchKey);
				playedMatches.add(reverseMatchKey);
			});

			const matchCounts: { [key: number]: number } = {};
			matches.matches.forEach((match) => {
				// @ts-ignore
				matchCounts[match.team1] = (matchCounts[match.team1] || 0) + 1;
				// @ts-ignore
				matchCounts[match.team2] = (matchCounts[match.team2] || 0) + 1;
			});

			// Assert balance rather than absolute number
			const counts = Object.values(matchCounts);
			const min = Math.min(...counts);
			const max = Math.max(...counts);

			expect(max - min).toBeLessThanOrEqual(1);
		});

		it('should set ref event when not all courts are used', async () => {
			const teams: Team[] = [
				{ id: 1, name: 'Team 1' },
				{ id: 2, name: 'Team 2' },
				{ id: 3, name: 'Team 3' },
				{ id: 4, name: 'Team 4' },
				{ id: 5, name: 'Team 5' },
				{ id: 6, name: 'Team 6' },
				{ id: 7, name: 'Team 7' },
				{ id: 8, name: 'Team 8' },
				{ id: 9, name: 'Team 9' }
			].map((t) => {
				const teamInstance = new Team(mockDatabaseService);
				return Object.assign(teamInstance, t);
			});

			await matches.create({ pools: 4, courts: 3, refs: 'teams' }, teams);

			// Ensure that no team plays the same opponent twice
			matches.matches.forEach((match) => {
				expect(match.ref).toBeDefined();
			});
		});
	});
}
