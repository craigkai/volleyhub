import type { TeamsSupabaseDatabaseService } from '$lib/database/teams';
import { Base } from './base';

export class Teams extends Base {
	private databaseService: TeamsSupabaseDatabaseService;
	eventId?: number;
	teams = $state<TeamRow[]>([]);

	/**
	 * The constructor for the Teams class.
	 * @param {TeamsSupabaseDatabaseService} databaseService - The service used to interact with the database.
	 */
	constructor(databaseService: TeamsSupabaseDatabaseService) {
		super();
		this.databaseService = databaseService;
	}

	/**
	 * Load all teams for the current event.
	 * @returns {Promise<TeamRow[] | undefined>} - A promise that resolves to the loaded teams.
	 */
	async load(eventId: number): Promise<TeamRow[] | undefined> {
		if (!eventId) {
			this.handleError(400, 'Invalid event ID');
			return undefined;
		}

		this.eventId = eventId;

		try {
			const res = await this.databaseService.load(eventId);
			if (!res) {
				console.warn('Failed to load teams for event', eventId);
				return undefined;
			}
			this.teams = res;
			return this.teams;
		} catch (err) {
			this.handleError(500, `Failed to load teams: ${(err as Error).message}`);
			return undefined;
		}
	}

	/**
	 * Inserts a new team into the database. If a team with the same name and event ID exists,
	 * returns that team's ID.
	 * @param {Partial<TeamRow>} team - The team data to be created.
	 * @returns {Promise<number | undefined>} - A promise that resolves to the team ID.
	 */
	async create(team: Partial<TeamRow>): Promise<number | undefined> {
		try {
			const res = await this.databaseService.createTeam(team);
			if (res) {
				return res.id;
			}
			console.warn('Failed to create team', team);
			return undefined;
		} catch (err) {
			this.handleError(500, `Failed to create team: ${(err as Error).message}`);
			return undefined;
		}
	}

	/**
	 * Deletes a team from the database.
	 * @param {TeamRow} team - The team to be deleted.
	 * @returns {Promise<void>} - A promise that resolves when the team is successfully deleted.
	 */
	async delete(team: TeamRow): Promise<void> {
		try {
			await this.databaseService.deleteTeam(team);
		} catch (err) {
			this.handleError(500, `Failed to delete team: ${(err as Error).message}`);
		}
	}

	/**
	 * Updates a team in the database.
	 * @param {TeamRow} team - The team to be updated.
	 * @returns {Promise<TeamRow | undefined>} - A promise that resolves to the updated team.
	 */
	async update(team: TeamRow): Promise<TeamRow | undefined> {
		try {
			const res = await this.databaseService.put(team);
			if (res) {
				this.teams.splice(
					this.teams.findIndex((t) => t.id === team.id),
					1,
					res
				);

				return res;
			}
			console.warn('Failed to update team', team);
			this.handleError(500, 'Failed to update team');
		} catch (err) {
			this.handleError(500, `Failed to update team: ${(err as Error).message}`);
			return undefined;
		}
	}
}

// const TEAMS_KEY = Symbol('Teams');
