import { SupabaseDatabaseService } from './supabaseDatabaseService';
import { matchesInsertSchema, matchesRowSchema, matchesUpdateSchema } from '$schemas/supabase';
import type { Match } from '$lib/match.svelte';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import { serverLog } from '$lib/serverLogger';

export class MatchSupabaseDatabaseService extends SupabaseDatabaseService {
	/**
	 * Load a match by its ID from the database.
	 * @param {number} id - The ID of the match.
	 * @returns {Promise<MatchRow | null>} - Returns a promise that resolves to the loaded match, or null if not found.
	 * @throws {Error} - Throws an error if there's an issue loading the match.
	 */
	async load(id: number): Promise<MatchRow | null> {
		try {
			const res: PostgrestSingleResponse<MatchRow | null> = await this.supabaseClient
				.from('matches')
				.select('*')
				.eq('id', id)
				.maybeSingle();

			this.validateAndHandleErrors(res, matchesRowSchema);

			return res.data;
		} catch (error) {
			console.error('Error loading the match:', error);
			throw new Error('Failed to load match.');
		}
	}

	/**
	 * Create a new match in the database.
	 * @param {Match} match - The match data to create.
	 * @returns {Promise<MatchRow | null>} - Returns a promise that resolves to the created match, or null if the creation fails.
	 */
	async post(match: Partial<Match>): Promise<MatchRow | null> {
		try {
			const parsedMatch = matchesInsertSchema.partial().parse(match);

			// Insert the new event into the 'events' table
			const res: PostgrestSingleResponse<MatchRow | null> = await this.supabaseClient
				.from('matches')
				.insert(parsedMatch)
				.select()
				.maybeSingle();

			this.validateAndHandleErrors(res, matchesInsertSchema);

			return res.data;
		} catch (error) {
			// If an error occurs while creating the event, log it and rethrow it
			console.error('An error occurred while creating the match:', error);
			throw error;
		}
	}

	/**
	 * Delete a match from the database by its ID.
	 * @param {number} id - The ID of the match to delete.
	 * @returns {Promise<void>} - Returns a promise that resolves when the match is deleted.
	 * @throws {Error} - Throws an error if there's an issue deleting the match.
	 */
	async delete(id: number): Promise<void> {
		try {
			const response = await this.supabaseClient.from('matches').delete().eq('id', id);
			this.handleDatabaseError(response);
		} catch (error) {
			console.error('Error deleting the match:', error);
			throw new Error('Failed to delete match.');
		}
	}

	/**
	 * Insert a new match into the database.
	 * @param {Match} match - The match data to insert.
	 * @returns {Promise<MatchRow | null>} - Returns a promise that resolves to the inserted match, or null if the insertion fails.
	 * @throws {Error} - Throws an error if there's an issue inserting the match.
	 */
	async insert(match: Match): Promise<MatchRow | null> {
		try {
			const parsedMatch = matchesUpdateSchema.parse(match);

			const res: PostgrestSingleResponse<MatchRow | null> = await this.supabaseClient
				.from('matches')
				.insert(parsedMatch)
				.select()
				.maybeSingle();

			this.validateAndHandleErrors(res, matchesRowSchema);

			return res.data;
		} catch (error) {
			console.error('Error inserting the match:', error);
			throw new Error('Failed to insert match.');
		}
	}

	/**
	 * Update an existing match in the database.
	 * @param {Match} match - The match data to update.
	 * @returns {Promise<MatchRow | null>} - Returns a promise that resolves to the updated match, or null if the update fails.
	 * @throws {Error} - Throws an error if there's an issue updating the match.
	 */
	async put(match: Match): Promise<MatchRow | null> {
		try {
			const parsedMatch = matchesUpdateSchema.parse(match);

			if (import.meta.env.DEV) {
				console.log(
					'Updating match:',
					match.id,
					'with state:',
					match.state,
					'parsed:',
					parsedMatch
				);
			}

			// Log network status before attempting save (to both console and server)
			serverLog.debug('Match update attempt', {
				matchId: match.id,
				online: typeof navigator !== 'undefined' ? navigator.onLine : 'unknown',
				hasClient: !!this.supabaseClient,
				timestamp: new Date().toISOString()
			});

			const res: PostgrestSingleResponse<MatchRow | null> = await this.supabaseClient
				.from('matches')
				.update(parsedMatch)
				.eq('id', match.id)
				.select('*')
				.maybeSingle();

			serverLog.debug('Match update response', {
				matchId: match.id,
				hasData: !!res.data,
				hasError: !!res.error,
				status: res.status,
				statusText: res.statusText,
				errorMessage: res.error?.message
			});

			this.validateAndHandleErrors(res, matchesRowSchema);

			return res.data;
		} catch (error) {
			// Enhance error message for better debugging
			const errorMsg = error instanceof Error ? error.message : String(error);
			serverLog.error('Error updating the match', {
				matchId: match.id,
				error: errorMsg,
				stack: error instanceof Error ? error.stack : undefined
			});

			// Preserve the original error type for better error handling upstream
			if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
				throw new Error('Network error: Unable to save match. Check your connection.');
			} else if (errorMsg.includes('timeout')) {
				throw new Error('Request timeout: The server took too long to respond.');
			} else if (
				errorMsg.includes('JWT') ||
				errorMsg.includes('token') ||
				errorMsg.includes('auth') ||
				errorMsg.includes('session')
			) {
				throw new Error('Session expired: Please refresh the page to continue.');
			}

			throw error; // Re-throw original error
		}
	}
}
