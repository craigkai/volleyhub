import { Base } from './base';
import type { MatchSupabaseDatabaseService } from './database/match';

/**
 * The Match class represents a match in a tournament.
 * It provides methods to load, create, update, and manage.
 */
export class Match extends Base {
	public databaseService: MatchSupabaseDatabaseService;
	child_id?: number;
	court?: number;
	created_at?: string;
	event_id?: number;
	id?: number;
	ref?: number;
	round?: number;
	state?: MatchState;
	team1?: number;
	team1_score?: number;
	team2?: number;
	team2_score?: number;
	type?: string;

	constructor(databaseService: MatchSupabaseDatabaseService) {
		super();
		this.databaseService = databaseService;
	}

	/**
	 * Load matches from the database.
	 * @param {number} id - The ID of the event.
	 * @returns {Promise<Matches>} - Returns a promise that resolves to the Matches instance.
	 */
	async load(id: number): Promise<Match> {
		try {
			const res = await this.databaseService.load(id);
			this.event_id = id;

			if (res) Object.assign(this, res);
		} catch (err) {
			this.handleError(500, `Failed to load match: ${(err as Error).message}`);
		}
		return this;
	}

	/**
	 * Update a specific match in the database.
	 * @param {MatchRow} match - The match details to be updated.
	 * @returns {Promise<MatchRow | null>} - Returns a promise that resolves to the updated match.
	 */
	async update(match: Match): Promise<Match | null> {
		const updatedMatch = await this.databaseService.put(match);

		if (!updatedMatch) {
			this.handleError(500, 'Failed to update match.');
		}

		Object.assign(this, updatedMatch);

		return this;
	}
}
