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
				self.databaseService.supabaseClient
			);
			const newMatchInstance = new Match(matchSupabaseDatabaseService);
			Object.assign(newMatchInstance, updated);

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
	 * Calculate the matches for the event.
	 * @param {Team[]} teams - The teams participating in the event.
	 * @param {any[]} rounds - The existing rounds of matches.
	 * @param {number} round - The current round number.
	 * @param {number} totalRounds - The total number of rounds to be played.
	 * @param {number} maxGames - The maximum number of games each team should play.
	 * @returns {[number, number][][]} - Returns an array of rounds, each containing pairs of team IDs.
	 */
	protected calculateMatches(
		teams: Team[],
		rounds: [number, number][][] = [],
		round: number = 0,
		totalRounds: number,
		maxGames: number
	): [number, number][][] {
		if (round === totalRounds) return rounds;

		// Add a bye team if the number of teams is odd
		if (teams.length % 2 !== 0) {
			teams.push({ id: 0, name: 'bye' } as Team);
		}

		const numTeams = teams.length;
		const halfSize = Math.floor(numTeams / 2);

		// Track how many games each team has played
		const teamGamesPlayed: Map<number, number> = new Map();
		const playedMatches: Set<string> = new Set(); // Track played matchups

		teams.forEach((team) => {
			if (team.id && team.id !== 0) {
				// Don't count the 'bye' team
				teamGamesPlayed.set(team.id, 0);
			}
		});

		while (round < totalRounds) {
			const matchesForThisRound: [number, number][] = [];
			const pairedTeams = new Set<number>();

			for (let i = 0; i < halfSize; i++) {
				const team1 = teams[i];
				const team2 = teams[numTeams - 1 - i];

				if (team1.name !== 'bye' && team2.name !== 'bye') {
					const matchupKey = `${Math.min(team1.id!, team2.id!)}-${Math.max(team1.id!, team2.id!)}`;

					if (!playedMatches.has(matchupKey)) {
						const team1Games = teamGamesPlayed.get(team1.id!) || 0;
						const team2Games = teamGamesPlayed.get(team2.id!) || 0;

						if (team1Games < maxGames && team2Games < maxGames) {
							matchesForThisRound.push([team1.id!, team2.id!]);
							pairedTeams.add(team1.id!);
							pairedTeams.add(team2.id!);

							teamGamesPlayed.set(team1.id!, team1Games + 1);
							teamGamesPlayed.set(team2.id!, team2Games + 1);

							playedMatches.add(matchupKey); // Mark this matchup as played
						}
					}
				}
			}

			if (matchesForThisRound.length > 0) {
				rounds.push(matchesForThisRound);
			}

			// Check if all teams have reached the max number of games
			const allTeamsReachedMaxGames = Array.from(teamGamesPlayed.values()).every(
				(gamesPlayed) => gamesPlayed >= maxGames
			);

			if (allTeamsReachedMaxGames) {
				break; // Stop scheduling further matches
			}

			// Rotate teams for the next round
			teams = List.lockedRotate(teams);
			round++;
		}

		// Check for underplayed teams
		const underplayedTeams = Array.from(teamGamesPlayed.entries()).filter(
			([teamId, gamesPlayed]) => gamesPlayed < maxGames && teamId !== 0
		);

		if (underplayedTeams.length > 0) {
			// Sort underplayed teams by their ID or other criteria if necessary
			const sortedTeams = underplayedTeams.sort(([idA], [idB]) => idA - idB);

			// Track previous matches to avoid duplicates
			const previousMatches = new Set<string>(
				rounds.flat().map(([team1, team2]) => `${team1}-${team2}`)
			);

			// Initialize an array to store new rounds of matches
			const newExtraRounds: [number, number][][] = [];

			// Schedule extra rounds for underplayed teams
			for (let i = 0; i < sortedTeams.length; i++) {
				const [teamId, gamesPlayed] = sortedTeams[i];
				const remainingGames = maxGames - gamesPlayed;

				for (let j = 0; j < remainingGames; j++) {
					// Find the next opponent in the sorted list
					const opponentIndex = (i + 1 + j) % sortedTeams.length;
					const [oppId] = sortedTeams[opponentIndex];

					// Create a match key to check for duplicates
					const matchKey = `${teamId}-${oppId}`;
					const reverseMatchKey = `${oppId}-${teamId}`;

					// Check if this match has already been played
					if (!previousMatches.has(matchKey) && !previousMatches.has(reverseMatchKey)) {
						// Find a round where neither team is already scheduled to play
						let foundRound = false;

						for (const round of newExtraRounds) {
							const teamsInRound = round.flat();
							if (!teamsInRound.includes(teamId) && !teamsInRound.includes(oppId)) {
								// Add the match to this round
								round.push([teamId, oppId]);
								foundRound = true;
								break;
							}
						}

						if (!foundRound) {
							// Create a new round if no suitable existing round was found
							newExtraRounds.push([[teamId, oppId]]);
						}

						previousMatches.add(matchKey);
						previousMatches.add(reverseMatchKey);
					}
				}
			}

			// Add the new extra rounds to the main rounds array
			rounds.push(...newExtraRounds);
		}

		return rounds;
	}

	/**
	 * Calculate the court assignments and rounds for the matches.
	 * Assign referees based on the team availability and previous assignments.
	 * @param {[number, number][][]} rounds - The rounds of matches to be scheduled.
	 * @param {number} courts - The number of available courts.
	 * @param {Partial<TeamRow>[]} teams - The teams participating in the event.
	 * @param {string} refs - The method to determine referees ('provided' or 'teams').
	 * @returns {Partial<MatchRow>[]} - Returns an array of match rows with court assignments and referee assignments.
	 */
	protected calculateCourtsAndRounds(
		rounds: [number, number][][],
		courts: number,
		teams: Partial<TeamRow>[],
		refs: string = 'provided'
	): Partial<MatchRow>[] {
		let courtNumber = 0;
		const matches: Partial<MatchRow>[] = [];

		// Track referee counts and recent assignments
		const refereeCounts: { [teamId: number]: number } = {};
		const recentRefs: number[] = [];

		teams.forEach((team) => {
			if (team.id !== undefined && team.name !== 'bye') {
				refereeCounts[team.id] = 0;
			}
		});

		// Not the round robin rounds, but the rounds of matches
		let scheduleRoundNumber = 0;
		let matchesThisRound: Partial<MatchRow>[] = [];
		rounds.forEach((round: [number, number][]) => {
			const teamsPlayingThisRound = new Set<number>();

			round.forEach((match: [number, number]) => {
				if (match) {
					teamsPlayingThisRound.add(match[0]);
					teamsPlayingThisRound.add(match[1]);

					const newMatch: Partial<MatchRow> = {
						team1: match[0],
						team2: match[1],
						round: scheduleRoundNumber,
						court: courtNumber,
						event_id: this.event_id
					};

					matches.push(newMatch);
					matchesThisRound.push(newMatch);

					courtNumber = (courtNumber + 1) % courts;
					if (courtNumber === 0) {
						scheduleRoundNumber++;

						if (refs === 'teams') {
							const ref = this.determineReferee(
								Array.from(teamsPlayingThisRound),
								teams.map((t) => t.id!).filter((id) => id !== 0),
								refereeCounts,
								recentRefs
							);

							matchesThisRound.forEach((match) => {
								match.ref = ref;
							});

							// Update referee counts and recent refs
							if (ref !== -1) {
								refereeCounts[ref]++;
								recentRefs.push(ref);

								if (recentRefs.length > teams.length - 1) {
									recentRefs.shift();
								}
							}
						}

						matchesThisRound = [];
						teamsPlayingThisRound.clear();
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

			// Ensure that each team has a reasonable number of matches
			const matchCounts: { [key: number]: number } = {};
			matches.matches.forEach((match) => {
				matchCounts[match.team1] = (matchCounts[match.team1] || 0) + 1;
				matchCounts[match.team2] = (matchCounts[match.team2] || 0) + 1;
			});
			Object.keys(matchCounts).forEach((teamId) => {
				expect(matchCounts[parseInt(teamId)]).toBeGreaterThanOrEqual(3);
			});
		});
	});
}
