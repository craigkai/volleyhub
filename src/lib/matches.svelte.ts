import type { MatchesSupabaseDatabaseService } from '$lib/database/matches';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Base } from './base';
import type { Brackets } from './brackets/brackets.svelte';
import { Event } from '$lib/event.svelte';
import { Match } from './match.svelte';
import { MatchSupabaseDatabaseService } from './database/match';
import { Team } from './team.svelte';
import List from './list';

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
	 * Load matches from the database.
	 * @param {number} id - The ID of the event.
	 * @returns {Promise<Matches>} - Returns a promise that resolves to the Matches instance.
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
	 * Handle updates from the database via real-time subscriptions.
	 * @param {Matches | Brackets} self - The instance of the class that handles the update.
	 * @param {RealtimePostgresChangesPayload<{ [key: string]: any }>} payload - The payload from the real-time subscription.
	 */
	async handleUpdate(
		self: Matches | Brackets,
		payload: RealtimePostgresChangesPayload<{ [key: string]: any }>
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
				this.databaseService.supabaseClient
			);
			const newMatchInstance = new Match(matchSupabaseDatabaseService);

			self.matches.push(newMatchInstance);

			return;
		}

		console.info(`handleUpdate: ${JSON.stringify(payload)}`);

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
			// Existing match, update it
			await updatedMatch.load(updatedMatch.id);
			updatedMatch = updatedMatch;
		} else {
			self.handleError(
				400,
				`Failed to find match to update for payload: ${JSON.stringify(payload)}`
			);
		}
	}

	/**
	 * Subscribe to real-time updates for matches.
	 * @returns {Promise<RealtimeChannel>} - Returns a promise that resolves to the real-time channel.
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
	 * Create matches for the event.
	 * @param {Event | Partial<EventRow>} eventDetails - The details of the event.
	 * @param {TeamRow[] | Partial<TeamRow>[]} teams - The teams participating in the event.
	 * @returns {Promise<Matches | undefined>} - Returns a promise that resolves to the Matches instance.
	 */
	async create(
		{ pools, courts, refs = 'provided' }: Event | Partial<EventRow>,
		teams: Team[]
	): Promise<Matches | undefined> {
		if (!this.event_id) {
			this.handleError(400, 'Event ID is required to create matches.');
			return;
		}

		try {
			this.validateInputs(teams, pools, courts, refs);

			await this.databaseService.deleteMatchesByEvent(this.event_id);

			if (teams.length % 2) {
				teams.push({
					id: 0,
					name: 'bye'
				} as unknown as Team);
			}

			let matches = this.calculateCourtsAndRounds(
				this.calculateMatches(teams, [], 0, pools ?? 0),
				courts as number,
				teams
			);

			const res = await this.databaseService.insertMatches(matches);
			const matchSupabaseDatabaseService = new MatchSupabaseDatabaseService(
				this.databaseService.supabaseClient
			);

			const matchInstances: Match[] = [];
			if (res) {
				for (let i = 0; i < res.length; i++) {
					let match = new Match(matchSupabaseDatabaseService);

					const matchRow = res[i];

					try {
						await match.load(matchRow.id);

						matchInstances.push(match);
					} catch (err: any) {
						this.handleError(500, `Failed to load match ${err}`);
					}
				}
				this.matches = matchInstances;
			}

			return this;
		} catch (err) {
			this.handleError(500, err instanceof Error ? err.message : (err as string));
		}
	}

	/**
	 * Validate the inputs for creating matches.
	 * @param {TeamRow[] | Partial<TeamRow>[]} teams - The teams participating in the event.
	 * @param {number | undefined | null} pools - The number of pools.
	 * @param {number | undefined | null} courts - The number of courts.
	 * @param {string | undefined | null} refs - The type of referees.
	 */
	validateInputs(
		teams: TeamRow[] | Partial<TeamRow>[],
		pools: number | undefined | null,
		courts: number | undefined | null,
		refs: string | undefined | null
	) {
		if (!teams || teams.length <= 1) {
			this.handleError(400, "Can't generate matches without Teams");
		}

		if (!pools || pools <= 0) {
			this.handleError(400, "Can't generate matches without Pools");
		}

		if (!courts || courts <= 0) {
			this.handleError(400, "Can't generate matches without courts");
		}

		if (teams.length <= 2 && refs === 'teams') {
			this.handleError(400, 'Cannot have refs with less than 3 teams');
		}
	}

	/**
	 * Calculate the matches for the event.
	 * @param {Team[]} teams - The teams participating in the event.
	 * @param {any[]} rounds - The existing rounds of matches.
	 * @param {number} round - The current round number.
	 * @param {number} totalRounds - The total number of rounds to be played.
	 * @returns {[number, number][][]} - Returns an array of rounds, each containing pairs of team IDs.
	 */
	protected calculateMatches(
		teams: Team[],
		rounds: any = [],
		round: number = 0,
		totalRounds: number
	): [number, number][][] {
		if (round === totalRounds) return rounds;

		// Ensure we shuffle teams every round to prevent repeat matchups
		const shuffledTeams = List.lockedRotate(teams);

		const matchesForThisRound = [];
		const pairedTeams = new Set<number>();

		for (let i = 0; i < shuffledTeams.length; i++) {
			const team1 = shuffledTeams[i];
			if (pairedTeams.has(team1.id!)) continue;

			// Find an opponent who hasn't been paired yet this round
			let opponentIndex = i + 1;
			while (
				opponentIndex < shuffledTeams.length &&
				pairedTeams.has(shuffledTeams[opponentIndex].id!)
			) {
				opponentIndex++;
			}

			if (opponentIndex < shuffledTeams.length) {
				const opponent = shuffledTeams[opponentIndex];
				if (opponent.name !== 'bye' && team1.name !== 'bye') {
					// Ensure unique pairing by adding teams to the paired set
					pairedTeams.add(team1.id!);
					pairedTeams.add(opponent.id!);

					matchesForThisRound.push(round % 2 ? [team1.id, opponent.id] : [opponent.id, team1.id]);
				}
			}
		}

		rounds.push(matchesForThisRound);
		return this.calculateMatches(shuffledTeams, rounds, ++round, totalRounds);
	}

	/**
	 * Calculate the court assignments and rounds for the matches.
	 * Assign referees based on the team availability and previous assignments.
	 * @param {[number, number][][]} rounds - The rounds of matches to be scheduled.
	 * @param {number} courts - The number of available courts.
	 * @param {Partial<TeamRow>[]} teams - The teams participating in the event.
	 * @returns {Partial<MatchRow>[]} - Returns an array of match rows with court assignments and referee assignments.
	 */
	protected calculateCourtsAndRounds(
		rounds: [number, number][][],
		courts: number,
		teams: Partial<TeamRow>[]
	): Partial<MatchRow>[] {
		let courtNumber = 0;
		const matches: Partial<MatchRow>[] = [];

		// Track referee counts and recent assignments
		const refereeCounts: { [teamId: number]: number } = {};
		const recentRefs: number[] = [];

		// Initialize referee counts for each team
		teams.forEach((team) => {
			if (team.id !== undefined && team.name !== 'bye') {
				refereeCounts[team.id] = 0;
			}
		});

		// Track teams that have already played each other
		const playedMatches = new Set<string>();

		let scheduleRoundNumber = 0;
		let matchesThisRound: Partial<MatchRow>[] = [];

		rounds.forEach((round: [number, number][]) => {
			const teamsPlayingThisRound = new Set<number>();

			round.forEach((match: [number, number]) => {
				if (match) {
					const [team1, team2] = match;

					// Create a unique key for this match to check for duplicate matchups
					const matchKey = `${team1}-${team2}`;
					const reverseMatchKey = `${team2}-${team1}`;

					if (
						teamsPlayingThisRound.has(team1) ||
						teamsPlayingThisRound.has(team2) ||
						playedMatches.has(matchKey) ||
						playedMatches.has(reverseMatchKey)
					) {
						// Skip this match if either team is already playing in this round or they have already played against each other
						return;
					}

					teamsPlayingThisRound.add(team1);
					teamsPlayingThisRound.add(team2);

					const newMatch: Partial<MatchRow> = {
						team1,
						team2,
						round: scheduleRoundNumber,
						court: courtNumber,
						event_id: this.event_id
					};

					matches.push(newMatch);
					matchesThisRound.push(newMatch);

					// Mark this match as played
					playedMatches.add(matchKey);

					courtNumber = (courtNumber + 1) % courts;
					if (courtNumber === 0) {
						// When we run out of courts, increment the round
						scheduleRoundNumber++;

						const ref = this.determineReferee(
							Array.from(teamsPlayingThisRound),
							teams.map((t) => t.id!).filter((id) => id !== 0),
							refereeCounts,
							recentRefs
						);

						// Assign the referee to each match
						matchesThisRound.forEach((match) => {
							match.ref = ref;
						});

						// Clear the round-specific data
						matchesThisRound = [];
						teamsPlayingThisRound.clear();

						// Update referee counts and recent refs
						if (ref !== -1) {
							refereeCounts[ref]++;
							recentRefs.push(ref);

							if (recentRefs.length > teams.length - 1) {
								recentRefs.shift();
							}
						}
					}
				}
			});
		});

		return matches;
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
					matchCounts[match.team1] = (matchCounts[match.team1] || 0) + 1;
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

		// 	it('should not allow a team to play the same team twice unless necessary', async () => {
		// 		const teams: Team[] = [
		// 			{ id: 1, name: 'Team 1' },
		// 			{ id: 2, name: 'Team 2' },
		// 			{ id: 3, name: 'Team 3' },
		// 			{ id: 4, name: 'Team 4' }
		// 		];

		// 		await matches.create({ pools: 3, courts: 2 }, teams);

		// 		// Ensure that no team plays the same opponent twice
		// 		const playedMatches = new Set<string>();
		// 		matches.matches.forEach((match) => {
		// 			const matchKey = `${match.team1}-${match.team2}`;
		// 			const reverseMatchKey = `${match.team2}-${match.team1}`;
		// 			expect(playedMatches.has(matchKey)).toBe(false);
		// 			expect(playedMatches.has(reverseMatchKey)).toBe(false);
		// 			playedMatches.add(matchKey);
		// 			playedMatches.add(reverseMatchKey);
		// 		});
		// 	});

		// 	it('should handle odd number of teams by adding a bye', async () => {
		// 		const teams: Team[] = [
		// 			{ id: 1, name: 'Team 1' },
		// 			{ id: 2, name: 'Team 2' },
		// 			{ id: 3, name: 'Team 3' }
		// 		];

		// 		await matches.create({ pools: 2, courts: 2 }, teams);

		// 		// Check that a 'bye' match was added
		// 		const byeMatches = matches.matches.filter((match) => match.team1 === 0 || match.team2 === 0);
		// 		expect(byeMatches.length).toBeGreaterThan(0);
		// 	});
	});
}
