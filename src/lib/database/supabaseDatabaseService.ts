// Importing necessary types from supabase-js and sveltejs/kit
import type { User, RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { error } from '@sveltejs/kit';
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

	async subscribeToChanges<T extends Record<string, unknown>>(
		self: T,
		callback: (self: T, payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => object,
		table: string,
		filter?: string
	): Promise<RealtimeChannel> {
		const channelName = `${table}-${self.constructor.name}${filter ? `-${filter}` : ''}`;

		if (import.meta.env.DEV) {
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
		}

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
				self.subscriptionStatus = status;
				if (import.meta.env.DEV) {
					console.debug('Realtime status', status);
				}
			});
	}
}
