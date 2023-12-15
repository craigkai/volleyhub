import { error } from '@sveltejs/kit';
import type { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';
import { RoundRobin } from 'tournament-pairings';

export class Tournament {
	supabaseClient: supabaseClient;
	id?: string;
	settings: EventRow;
	matches?: MatchRow[];

	constructor(supabaseClient: supabaseClient) {
		this.supabaseClient = supabaseClient;
		this.settings = {};
	}
	/*
	Create a new event, this creates our event ONLY (tournament settings).
	*/
	async createEvent(input: EventRow): Promise<Tournament> {
		if (!input.name || !input.pools || !input.courts) {
			throw error(400, `Tournament create call does not have all required values`);
		}

		const ownerId = (await this.supabaseClient.auth.getUser()).data.user?.id;

		const res: PostgrestSingleResponse<EventRow> = await this.supabaseClient
			.from('events')
			.insert({
				owner: ownerId,
				name: input.name,
				pools: input.pools,
				courts: input.courts,
				date: input.date
			})
			.select()
			.single();

		if (res.error) {
			console.error('Failed to create new event');
			throw error(res.status, res.error);
		}

		this.id = res.data.id;
		this.settings = res.data;

		return this;
	}

	//  TODO: Handle adding/removing teams
	async updateTournament(id: string, input: EventRow): Promise<Tournament> {
		if (!input.name || !input.date || !input.pools || !input.courts) {
			throw error(400, `Tournament update call does not have all required values`);
		}

		const res: PostgrestSingleResponse<EventRow> = await this.supabaseClient
			.from('events')
			.update({
				name: input.name,
				pools: input.pools,
				courts: input.courts,
				date: input.date
			})
			.eq('id', id)
			.select();

		if (res.error) {
			throw error(res.status, res.error);
		}

		// TODO: Reload this if it was changed
		input.teams = this.settings.teams;

		this.settings = input;

		return this;
	}

	/*
		Attempt to load our event (tournament settings) via SupaBase, we load matches and teams elsewhere.
	*/
	async loadEvent(eventId?: string): Promise<Tournament> {
		if (!eventId) {
			throw error(400, 'Invalid event ID, are you sure your link is correct?');
		}

		try {
			const eventResponse: PostgrestSingleResponse<EventRow> = await this.supabaseClient
				.from('events')
				.select('*')
				.eq('id', eventId)
				.single();

			if (eventResponse.error) {
				throw error(eventResponse.status, eventResponse.error.details);
			}

			this.id = eventResponse.data.id;
			this.settings = eventResponse.data;

			this.settings.teams = await this.loadEventTeams();

			return this;
		} catch (err) {
			// Handle and log the error appropriately
			console.error('Failed to load event:', err);
			throw err;
		}
	}

	async deleteEvent(): Promise<void> {
		try {
			const eventResponse: PostgrestSingleResponse<EventRow> = await this.supabaseClient
				.from('events')
				.delete()
				.eq('id', this.id);

			if (eventResponse.error) {
				throw error(eventResponse.status, eventResponse.error.details);
			}

			// Delete all teams, which should cascade and delete all matches
			this.settings.teams.forEach((team: TeamRow) => {
				this.deleteTeam(team);
			});
		} catch (err) {
			// Handle and log the error appropriately
			console.error('Failed to load event:', err);
			throw err;
		}
	}

	async saveTournament(): Promise<void> {
		throw new Error('Function not implemented.');
	}

	/*
	Load all matches for the current tournament.
	*/
	async loadMatches(): Promise<MatchRow> {
		const res: PostgrestSingleResponse<MatchRow> = await this.supabaseClient
			.from('matches')
			.select('*, matches_team1_fkey(name), matches_team2_fkey(name)')
			.eq('event_id', this.id);

		if (res.error) {
			throw error(res.status, res.error);
		}
		this.matches = res.data;
		return res.data;
	}

	/**
	 * Insert new match.
	 */
	async saveMatch() {
		throw new Error('Function not implemented.');
	}

	async createMatches() {
		const matches = RoundRobin(this.settings.teams);

		// Delete all old matches as they are now invalid
		const deleteRes = await this.supabaseClient.from('matches').delete().eq('event_id', this.id);

		if (deleteRes.error) {
			console.error(`Failed to delete old matches: ${JSON.stringify(deleteRes.error)}`);
			throw error(deleteRes.status, deleteRes.error);
		}

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

			if (courtsAvailable === 0 || teamsAvailable.length < 2) {
				courtsAvailable = this.settings.courts;
				teamsAvailable = this.settings.teams.length;
				round = round + 1;
				totalRounds = totalRounds + 1;
			}

			match.court = this.settings.courts - courtsAvailable;
			match.round = round;

			courtsAvailable = courtsAvailable - 1;
			teamsAvailable = teamsAvailable - 2;

			userMatches.push({
				event_id: this.id,
				team1: match.player1.id,
				team2: match.player2.id,
				court: match.court,
				round: match.round
			});
		});

		// Call multi insert:
		const res = await this.supabaseClient
			.from('matches')
			.insert(userMatches)
			.select('*, matches_team1_fkey(name), matches_team2_fkey(name)');

		if (res.error) {
			console.error(`Failed to create new matches: ${JSON.stringify(res.error)}`);
			throw error(res.status, res.error);
		}

		this.matches = res.data;
		return this;
	}

	/*
	Either adding updating match metadata such as teams in the match or adding results.
	*/
	async updateMatch() {
		throw new Error('Function not implemented.');
	}

	/*
	Inserts new team into supabase, if a team exists where team name and event id match what we
	are trying to create, then return that team Id.
	*/
	async createTeam(team: TeamRow): Promise<TeamRow> {
		const res: PostgrestSingleResponse<TeamRow> = await this.supabaseClient
			.from('teams')
			.upsert({ ...team })
			.select();

		if (res.error) {
			console.error('Failed to create new team');
			throw error(res.status, res.error);
		}
		return res.data.id;
	}

	async deleteTeam(team: TeamRow): Promise<void> {
		const res: PostgrestSingleResponse<TeamRow> = await this.supabaseClient
			.from('teams')
			.delete()
			.eq('id', team.id);

		if (res.error) {
			console.error('Failed to delete team');
			throw error(res.status, res.error);
		}
	}

	async loadEventTeams() {
		const teamsResponse: PostgrestResponse<TeamRow> = await this.supabaseClient
			.from('teams')
			.select()
			.eq('event_id', this.id);

		if (teamsResponse.error) {
			throw error(teamsResponse?.status, teamsResponse.error);
		}
		this.settings.teams = teamsResponse.data;
		return this.settings.teams;
	}
}

/*
	Load all events for the provided owner Id.
	*/
export async function loadEvents(
	supabaseClient: supabaseClient,
	ownerId: string
): Promise<EventRow[]> {
	return await supabaseClient
		.from('events')
		.select('*')
		.eq('owner', ownerId)
		.then((res: PostgrestResponse<EventRow>) => {
			if (res?.error) {
				throw error(res.status, res?.error);
			}
			return res.data;
		});
}
