import { error } from '@sveltejs/kit';
import { RoundRobin } from './roundRobin';
import type { DatabaseService } from './supabaseDatabaseService';
import { eventsRowSchema } from '../types/schemas';
import type { Match } from './matches';

/**
 * The Tournament class represents a tournament in the application.
 * It provides methods for creating and managing a tournament.
 */
export class Tournament {
	// The service used to interact with the database
	private databaseService: DatabaseService;

	// The Supabase client used to interact with the Supabase API
	supabaseClient: supabaseClient;

	// The ID of the tournament
	id: string;

	// The settings of the tournament
	settings: EventRow;

	teams?: TeamRow[];

	// The matches of the tournament
	matches?: MatchRow[];

	/**
	 * The constructor for the Tournament class.
	 * @param {DatabaseService} databaseService - The service used to interact with the database.
	 * @param {supabaseClient} supabaseClient - The Supabase client used to interact with the Supabase API.
	 */
	constructor(databaseService: DatabaseService, supabaseClient: supabaseClient) {
		this.databaseService = databaseService;
		this.supabaseClient = supabaseClient;
		this.settings = eventsRowSchema.parse({
			name: '',
			date: '',
			pools: 0,
			courts: 0,
			owner: '',
			id: 0,
			created_at: ''
		});
		this.id = '';
	}

	/**
	 * Create a new event. This creates the tournament settings only.
	 * @param {EventRow} input - The data for the event to create.
	 * @returns {Promise<Tournament>} - Returns a promise that resolves to the newly created tournament.
	 * @throws {Error} - Throws an error if the event data does not have all required values.
	 */
	async createEvent(input: Partial<EventRow>): Promise<Tournament> {
		if (!input.name || !input.date || !input.pools || !input.courts) {
			error(400, `Tournament create call does not have all required values`);
		}
		const currentUser = await this.databaseService.getCurrentUser();
		const ownerId = currentUser ? currentUser.id : null;

		const res: EventRow | null = await this.databaseService.createEvent(input, ownerId as string);

		if (res !== null) {
			this.id = res.id as unknown as string;
			this.settings = res;
		}

		return this;
	}

	/**
	 * Updates the tournament with the given data.
	 * @param {string} id - The id of our tournament.
	 * @param {EventRow} input - The data to update the tournament with.
	 * @returns {Promise<Tournament>} - Returns a promise that resolves to the updated tournament.
	 * @throws {Error} - Throws an error if there's an issue updating the tournament.
	 */
	async updateTournament(id: string, input: EventRow): Promise<Tournament> {
		const result = eventsRowSchema.safeParse(input); // Validate input using Zod
		if (!result.success) {
			error(
				400,
				Error(
					`Tournament update call input param incorrect: ${JSON.stringify(result.error.format())}`
				)
			);
		}

		const res: EventRow | null = await this.databaseService.updateTournament(id, input);

		if (res !== null) {
			this.settings = res;
		}

		return this;
	}

	/*
		Attempt to load our event (tournament settings) via SupaBase, we load matches and teams elsewhere.
	*/
	async loadEvent(eventId?: string): Promise<Tournament> {
		if (!eventId) {
			error(400, Error('Invalid event ID, are you sure your link is correct?'));
		}

		const eventResponse: EventRow | null = await this.databaseService.loadEvent(eventId);
		this.id = eventResponse?.id.toString() || '';

		// if we did not get an Id value back, something has gone wrong!
		if (this.id) {
			this.settings = eventResponse!;
			this.teams = (await this.loadTeams()) as TeamRow[]; // Update the type of this.teams
		} else {
			console.error(`Failed to load event ${JSON.stringify(eventResponse)}`);
			error(404, Error(`Could not find event with Id ${eventId}`));
		}
		return this;
	}

	async deleteEvent(): Promise<void> {
		try {
			await this.databaseService.deleteEvent(this.id);

			// Delete all teams, which should cascade and delete all matches
			this?.teams?.forEach((team: TeamRow) => {
				this.databaseService.deleteTeam(team);
			});
		} catch (err) {
			// Handle and log the error appropriately
			console.error('Failed to delete event:', err);
			throw err;
		}
	}

