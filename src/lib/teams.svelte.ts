import { TeamsSupabaseDatabaseService } from '$lib/database/teams';
import { Base } from './base';
import { TeamSupabaseDatabaseService } from './database/team';
import { Team } from './team.svelte';

/**
 * The Teams class is responsible for managing team-related operations.
 * It extends the Base class and uses the TeamsSupabaseDatabaseService to interact with the database.
 */
export class Teams extends Base {
	private databaseService: TeamsSupabaseDatabaseService;
	eventId?: number;
	teams = $state<Team[]>([]);

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
	async load(eventId: number): Promise<Team[] | undefined> {
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
			const teams: Team[] = [];

			const teamSupabaseDatabaseService = new TeamSupabaseDatabaseService(
				this.databaseService.supabaseClient
			);

			for (let i = 0; i < res.length; i++) {
				let team = new Team(teamSupabaseDatabaseService);

				const teamRow = res[i];
				Object.assign(team, teamRow);
				teams.push(team);
			}

			this.teams = teams;
			return this.teams;
		} catch (err) {
			this.handleError(500, `Failed to load teams: ${(err as Error).message}`);
			return undefined;
		}
	}

	/**
	 * Inserts a new team into the database. If a team with the same name and event ID exists,
	 * returns that team's ID.
	 * @param {Partial<Team>} team - The team data to be created.
	 * @returns {Promise<Team | undefined>} - A promise that resolves to the team ID.
	 */
	async create(team: Partial<TeamRow>): Promise<Team | undefined> {
		try {
			const res = await this.databaseService.create(team);
			if (res) {
				const teamSupabaseDatabaseService = new TeamSupabaseDatabaseService(
					this.databaseService.supabaseClient
				);

				const newTeam = new Team(teamSupabaseDatabaseService);
				await newTeam.load(res.id);

				return newTeam;
			}
			console.warn('Failed to create team', team);
			return undefined;
		} catch (err) {
			this.handleError(500, `Failed to create team: ${(err as Error).message}`);
			return undefined;
		}
	}
}

// const TEAMS_KEY = Symbol('Teams');
