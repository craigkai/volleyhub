// Importing necessary types from supabase-js and sveltejs/kit
import type {
	PostgrestSingleResponse,
	PostgrestResponse,
	User,
	RealtimeChannel,
	RealtimePostgresChangesPayload
} from '@supabase/supabase-js';
import { error, type NumericRange } from '@sveltejs/kit';
import type { z } from 'zod';
import { Brackets } from '$lib/brackets/brackets.svelte';
import { Matches } from '$lib/matches.svelte';
import { v4 as uuidv4 } from 'uuid';

export class SupabaseDatabaseService {
	// Private property for Supabase client
	supabaseClient: supabaseClient;

	// Constructor to initialize Supabase client
	constructor(supabaseClient: supabaseClient) {
		this.supabaseClient = supabaseClient;
	}

	validateAndHandleErrors<T>(
		response: PostgrestResponse<T> | PostgrestSingleResponse<T>,
		schema: z.ZodType<T, any, any>
	): T {
		this.handleDatabaseError(response as PostgrestResponse<T[]> | PostgrestResponse<T[][]>);

		const result = schema.safeParse(response.data);
		if (!result.success) {
			const errorResponse = { status: 500, error: result.error } as unknown as PostgrestResponse<T>;
			this.handleDatabaseError(errorResponse as PostgrestResponse<T[]> | PostgrestResponse<T[][]>);
		}

		return response.data as T;
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

	async subscribeToChanges(
		self: Matches | Brackets,
		callback: (
			self: Matches | Brackets,
			payload: RealtimePostgresChangesPayload<{
				[key: string]: any;
			}>
		) => {},
		table: string,
		filter?: string
	): Promise<RealtimeChannel> {
		const channelName = `${self.constructor.name}-${uuidv4()}`;

		console.debug(
			'Subscribing to changes for table ' +
				table +
				' with filter ' +
				filter +
				' constructor ' +
				self.constructor.name +
				' channel ' +
				channelName
		);

		return this.supabaseClient
			.channel(channelName)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: table, filter: filter },
				(
					payload: RealtimePostgresChangesPayload<{
						[key: string]: any;
					}>
				) => {
					callback(self, payload);
				}
			)
			.subscribe((status) => {
				// We call the load function to update in case our content is stale
				// when we re-connect to the web socket.
				self.load();
				self.subscriptionStatus = status;
				console.debug('Realtime status', status);
			});
	}
}
