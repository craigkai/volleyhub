import type { DatabaseService } from './supabaseDatabaseService';
import { error } from '@sveltejs/kit';

export class Teams {
	private databaseService: DatabaseService;

	event_id: string;
	teams: TeamRow[] = [];

	/**
	 * The constructor for the Tournament class.
	 * @param {DatabaseService} databaseService - The service used to interact with the database.
	 */
	constructor(event_id: string, databaseService: DatabaseService) {
		this.databaseService = databaseService;
		this.event_id = event_id;
	}

	/**
	 * Load all teams for the current event.
	 * @returns {Promise<TeamRow[] | undefined>} - A promise that resolves to the loaded teams.
	 */
	async load(): Promise<TeamRow[] | undefined> {
		const res = await this.databaseService.loadTeams(this.event_id);
		if (res) {
			this.teams = res;
		}
		return this.teams;
	}

	/**
	 * Inserts a new team into Supabase. If a team with the same name and event ID exists,
	 * returns that team's ID.
	 * @param {Partial<TeamRow>} team - The team data to be created.
	 * @returns {Promise<number | undefined>} - A promise that resolves to the team ID.
	 */
	async create(team: Partial<TeamRow>): Promise<number | undefined> {
		try {
			const res: TeamRow | null = await this.databaseService.createTeam(team);
			return res?.id;
		} catch (err) {
			// Handle and log the error appropriately
			console.error('Failed to create team:', err);
			error(500, Error('Failed to create team'));
		}
	}

	/**
	 * Deletes a team from Supabase.
	 * @param {TeamRow} team - The team to be deleted.
	 * @returns {Promise<void>} - A promise that resolves when the team is successfully deleted.
	 */
	async delete(team: TeamRow): Promise<void> {
		try {
			await this.databaseService.deleteTeam(team);
		} catch (err) {
			// Handle and log the error appropriately
			console.error('Failed to delete team:', err);
			error(500, Error('Failed to delete team'));
		}
	}
}
