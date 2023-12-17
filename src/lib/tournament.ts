import { error } from '@sveltejs/kit';
import { RoundRobin } from './roundRobin';
import type { DatabaseService } from './SupabaseDatabaseService';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

export class Tournament {
	private databaseService: DatabaseService;
	supabaseClient: supabaseClient;
	id: string;
	settings: EventRow;
	matches?: MatchRow[];

	constructor(databaseService: DatabaseService, supabaseClient: supabaseClient) {
		this.databaseService = databaseService;
		this.supabaseClient = supabaseClient;
		this.settings = {};
		this.id = '';
	}

	/*
	Create a new event, this creates our event ONLY (tournament settings).
	*/
	async createEvent(input: EventRow): Promise<Tournament> {
		if (!input.name || !input.pools || !input.courts) {
			error(400, Error(`Tournament create call does not have all required values`));
		}
		const ownerId = (await this.databaseService.getCurrentUser()).id;

		const res: EventRow = await this.databaseService.createEvent(input, ownerId);

		this.id = res.id;
		this.settings = res;

		return this;
	}

	async updateTournament(id: string, input: EventRow): Promise<Tournament> {
		if (!input.name || !input.date || !input.pools || !input.courts) {
			error(400, `Tournament update call does not have all required values`);
		}

		const res: EventRow = await this.databaseService.updateTournament(id, input);

		this.settings = res;
		return this;
	}

	/*
		Attempt to load our event (tournament settings) via SupaBase, we load matches and teams elsewhere.
	*/
	async loadEvent(eventId?: string): Promise<Tournament> {
		if (!eventId) {
			error(400, Error('Invalid event ID, are you sure your link is correct?'));
		}

		const eventResponse: EventRow = await this.databaseService.loadEvent(eventId);
		this.id = eventResponse.id;

		// if we did not an Id value back, something has gone wrong!
		if (this.id) {
			this.settings = eventResponse;
			this.settings.teams = await this.loadTeams();
		} else {
			console.error(`Failed to load event ${JSON.stringify(eventResponse)}`);
			error(404, Error(`Could not find event with Id ${eventId}`));
		}
		return this;
	}

	async deleteEvent(): Promise<void> {
		try {
			await this.databaseService.deleteEvent(this.id);

			// Delete all teams, which should cascade and delete all matches
			this.settings?.teams?.forEach((team: TeamRow) => {
				this.databaseService.deleteTeam(team);
			});
		} catch (err) {
			// Handle and log the error appropriately
			console.error('Failed to delete event:', err);
			throw err;
		}
	}

	/*
	Load all matches for the current tournament.
	*/
	async loadMatches(): Promise<MatchRow> {
		this.matches = await this.databaseService.loadMatches(this.id);
		return this.matches;
	}

	async createMatches() {
		try {
			const matches = RoundRobin(this.settings.teams);

			// Delete all old matches as they are now invalid
			await this.databaseService.deleteMatchesByEvent(this.id);

			let courtsAvailable = this.settings.courts;
			let teamsAvailable = this.settings.teams.length;
			let round = 0;

			let totalRounds = 0;
			const userMatches: UserMatch[] = [];
			matches.forEach((match: UserMatch) => {
				// Short circuit if we have more matches than pool play games
				// (you don't play every team).
				if (totalRounds === this.settings.pools) {
					return;
				}

				if (courtsAvailable === 0 || teamsAvailable < 2) {
					courtsAvailable = this.settings.courts;
					teamsAvailable = this.settings.teams.length;
					round = round + 1;
					totalRounds = totalRounds + 1;
				}

				match.court = this.settings.courts - courtsAvailable;
				match.round = round;

				courtsAvailable = courtsAvailable - 1;
				if (teamsAvailable >= 2) {
					userMatches.push({
						event_id: this.id,
						team1: match.player1.id,
						team2: match.player2.id,
						court: match.court,
						round: match.round
					});
				}
				teamsAvailable = teamsAvailable - 2;
			});

			// Call multi insert:
			this.matches = await this.databaseService.insertMatches(userMatches);
			return this;
		} catch (err) {
			// Handle and log the error appropriately
			console.error('Failed to generate matches:', err);
			error(500, Error(err as string));
		}
	}

	async updateMatch<T>(match: MatchRow): Promise<PostgrestSingleResponse<T>> {
		const res = await this.databaseService.updateMatch(match);
		match = res.data;
		return res;
	}


	/*
	Inserts new team into supabase, if a team exists where team name and event id match what we
	are trying to create, then return that team Id.
	*/
	async createTeam(team: TeamRow): Promise<TeamRow> {
		const res: TeamRow = await this.databaseService.createTeam(team);
		return res.id;
	}

	async loadTeams(): Promise<TeamRow[]> {
		this.settings.teams = await this.databaseService.loadTeams(this.id);
		return this.settings.teams;
	}

	async deleteTeam(team: TeamRow): Promise<void> {
		this.settings.teams = await this.databaseService.deleteTeam(team);
	}
}
