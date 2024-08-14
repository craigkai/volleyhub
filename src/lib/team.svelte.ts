import { Base } from './base';
import type { TeamSupabaseDatabaseService } from './database/team';

export class Team extends Base {
	private databaseService: TeamSupabaseDatabaseService;

	created_at?: string;
	event_id?: number;
	id?: number;
	name?: string = $state();
	state?: string = $state();

	constructor(databaseService: TeamSupabaseDatabaseService) {
		super();
		this.databaseService = databaseService;
	}

	async load(id: number): Promise<Team | null> {
		try {
			const res = await this.databaseService.load(id);
			if (res) {
				Object.assign(this, res);
			}
			return this;
		} catch (error) {
			console.error('An error occurred while loading the team:', error);
			throw error;
		}
	}

	/**
	 * Inserts a new team into the database. If a team with the same name and event ID exists,
	 * returns that team's ID.
	 * @param {Partial<Team>} team - The team data to be created.
	 * @returns {Promise<number | undefined>} - A promise that resolves to the team ID.
	 */
	async create(team: Partial<TeamRow>): Promise<number | undefined> {
		try {
			const res = await this.databaseService.create(team);
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
	 * @param {Team} team - The team to be deleted.
	 * @returns {Promise<void>} - A promise that resolves when the team is successfully deleted.
	 */
	async delete(team: Team): Promise<void> {
		try {
			await this.databaseService.deleteTeam(team);
		} catch (err) {
			this.handleError(500, `Failed to delete team: ${(err as Error).message}`);
		}
	}

	/**
	 * Updates a team in the database.
	 * @param {Team} team - The team to be updated.
	 * @returns {Promise<Team | undefined>} - A promise that resolves to the updated team.
	 */
	async update(team: Team): Promise<Team | undefined> {
		try {
			const res = await this.databaseService.put(team);
			if (res) {
				Object.assign(this, res);

				return this;
			}
			console.warn('Failed to update team', team);
			this.handleError(500, 'Failed to update team');
		} catch (err) {
			this.handleError(500, `Failed to update team: ${(err as Error).message}`);
			return undefined;
		}
	}
}
