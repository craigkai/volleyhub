// Importing necessary types from supabase-js and sveltejs/kit
import type { User, RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { error } from '@sveltejs/kit';
import { Brackets } from '$lib/brackets/brackets.svelte';
import { Matches } from '$lib/matches.svelte';
import { v4 as uuidv4 } from 'uuid';
import { Base } from '$lib/database/base';

export class SupabaseDatabaseService extends Base {
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
		) => object,
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
				if (self.event_id) self.load(self.event_id);

				self.subscriptionStatus = status;
				console.debug('Realtime status', status);
			});
	}
}
