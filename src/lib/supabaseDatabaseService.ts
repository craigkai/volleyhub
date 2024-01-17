// Importing necessary types from supabase-js and sveltejs/kit
import type {
	PostgrestSingleResponse,
	PostgrestResponse,
	User,
	RealtimeChannel,
	RealtimePostgresChangesPayload
} from '@supabase/supabase-js';
import { error, type NumericRange } from '@sveltejs/kit';
import { eventsRowSchema, matchesRowSchema, teamsRowSchema } from '../types/schemas';
import { z } from 'zod';

// DatabaseService interface declaration
export interface DatabaseService {
	// Method to handle database errors
	handleDatabaseError<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T>): void;
	// Method to subscribe to changes
	subscribeToChanges(callback: () => {}, table: string, filter?: string): Promise<RealtimeChannel>;
	// Method to create a new event
	createEvent(input: EventRow, ownerId: string): Promise<EventRow | null>;
	// Method to update a tournament
	updateTournament(id: string, input: EventRow): Promise<EventRow | null>;
	// Method to get the current user
	getCurrentUser(): Promise<any | null>;
	// Method to load an event
	loadEvent(event_id: number): Promise<EventRow | null>;
	// Method to load teams
	loadTeams(event_id: number): Promise<TeamRow[] | null>;
	// Method to delete an event
	deleteEvent(event_id: number): Promise<void>;
	// Method to delete a team
	deleteTeam(team: TeamRow): Promise<void>;
	// Method to load matches
	loadMatches(event_id: number): Promise<MatchRow[] | null>;
	// Method to create a team
	createTeam(team: Partial<TeamRow>): Promise<TeamRow | null>;
	// Method to delete matches by event
	deleteMatchesByEvent(event_id: number): Promise<void>;
	// Method to insert matches
	insertMatches(matches: UserMatch[]): Promise<MatchRow[] | null>;
	// Method to update a match
	updateMatch(match: MatchRow): Promise<MatchRow | null>;
}

// SupabaseDatabaseService class implementing DatabaseService interface
export class SupabaseDatabaseService implements DatabaseService {
	// Private property for Supabase client
	private supabaseClient: supabaseClient;

	// Constructor to initialize Supabase client
	constructor(supabaseClient: supabaseClient) {
		this.supabaseClient = supabaseClient;
	}

