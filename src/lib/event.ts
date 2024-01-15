import { error } from '@sveltejs/kit';
import type { DatabaseService } from './supabaseDatabaseService';
import { eventsRowSchema } from '../types/schemas';

/**
 * The Tournament class represents a tournament in the application.
 * It provides methods for creating and managing a tournament.
 */
export class Event {
	// The service used to interact with the database
	private databaseService: DatabaseService;

	// The ID of the tournament
	id: string;
	name: string;
	date: string;
	pools: number;
	courts: number;
	owner: string;
	created_at: string;

	/**
	 * The constructor for the Tournament class.
	 * @param {DatabaseService} databaseService - The service used to interact with the database.
	 */
	constructor(eventId: string, databaseService: DatabaseService) {
		if (!eventId) {
			error(400, Error('Invalid event ID, are you sure your link is correct?'));
		}

		this.databaseService = databaseService;
		this.name = '';
		this.date = '';
		this.pools = 0;
		this.courts = 0;
		this.owner = '';
		this.created_at = '';
		this.id = eventId;
	}

	/**
	 * Create a new event. This creates the tournament settings only.
	 * @param {EventRow} input - The data for the event to create.
	 * @returns {Promise<Tournament>} - Returns a promise that resolves to the newly created tournament.
	 * @throws {Error} - Throws an error if the event data does not have all required values.
	 */
	async createEvent(input: Partial<EventRow>): Promise<Event> {
		if (!input.name || !input.date || !input.pools || !input.courts) {
			error(400, `Tournament create call does not have all required values`);
		}
		const currentUser = await this.databaseService.getCurrentUser();
		const ownerId = currentUser ? currentUser.id : null;

		const res: EventRow | null = await this.databaseService.createEvent(input, ownerId as string);

		if (res !== null) {
			Object.keys(res as object).forEach((key) => {
				this[key as keyof Event] = res[key as keyof Event];
			});
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
	async updateEvent(id: string, input: EventRow): Promise<Event> {
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
			Object.keys(res as object).forEach((key) => {
				this[key as keyof Event] = res[key as keyof Event];
			});
		}
		return this;
	}

	/*
		Attempt to load our event (tournament settings) via SupaBase
	*/
	async load(): Promise<Event> {
		const eventResponse: EventRow | null = await this.databaseService.loadEvent(this.id);

		if (eventResponse !== null) {
			Object.keys(eventResponse as object).forEach((key) => {
				this[key as keyof Event] = eventResponse[key as keyof Event];
			});
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
}

// if (import.meta.vitest) {
// 	const { vi, it, expect, describe, beforeEach } = import.meta.vitest;

// 	describe('Tournament', () => {
// 		let tournament: Tournament;
// 		let mockDatabaseService: any;
// 		let mockSupabaseClient: any;

// 		beforeEach(() => {
// 			mockDatabaseService = {
// 				updateTournament: vi.fn(() => console.log('mockDatabaseService.updateTournament called')),
// 				deleteMatchesByEvent: vi.fn(() =>
// 					console.log('mockDatabaseService.updateTournament called')
// 				),
// 				getCurrentUser: vi.fn(() => {
// 					console.log('mockDatabaseService.getCurrentUser called');
// 					return {
// 						id: 1
// 					};
// 				}),
// 				createEvent: vi.fn((input) => {
// 					console.log('mockDatabaseService.createEvent called');
// 					input.id = 1;
// 					return input;
// 				}),
// 				loadTeams: vi.fn(() => {
// 					console.log('mockDatabaseService.loadTeams called');
// 					return [
// 						{
// 							name: 'Team1',
// 							  eventId: tournament.id
// 						},
// 						{
// 							name: 'Team2',
// 							  eventId: tournament.id
// 						}
// 					];
// 				}),
// 				insertMatches: vi.fn((input) => {
// 					console.log('mockDatabaseService.insertMatches called');
// 					return input;
// 				})
// 			};
// 			tournament = new Tournament(mockDatabaseService);
// 		});

// 		it('should throw an error if not all required values are provided', async () => {
// 			const input: Partial<EventRow> = {
// 				name: 'Test Tournament'
// 				// date, pools, and courts are missing
// 			};

// 			await expect(tournament.updateTournament('1', input as EventRow)).rejects.toThrow();
// 		});

// 		it('should throw an error if not all required values are provided', async () => {
// 			const input: Partial<EventRow> = {
// 				name: 'Test Tournament'
// 				// date, pools, and courts are missing
// 			};

// 			await expect(tournament.updateTournament('1', input as EventRow)).rejects.toThrow();
// 		});

// 		it('should update the tournament if all required values are provided', async () => {
// 			const input: Partial<EventRow> = {
// 				name: 'Test Tournament',
// 				date: new Date().toString(),
// 				pools: 1,
// 				courts: 2,
// 				id: 1,
// 				created_at: 'test',
// 				owner: 'test'
// 			};

// 			const updatedTournament: EventRow = {
// 				...input,
// 				id: 1,
// 				courts: input.courts,
// 				created_at: 'test'
// 			};

// 			mockDatabaseService.updateTournament.mockResolvedValue(updatedTournament);

// 			await expect(tournament.updateTournament('1', input)).resolves.toEqual(tournament);

// 			expect(tournament.settings).toEqual(updatedTournament);
// 			expect(mockDatabaseService.updateTournament).toHaveBeenCalledWith('1', input);
// 		});

// 		it('Test matches are correct with two teams and one pool play game', async () => {
// 			const input: Partial<EventRow> = {
// 				name: 'Test Tournament',
// 				date: new Date().toString(),
// 				pools: 1,
// 				courts: 2,
// 				owner: 'test'
// 			};

// 			const updatedTournament: Partial<EventRow> = {
// 				...input,
// 				id: 1,
// 				courts: input.courts
// 			};

// 			mockDatabaseService.updateTournament.mockResolvedValue(updatedTournament);

// 			await tournament.createEvent(input);
// 			const teams = Array.from({ length: 2 }, (_x, i) => {
// 				return {
// 					id: `team${i}`,
// 					  eventId: 1
// 				};
// 			});
// 			tournament.teams = teams;
// 			await tournament.createMatches();

// 			expect(tournament?.matches?.length).toEqual(1);

// 			const gamesPerTeam: any = { team0: 0, team1: 0 };
// 			tournament?.matches?.forEach((match: MatchRow) => {
// 				gamesPerTeam[match.team1]++;
// 				gamesPerTeam[match.team2]++;
// 			});
// 			Object.keys(gamesPerTeam).forEach((team: string) => {
// 				expect(gamesPerTeam[team]).toEqual(1);
// 			});
// 		});

// 		it('Test matches are correct with four teams and three pool play games', async () => {
// 			const input: Partial<EventRow> = {
// 				name: 'Test Tournament',
// 				date: new Date().toString(),
// 				pools: 3,
// 				courts: 2
// 			};

// 			const updatedTournament: Partial<EventRow> = {
// 				...input,
// 				id: 1
// 			};

// 			mockDatabaseService.updateTournament.mockResolvedValue(updatedTournament);

// 			await tournament.createEvent(input);
// 			const teams = Array.from({ length: 4 }, (_x, i) => {
// 				return {
// 					id: `team${i}`,
// 					  eventId: 1,
// 					created_at: '',
// 					name: `team${i}`,
// 					state: 'active'
// 				};
// 			});
// 			tournament.teams = teams;
// 			await tournament.createMatches();

// 			// Teams / 2 * pool play
// 			expect(tournament?.matches?.length).toEqual(3 * (4 / 2));

// 			const gamesPerTeam: any = { team0: 0, team1: 0, team2: 0, team3: 0 };
// 			tournament?.matches?.forEach((match: MatchRow) => {
// 				gamesPerTeam[match.team1]++;
// 				gamesPerTeam[match.team2]++;
// 			});
// 			Object.keys(gamesPerTeam).forEach((team: string) => {
// 				expect(gamesPerTeam[team]).toEqual(3);
// 			});
// 		});
// 	});
// }
