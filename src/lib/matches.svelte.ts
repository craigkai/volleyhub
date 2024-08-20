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

					try {
						await match.load(matchRow.id);

						matches.push(match);
					} catch (err: any) {
						this.handleError(500, `Failed to load team ${err}`);
					}
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

		const rotatedTeams = List.lockedRotate(
			teams.sort((a: Team, b: Team) => a.name.localeCompare(b.name))
		);
		const halfTeams = rotatedTeams.slice(0, Math.ceil(rotatedTeams.length / 2));

		const matchesForThisRound = halfTeams
			.map((team: Team, index: number) => {
				const opponent = rotatedTeams[rotatedTeams.length - ++index];
				if (opponent.name === 'bye' || team.name === 'bye') return;
				return round % 2 ? [team.id, opponent.id] : [opponent.id, team.id];
			})
			.filter(Boolean);

		rounds.push(matchesForThisRound);

		// Check if any team hasn't played enough games
		const teamMatches = new Map<number, number>();
		rounds.flat().forEach(([team1, team2]: [number, number]) => {
			teamMatches.set(team1, (teamMatches.get(team1) || 0) + 1);
			teamMatches.set(team2, (teamMatches.get(team2) || 0) + 1);
		});

		const maxMatches = Math.max(...Array.from(teamMatches.values()));
		const minMatches = Math.min(...Array.from(teamMatches.values()));

		// If any team has fewer matches, add more rounds
		if (minMatches < maxMatches) {
			return this.calculateMatches(teams, rounds, ++round, totalRounds);
		}

		return this.calculateMatches(rotatedTeams, rounds, ++round, totalRounds);
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

						const ref = this.determineReferee(
							Array.from(teamsPlayingThisRound),
							teams.map((t) => t.id!).filter((id) => id !== 0),
							refereeCounts,
							recentRefs
						);

						matchesThisRound.forEach((match) => {
							match.ref = ref;
						});

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
	const { vi, it, expect, beforeEach } = import.meta.vitest;

	let mockDatabaseService: any;
	let matches: Matches;

	beforeEach(() => {
		mockDatabaseService = {
			updateTournament: vi.fn(() => console.log('mockDatabaseService.updateTournament called')),
			getCurrentUser: vi.fn(() => {
				console.log('mockDatabaseService.getCurrentUser called');
				return { id: 1 };
			}),
			createEvent: vi.fn((input: any) => {
				console.log('mockDatabaseService.createEvent called');
				input.id = 1;
				return input;
			}),
			deleteMatchesByEvent: vi.fn(),
			insertMatches: vi.fn((matches: UserMatch[]) => matches),
			load: vi.fn(() => []), // Return an empty array or the matches as expected
			updateMatch: vi.fn((match: MatchRow) => match)
		};
		matches = new Matches(mockDatabaseService);
	});

	it('Test matches are correct with two teams and one pool play game', async () => {
		const input: Partial<EventRow> = {
			name: 'Test Tournament',
			date: new Date().toString(),
			pools: 1,
			courts: 2,
			owner: 'test',
			refs: 'provided'
		};

		const teams = Array.from({ length: 2 }, (_x, i) => ({
			id: `team${i}`,
			event_id: '1',
			created_at: null,
			name: '',
			state: null
		})) as unknown as Team[];

		await matches.load(1);
		await matches.create(input, teams);

		expect(matches.matches?.length).toEqual(1);

		const gamesPerTeam: any = { team0: 0, team1: 0 };
		matches?.matches?.forEach((match: Match) => {
			if (match.team1 && match.team2) {
				gamesPerTeam[match.team1]++;
				gamesPerTeam[match.team2]++;
			}
		});
		Object.keys(gamesPerTeam).forEach((team: string) => {
			expect(gamesPerTeam[team]).toEqual(1);
		});
	});

	it('Test matches are correct with four teams and three pool play games', async () => {
		const input: Partial<EventRow> = {
			name: 'Test Tournament',
			date: new Date().toString(),
			pools: 3,
			courts: 2,
			owner: 'test',
			refs: 'teams'
		};

		const teams = Array.from({ length: 4 }, (_x, i) => ({
			id: `team${i}`,
			event_id: '1',
			created_at: '',
			name: `team${i}`,
			state: 'active'
		})) as unknown as Team[];

		await matches.load(1);
		await matches.create(input, teams);

		expect(matches?.matches?.length).toEqual(3 * (4 / 2));

		const gamesPerTeam: any = { team0: 0, team1: 0, team2: 0, team3: 0 };
		matches?.matches?.forEach((match: Match) => {
			if (match.team1 && match.team2) {
				gamesPerTeam[match.team1]++;
				gamesPerTeam[match.team2]++;
			}
		});
		Object.keys(gamesPerTeam).forEach((team: string) => {
			expect(gamesPerTeam[team]).toEqual(3);
		});
	});

	it('Test matches refs are correct with four teams and three pool play games one court', async () => {
		const input: Partial<EventRow> = {
			name: 'Test Tournament',
			date: new Date().toString(),
			pools: 10,
			courts: 1,
			owner: 'test',
			refs: 'teams'
		};

		const teams = Array.from({ length: 7 }, (_x, i) => ({
			id: `${i + 1}`,
			event_id: '1',
			created_at: '',
			name: `team${i}`,
			state: 'active'
		})) as unknown as Team[];

		await matches.load(1);
		await matches.create(input, teams);

		const refGamesPerTeam: any = {};
		matches?.matches?.forEach((match: Match) => {
			if (match.ref) {
				refGamesPerTeam[match.ref] = refGamesPerTeam[match.ref]
					? refGamesPerTeam[match.ref] + 1
					: 1;
			}
		});

		const max = Math.max(...Object.values(refGamesPerTeam).map((value) => Number(value)));
		const min = Math.min(...Object.values(refGamesPerTeam).map((value) => Number(value)));

		expect(min).toEqual(max);
	});
}
