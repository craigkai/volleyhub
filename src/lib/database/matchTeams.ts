import { SupabaseDatabaseService } from '$lib/database/supabaseDatabaseService';
import { z } from 'zod';
import { matchTeamsRowSchema } from '$schemas/supabase';

// Schema validation for an array of match_teams
const MatchTeamsRowSchemaArray = z
	.array(matchTeamsRowSchema)
	.refine((data) => Array.isArray(data), {
		message: 'Expected an array of match_teams.'
	});

export class MatchTeamsSupabaseDatabaseService extends SupabaseDatabaseService {
	/**
	 * Create a new match_team record in the database.
	 * @param {Partial<MatchTeamRow>} matchTeam - The data for the match_team record.
	 * @returns {Promise<MatchTeamRow | null>} - Returns a promise that resolves to the newly created record, or null if the operation fails.
	 * @throws {Error} - Throws an error if there's an issue creating the record.
	 */
	async create(matchTeam: Partial<MatchTeamRow>): Promise<MatchTeamRow | null> {
		try {
			const res = await this.supabaseClient
				.from('match_teams')
				.insert({ ...matchTeam })
				.select()
				.single();

			// Validate the response using the Zod schema
			this.validateAndHandleErrors(res, matchTeamsRowSchema);

			// Return the created record data
			return res.data;
		} catch (error) {
			console.error('An error occurred while creating the match_team record:', error);
			throw new Error('Failed to create the match_team record.');
		}
	}

	/**
	 * Create multiple match_team records in a single operation.
	 * @param {Partial<MatchTeamRow>[]} matchTeams - Array of match_team records to create.
	 * @returns {Promise<MatchTeamRow[] | null>} - Returns a promise that resolves to the created records.
	 * @throws {Error} - Throws an error if there's an issue creating the records.
	 */
	async createMany(matchTeams: Partial<MatchTeamRow>[]): Promise<MatchTeamRow[] | null> {
		try {
			const res = await this.supabaseClient.from('match_teams').insert(matchTeams).select();

			// Validate the response using the Zod schema
			this.validateAndHandleErrors(res, MatchTeamsRowSchemaArray);

			// Return the created records
			return res.data;
		} catch (error) {
			console.error('An error occurred while creating match_team records:', error);
			throw new Error('Failed to create match_team records.');
		}
	}

	/**
	 * Load all match_teams associated with a specific match from the database.
	 * @param {number} match_id - The ID of the match whose team associations to load.
	 * @returns {Promise<MatchTeamRow[] | null>} - Returns a promise that resolves to an array of the loaded records, or null if none were found.
	 * @throws {Error} - Throws an error if there's an issue loading the records.
	 */
	async loadByMatch(match_id: number): Promise<MatchTeamRow[] | null> {
		try {
			const res = await this.supabaseClient
				.from('match_teams')
				.select('*')
				.eq('match_id', match_id);

			// Validate the response using the Zod schema for an array
			this.validateAndHandleErrors(res, MatchTeamsRowSchemaArray);

			// Return the loaded records, or null if none were found
			return res.data;
		} catch (error) {
			console.error('An error occurred while loading the match_teams:', error);
			throw new Error('Failed to load match_teams.');
		}
	}

	/**
	 * Load all match_teams associated with a specific team from the database.
	 * @param {number} team_id - The ID of the team whose match associations to load.
	 * @returns {Promise<MatchTeamRow[] | null>} - Returns a promise that resolves to an array of the loaded records, or null if none were found.
	 * @throws {Error} - Throws an error if there's an issue loading the records.
	 */
	async loadByTeam(team_id: number): Promise<MatchTeamRow[] | null> {
		try {
			const res = await this.supabaseClient.from('match_teams').select('*').eq('team_id', team_id);

			// Validate the response using the Zod schema for an array
			this.validateAndHandleErrors(res, MatchTeamsRowSchemaArray);

			// Return the loaded records, or null if none were found
			return res.data;
		} catch (error) {
			console.error('An error occurred while loading the match_teams:', error);
			throw new Error('Failed to load match_teams.');
		}
	}

	/**
	 * Delete all match_team records for a specific match.
	 * @param {number} match_id - The ID of the match.
	 * @returns {Promise<void>}
	 * @throws {Error} - Throws an error if there's an issue deleting the records.
	 */
	async deleteByMatch(match_id: number): Promise<void> {
		try {
			const res = await this.supabaseClient.from('match_teams').delete().eq('match_id', match_id);

			if (res.error) {
				throw new Error(res.error.message);
			}
		} catch (error) {
			console.error('An error occurred while deleting match_team records:', error);
			throw new Error('Failed to delete match_team records.');
		}
	}

	/**
	 * Delete all match_team records for a specific team.
	 * @param {number} team_id - The ID of the team.
	 * @returns {Promise<void>}
	 * @throws {Error} - Throws an error if there's an issue deleting the records.
	 */
	async deleteByTeam(team_id: number): Promise<void> {
		try {
			const res = await this.supabaseClient.from('match_teams').delete().eq('team_id', team_id);

			if (res.error) {
				throw new Error(res.error.message);
			}
		} catch (error) {
			console.error('An error occurred while deleting match_team records:', error);
			throw new Error('Failed to delete match_team records.');
		}
	}
}