	async subscribeToChanges(
		callback: (
			payload: RealtimePostgresChangesPayload<{
				[key: string]: any;
			}>
		) => {},
		table: string,
		filter?: string
	): Promise<RealtimeChannel> {
		console.debug('Subscribing to changes');

		return this.supabaseClient
			.channel('*')
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: table, filter: filter },
				(
					payload: RealtimePostgresChangesPayload<{
						[key: string]: any;
					}>
				) => {
					callback(payload);
				}
			)
			.subscribe((status) => console.debug('Realtime status', status));
	}

	// Method to handle database errors
	handleDatabaseError<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T>): void {
		// If there's an error in the response
		if (response.error) {
			// Log the status and error message
			console.error(`Failed operation with status ${response.status}: ${response.error.message}`);
			// Log the error details
			console.error(response.error);
			error(response.status as NumericRange<400, 599>, response.error);
		}
	}

	/**
	 * Get the UserResponse object for the current authenticated user for the supabase client.
	 * @returns Promise<User> - Returns a promise that resolves to the User object of the currently authenticated user.
	 * @throws {Error} - Throws an error if there's an issue retrieving the user.
	 */
	async getCurrentUser(): Promise<User | null> {
		try {
			// Use the Supabase client to get the current user
			const response = await this.supabaseClient.auth.getUser();

			// If there's an error in the response, log it and throw an error
			if (response.error) {
				console.error(`Failed to get current user: ${response.error}`);
				error(500, response.error);
			}

			// Return the User object from the response
			return response?.data.user;
		} catch (error) {
			// If an error occurs while getting the user, log it and rethrow it
			console.error('An error occurred while getting the current user:', error);
			throw error;
		}
	}

	/**
	 * Create a new event in the database.
	 * @param {EventRow} input - The data for the new event.
	 * @param {string} ownerId - The ID of the owner of the event.
	 * @returns {Promise<EventRow>} - Returns a promise that resolves to the newly created event.
	 * @throws {Error} - Throws an error if there's an issue creating the event.
	 */
	async createEvent(input: EventRow, ownerId: string): Promise<EventRow | null> {
		try {
			// Insert the new event into the 'events' table
			const res: PostgrestSingleResponse<EventRow> = await this.supabaseClient
				.from('events')
				.insert({
					owner: ownerId,
					name: input.name,
					pools: input.pools,
					courts: input.courts,
					date: input.date
				})
				.select()
				.single();

			// Handle any errors that may have occurred during the database operation
			this.handleDatabaseError(res);

			const result = eventsRowSchema.safeParse(res.data); // Validate results using Zod
			if (!result.success) {
				const err = { status: 500, error: result.error } as unknown as PostgrestResponse<EventRow>;
				this.handleDatabaseError(err);
			}

			// Return the newly created event
			return res.data;
		} catch (error) {
			// If an error occurs while creating the event, log it and rethrow it
			console.error('An error occurred while creating the event:', error);
			throw error;
		}
	}

	/**
	 * Update the details of a tournament in the database.
	 * @param {string} id - The ID of the tournament to update.
	 * @param {EventRow} input - The new data for the tournament.
	 * @returns {Promise<EventRow>} - Returns a promise that resolves to the updated tournament.
	 * @throws {Error} - Throws an error if there's an issue updating the tournament.
	 */
	async updateTournament(id: string, input: EventRow): Promise<EventRow | null> {
		try {
			// Update the tournament in the 'events' table
			const res: PostgrestSingleResponse<EventRow> = await this.supabaseClient
				.from('events')
				.update({
					name: input.name,
					pools: input.pools,
					courts: input.courts,
					date: input.date
				})
				.eq('id', id)
				.select()
				.single();

			// Handle any errors that may have occurred during the database operation
			this.handleDatabaseError(res);

			const result = eventsRowSchema.safeParse(res.data); // Validate results using Zod
			if (!result.success) {
				const err = { status: 500, error: result.error } as unknown as PostgrestResponse<EventRow>;
				this.handleDatabaseError(err);
			}

			// Return the updated tournament
			return res.data;
		} catch (error) {
			// If an error occurs while updating the tournament, log it and rethrow it
			console.error('An error occurred while updating the tournament:', error);
			throw error;
		}
	}

	/**
	 * Load an event from the database.
	 * @param {string} event_id - The ID of the event to load.
	 * @returns {Promise<EventRow>} - Returns a promise that resolves to the loaded event.
	 * @throws {Error} - Throws an error if there's an issue loading the event.
	 */
	async loadEvent(event_id: number): Promise<EventRow | null> {
		try {
			// Load the event from the 'events' table
			const res: PostgrestSingleResponse<EventRow> = await this.supabaseClient
				.from('events')
				.select('*')
				.eq('id', event_id)
				.single();

			// Handle any errors that may have occurred during the database operation
			this.handleDatabaseError(res);

			const result = eventsRowSchema.safeParse(res.data); // Validate results using Zod
			if (!result.success) {
				const err = { status: 500, error: result.error } as unknown as PostgrestResponse<EventRow>;
				this.handleDatabaseError(err);
			}

			// Return the loaded event
			return res.data;
		} catch (error) {
			// If an error occurs while loading the event, log it and rethrow it
			console.error('An error occurred while loading the event:', error);
			throw error;
		}
	}

	/**
	 * Load all teams associated with a specific event from the database.
	 * @param {string} event_id - The ID of the event whose teams to load.
	 * @returns {Promise<TeamRow[]>} - Returns a promise that resolves to an array of the loaded teams.
	 * @throws {Error} - Throws an error if there's an issue loading the teams.
	 */
	async loadTeams(event_id: number): Promise<TeamRow[] | null> {
		try {
			// Load the teams from the 'teams' table
			const res: PostgrestResponse<TeamRow> = await this.supabaseClient
				.from('teams')
				.select('*')
				.eq('event_id', event_id);

			// Handle any errors that may have occurred during the database operation
			this.handleDatabaseError(res);

			const teamsRowSchemaArray = z.array(teamsRowSchema);
			const result = teamsRowSchemaArray.safeParse(res.data); // Validate results using Zod
			if (!result.success) {
				const err = { status: 500, error: result.error } as unknown as PostgrestResponse<TeamRow>;
				this.handleDatabaseError(err);
			}

			// Return the loaded teams
			return res.data as TeamRow[]; // Add type assertion here
		} catch (error) {
			// If an error occurs while loading the teams, log it and rethrow it
			console.error('An error occurred while loading the teams:', error);
			throw error;
		}
	}

	/**
	 * Delete an event from the database.
	 * @param {string} event_id - The ID of the event to delete.
	 * @returns {Promise<void>} - Returns a promise that resolves when the event has been deleted.
	 * @throws {Error} - Throws an error if there's an issue deleting the event.
	 */
	async deleteEvent(event_id: number): Promise<void> {
		try {
			// Delete the event from the 'events' table
			const res: PostgrestSingleResponse<EventRow | null> = await this.supabaseClient
				.from('events')
				.delete()
				.eq('id', event_id);

			// Handle any errors that may have occurred during the database operation
			this.handleDatabaseError(res);
		} catch (error) {
			// If an error occurs while deleting the event, log it and rethrow it
			console.error('An error occurred while deleting the event:', error);
			throw error;
		}
	}

	/**
	 * Load all matches associated with a specific event from the database.
	 * @param {string} event_id - The ID of the event whose matches to load.
	 * @returns {Promise<MatchRow[]>} - Returns a promise that resolves to an array of the loaded matches.
	 * @throws {Error} - Throws an error if there's an issue loading the matches.
	 */
	async loadMatches(event_id: number): Promise<MatchRow[] | null> {
		// Load the matches from the 'matches' table
		const res: PostgrestSingleResponse<any[]> = await this.supabaseClient
			.from('matches')
			.select('*, matches_team1_fkey(name), matches_team2_fkey(name)')
			.eq('event_id', event_id);

		// Handle any errors that may have occurred during the database operation
		this.handleDatabaseError(res);

		const matchesRowSchemaArray = z.array(matchesRowSchema);
		const result = matchesRowSchemaArray.safeParse(res.data); // Validate results using Zod
		if (!result.success) {
			const err = { status: 500, error: result.error } as unknown as PostgrestResponse<MatchRow>;
			this.handleDatabaseError(err);
		}

		// Return the loaded matches
		return res.data;
	}

	/**
	 * Create a new team in the database or update an existing one.
	 * @param {Partial<TeamRow>} team - The data for the team.
	 * @returns {Promise<TeamRow>} - Returns a promise that resolves to the newly created or updated team.
	 * @throws {Error} - Throws an error if there's an issue creating or updating the team.
	 */
	async createTeam(team: Partial<TeamRow>): Promise<TeamRow | null> {
		const res = await this.supabaseClient
			.from('teams')
			.insert({ ...team })
			.select();

		// Handle any errors that may have occurred during the database operation
		this.handleDatabaseError(res);

		const teamsRowSchemaArray = z.array(teamsRowSchema);
		const result = teamsRowSchemaArray.safeParse(res.data); // Validate results using Zod
		if (!result.success) {
			const err = { status: 500, error: result.error } as unknown as PostgrestResponse<TeamRow>;
			this.handleDatabaseError(err);
		}

		// Return the newly created or updated team
		return res.data as unknown as TeamRow;
	}

	/**
	 * Load all events owned by a specific user from the database.
	 * @param {string} ownerId - The ID of the owner whose events to load.
	 * @returns {Promise<EventRow[]>} - Returns a promise that resolves to an array of the loaded events.
	 * @throws {Error} - Throws an error if there's an issue loading the events.
	 */
	async loadEvents(ownerId: string): Promise<EventRow[]> {
		// Load the events from the 'events' table
		const res = await this.supabaseClient.from('events').select('*').eq('owner', ownerId);

		// Handle any errors that may have occurred during the database operation
		this.handleDatabaseError(res);

		const eventsRowSchemaArray = z.array(eventsRowSchema);

		const result = eventsRowSchemaArray.safeParse(res.data); // Validate results using Zod
		if (!result.success) {
			const err = { status: 500, error: result.error } as unknown as PostgrestResponse<EventRow>;
			this.handleDatabaseError(err);
		}

		// Return the loaded events or an empty array if no events were found
		return res.data ?? [];
	}

	async deleteTeam(team: TeamRow): Promise<void> {
		const res = await this.supabaseClient.from('teams').delete().eq('id', team.id);
		this.handleDatabaseError(res);
	}

	async deleteMatchesByEvent(event_id: number): Promise<void> {
		const response = await this.supabaseClient.from('matches').delete().eq('event_id', event_id);
		this.handleDatabaseError(response);
	}

	async insertMatches(matches: MatchRow[]): Promise<MatchRow[]> {
		const res = await this.supabaseClient
			.from('matches')
			.insert(matches)
			.select('*, matches_team1_fkey(name), matches_team2_fkey(name)');

		this.handleDatabaseError(res);

		const matchesRowSchemaArray = z.array(matchesRowSchema);
		const result = matchesRowSchemaArray.safeParse(res.data); // Validate results using Zod
		if (!result.success) {
			const err = { status: 500, error: result.error } as unknown as PostgrestResponse<MatchRow>;
			this.handleDatabaseError(err);
		}

		return res.data ?? [];
	}

	async updateMatch(match: MatchRow): Promise<{
		created_at: string;
		id: number;
		status: string | null;
		event_id: number;
		team1: number;
		team1_score: number | null;
		team2: number;
		team2_score: number | null;
		court: number; // Add the missing 'court' property
		round: number; // Add the missing 'round' property
	} | null> {
		const res = await this.supabaseClient
			.from('matches')
			.update({
				team1_score: match.team1_score,
				team2_score: match.team2_score,
				court: match.court, // Add the missing 'court' property
				round: match.round // Add the missing 'round' property
			})
			.eq('id', match.id)
			.select('*, matches_team1_fkey(name), matches_team2_fkey(name)')
			.single();
		this.handleDatabaseError(res);

		const result = matchesRowSchema.safeParse(res.data); // Validate results using Zod
		if (!result.success) {
			const err = { status: 500, error: result.error } as unknown as PostgrestResponse<MatchRow>;
			this.handleDatabaseError(err);
		}

		return res.data;
	}
}