	/*
	Load all matches for the current tournament.
	*/
	async loadMatches(): Promise<MatchRow[] | undefined> {
		const res = await this.databaseService.loadMatches(this.id);
		if (res) {
			this.matches = res;
		}
		return this.matches;
	}

	async createMatches() {
		if (!this?.teams || this?.teams?.length === 0) {
			console.error("Can't generate matches without Teams");
			error(500, Error("Can't generate matches without Teams"));
		}

		if (!this?.settings?.pools || this.settings.pools <= 0) {
			console.error("Can't generate matches without Pools");
			error(500, Error("Can't generate matches without Pools"));
		}

		if (!this?.settings?.courts || this.settings.courts <= 0) {
			console.error("Can't generate matches without courts");
			error(500, Error("Can't generate matches without courts"));
		}

		try {
			let matches: Match[] = [];
			// If we have more pool play games than matches we got
			// back, then we need to generate some more.
			while (matches.length < this.settings.pools * this.teams.length) {
				matches = matches.concat(RoundRobin(this.teams));
			}
			// Delete all old matches as they are now invalid
			await this.databaseService.deleteMatchesByEvent(this.id);

			let courtsAvailable = this.settings.courts;
			let teamsAvailable = this.teams.length;
			let round = 0;

			let totalRounds = 0;
			const userMatches: UserMatch[] = [];
			matches.forEach((match: UserMatch) => {
				// Short circuit if we have more matches than pool play games
				// (you don't play every team).
				if (this.settings && userMatches.length === this.settings.pools * (this.teams.length / 2)) {
					return;
				}

				if (courtsAvailable === 0 || teamsAvailable < 2) {
					courtsAvailable = this.settings.courts;
					teamsAvailable = this?.teams?.length;
					round = round + 1;
					totalRounds = totalRounds + 1;
				}

				match.court = this.settings.courts - courtsAvailable;
				match.round = round;

				courtsAvailable = courtsAvailable - 1;
				if (teamsAvailable >= 2) {
					userMatches.push({
						event_id: this.id,
						team1: match.player1.id,
						team2: match.player2.id,
						court: match.court,
						round: match.round
					});
				}
				teamsAvailable = teamsAvailable - 2;
			});

			// Call multi insert:
			const res = await this.databaseService.insertMatches(userMatches);
			if (res) {
				this.matches = res;
			}
			return this;
		} catch (err) {
			// Handle and log the error appropriately
			console.error('Failed to generate matches:', err);
			error(500, Error(err as string));
		}
	}

	async updateMatch(match: MatchRow): Promise<MatchRow> {
		const res = await this.databaseService.updateMatch(match);
		if (res) {
			match = res;
		}
		return match;
	}

	/*
	Inserts new team into supabase, if a team exists where team name and event id match what we
	are trying to create, then return that team Id.
	*/
	async createTeam(team: Partial<TeamRow>): Promise<number | undefined> {
		const res: TeamRow | null = await this.databaseService.createTeam(team);
		return res?.id;
	}

	async loadTeams(): Promise<TeamRow[] | undefined> {
		const res = await this.databaseService.loadTeams(this.id);
		if (res) {
			this.teams = res;
		}
		return this.teams;
	}

	async deleteTeam(team: TeamRow): Promise<void> {
		await this.databaseService.deleteTeam(team);
	}
}

