import type { TeamsSupabaseDatabaseService } from '$lib/database/teams';
import { Base } from './base';

export class Teams extends Base {
	private databaseService: TeamsSupabaseDatabaseService;

	event_id: number;
	teams: TeamRow[] = [];

	/**
	 * The constructor for the Teams class.
	 * @param {number} event_id - The ID of the event.
	 * @param {TeamsSupabaseDatabaseService} databaseService - The service used to interact with the database.
	 */
	constructor(event_id: number, databaseService: TeamsSupabaseDatabaseService) {
		super();
		this.databaseService = databaseService;
		this.event_id = event_id;
	}

	/**
	 * Load all teams for the current event.
	 * @returns {Promise<TeamRow[] | undefined>} - A promise that resolves to the loaded teams.
	 */
	async load(): Promise<TeamRow[] | undefined> {
		const res = await this.databaseService.loadTeams(this.event_id);
		if (res === null || res === undefined) {
			console.warn('Failed to load teams for event', this.event_id);
			return undefined;
		}
		this.teams = res;
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
			this.handleError(500, `Failed to create team: ${(err as Error).message}`);
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
			this.handleError(500, 'Failed to delete team');
		}
	}
}
