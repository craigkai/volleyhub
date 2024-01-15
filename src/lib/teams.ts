import type { DatabaseService } from './SupabaseDatabaseService';

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

	async load(): Promise<TeamRow[] | undefined> {
		const res = await this.databaseService.loadTeams(this.event_id);
		if (res) {
			this.teams = res;
		}
		return this.teams;
	}

	/*
    Inserts new team into supabase, if a team exists where team name and event id match what we
    are trying to create, then return that team Id.
    */
	async createTeam(team: Partial<TeamRow>): Promise<number | undefined> {
		const res: TeamRow | null = await this.databaseService.createTeam(team);
		return res?.id;
	}

	async deleteTeam(team: TeamRow): Promise<void> {
		await this.databaseService.deleteTeam(team);
	}
}