if (import.meta.vitest) {
	const { vi, it, expect, describe, beforeEach } = import.meta.vitest;

	describe('Tournament', () => {
		let tournament: Tournament;
		let mockDatabaseService: any;
		let mockSupabaseClient: any;

		beforeEach(() => {
			mockDatabaseService = {
				updateTournament: vi.fn(() => console.log('mockDatabaseService.updateTournament called')),
				deleteMatchesByEvent: vi.fn(() =>
					console.log('mockDatabaseService.updateTournament called')
				),
				getCurrentUser: vi.fn(() => {
					console.log('mockDatabaseService.getCurrentUser called');
					return {
						id: 1
					};
				}),
				createEvent: vi.fn((input) => {
					console.log('mockDatabaseService.createEvent called');
					input.id = 1;
					return input;
				}),
				loadTeams: vi.fn(() => {
					console.log('mockDatabaseService.loadTeams called');
					return [
						{
							name: 'Team1',
							event_id: tournament.id
						},
						{
							name: 'Team2',
							event_id: tournament.id
						}
					];
				}),
				insertMatches: vi.fn((input) => {
					console.log('mockDatabaseService.insertMatches called');
					return input;
				})
			};
			mockSupabaseClient = {
				updateTournament: vi.fn()
			};
			tournament = new Tournament(mockDatabaseService, mockSupabaseClient);
		});

		it('should throw an error if not all required values are provided', async () => {
			const input: Partial<EventRow> = {
				name: 'Test Tournament'
				// date, pools, and courts are missing
			};

			await expect(tournament.updateTournament('1', input as EventRow)).rejects.toThrow();
		});

		it('should throw an error if not all required values are provided', async () => {
			const input: Partial<EventRow> = {
				name: 'Test Tournament'
				// date, pools, and courts are missing
			};

			await expect(tournament.updateTournament('1', input as EventRow)).rejects.toThrow();
		});

		it('should update the tournament if all required values are provided', async () => {
			const input: Partial<EventRow> = {
				name: 'Test Tournament',
				date: new Date().toString(),
				pools: 1,
				courts: 2,
				id: 1,
				created_at: 'test',
				owner: 'test'
			};

			const updatedTournament: EventRow = {
				...input,
				id: 1,
				courts: input.courts,
				created_at: 'test'
			};

			mockDatabaseService.updateTournament.mockResolvedValue(updatedTournament);

			await expect(tournament.updateTournament('1', input)).resolves.toEqual(tournament);

			expect(tournament.settings).toEqual(updatedTournament);
			expect(mockDatabaseService.updateTournament).toHaveBeenCalledWith('1', input);
		});

		it('Test matches are correct with two teams and one pool play game', async () => {
			const input: Partial<EventRow> = {
				name: 'Test Tournament',
				date: new Date().toString(),
				pools: 1,
				courts: 2,
				owner: 'test'
			};

			const updatedTournament: Partial<EventRow> = {
				...input,
				id: 1,
				courts: input.courts
			};

			mockDatabaseService.updateTournament.mockResolvedValue(updatedTournament);

			await tournament.createEvent(input);
			const teams = Array.from({ length: 2 }, (_x, i) => {
				return {
					id: `team${i}`,
					event_id: 1
				};
			});
			tournament.teams = teams;
			await tournament.createMatches();

			expect(tournament?.matches?.length).toEqual(1);

			const gamesPerTeam: any = { team0: 0, team1: 0 };
			tournament?.matches?.forEach((match: MatchRow) => {
				gamesPerTeam[match.team1]++;
				gamesPerTeam[match.team2]++;
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
				courts: 2
			};

			const updatedTournament: Partial<EventRow> = {
				...input,
				id: 1
			};

			mockDatabaseService.updateTournament.mockResolvedValue(updatedTournament);

			await tournament.createEvent(input);
			const teams = Array.from({ length: 4 }, (_x, i) => {
				return {
					id: `team${i}`,
					event_id: 1,
					created_at: '',
					name: `team${i}`,
					state: 'active'
				};
			});
			tournament.teams = teams;
			await tournament.createMatches();

			// Teams / 2 * pool play
			expect(tournament?.matches?.length).toEqual(3 * (4 / 2));

			const gamesPerTeam: any = { team0: 0, team1: 0, team2: 0, team3: 0 };
			tournament?.matches?.forEach((match: MatchRow) => {
				gamesPerTeam[match.team1]++;
				gamesPerTeam[match.team2]++;
			});
			Object.keys(gamesPerTeam).forEach((team: string) => {
				expect(gamesPerTeam[team]).toEqual(3);
			});
		});
	});
}
