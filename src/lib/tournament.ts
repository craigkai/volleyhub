import { error } from '@sveltejs/kit';
import type { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';
import { RoundRobin } from 'tournament-pairings';
import type { Match } from 'tournament-pairings/dist/Match';
import { success } from './toast';

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
		if (!input.teams || !input.pools || !input.courts) {
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

		if (this.id && this.settings) {
			const teamsIds: string[] = await Promise.all(
				input.teams.map(async (team: string) => {
					return await this.createTeam(team, this.id as string);
				})
			);

			this.settings.teams = teamsIds;
		}

		return this;
	}

	//  TODO: Handle adding/removing teams
	async updateTournament(id: string, input: EventRow): Promise<Tournament> {
		if (!input.teams || !input.pools || !input.courts) {
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

		if (this.id && this.settings) {
			const teamsIds: string[] = [];
			input.teams.forEach(async (team: string) => {
				await this.createTeam(team, this.id as string).then((id) => teamsIds.push(id as string));
			});

			this.settings.teams = teamsIds;
		}

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

			const teamsResponse: PostgrestResponse<TeamRow> = await this.supabaseClient
				.from('teams')
				.select()
				.eq('event_id', eventId);

			if (teamsResponse.error) {
				throw error(teamsResponse?.status, teamsResponse.error);
			}

			this.settings.teams = teamsResponse.data;

			return this;
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
		let matches = RoundRobin(this.settings.teams);
		const self = this;

		// Delete all old matches as they are now invalid
		const deleteRes = await this.supabaseClient.from('matches').delete().eq('event_id', this.id);

		if (deleteRes.error) {
			console.error(`Failed to create new matches: ${JSON.stringify(deleteRes.error)}`);
			throw error(deleteRes.status, deleteRes.error);
		}

		// Call multi insert:
		const res = await this.supabaseClient
			.from('matches')
			.insert(
				matches.map((match: Match) => {
					return {
						event_id: self.id,
						team1: match.player1.id,
						team2: match.player2.id
					};
				})
			)
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
	async createTeam(team: string | TeamRow, eventId: string): Promise<string> {
		let res: PostgrestSingleResponse<TeamRow>;
		if (typeof team === 'string') {
			res = await this.supabaseClient
				.from('teams')
				.upsert({ name: team, event_id: eventId })
				.select();
		} else {
			res = await this.supabaseClient
				.from('teams')
				.upsert({ ...team })
				.select();
		}

		if (res.error) {
			console.error('Failed to create new team');
			throw error(res.status, res.error);
		}
		return res.data.id;
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
