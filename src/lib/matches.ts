import { error } from '@sveltejs/kit';
import type { DatabaseService } from './supabaseDatabaseService';
import { RoundRobin } from './roundRobin';
import type { RealtimeChannel } from '@supabase/supabase-js';

export class Matches {
	private databaseService: DatabaseService;

	event_id: string;
	matches?: MatchRow[];
	subscriptionChannel?: RealtimeChannel;

	constructor(event_id: string, databaseService: DatabaseService) {
		this.databaseService = databaseService;
		this.event_id = event_id;
	}

	/*
	Load all matches for the current tournament.
	*/
	async load() {
		const res = await this.databaseService.loadMatches(this.event_id);

		if (res) {
			this.matches = res;
		}

		this.subscriptionChannel = await this.databaseService.subscribeToChanges(this.event_id);
		return this.matches;
	}

	async createMatches(settings: EventRow, teams: TeamRow[]): Promise<Matches> {
		if (!teams || teams?.length === 0) {
			console.error("Can't generate matches without Teams");
			error(500, Error("Can't generate matches without Teams"));
		}

		if (!settings?.pools || settings.pools <= 0) {
			console.error("Can't generate matches without Pools");
			error(500, Error("Can't generate matches without Pools"));
		}

		if (!settings?.courts || settings.courts <= 0) {
			console.error("Can't generate matches without courts");
			error(500, Error("Can't generate matches without courts"));
		}

		try {
			let matches: Match[] = [];
			// If we have more pool play games than matches we got
			// back, then we need to generate some more.
			while (matches.length < settings.pools * teams.length) {
				matches = matches.concat(RoundRobin(teams));
			}
			// Delete all old matches as they are now invalid
			await this.databaseService.deleteMatchesByEvent(this.event_id);

			let courtsAvailable = settings.courts;
			let teamsAvailable = teams.length;
			let round = 0;

			let totalRounds = 0;
			const userMatches: UserMatch[] = [];
			matches.forEach((match: UserMatch) => {
				// Short circuit if we have more matches than pool play games
				// (you don't play every team).
				if (settings?.pools && userMatches.length === settings.pools * (teams.length / 2)) {
					return;
				}

				if (courtsAvailable === 0 || teamsAvailable < 2) {
					courtsAvailable = settings.courts;
					teamsAvailable = teams?.length;
					round = round + 1;
					totalRounds = totalRounds + 1;
				}

				match.court = settings.courts - courtsAvailable;
				match.round = round;

				courtsAvailable = courtsAvailable - 1;
				if (teamsAvailable >= 2) {
					userMatches.push({
						event_id: this.event_id,
						team1: match.player1.id,
						team2: match.player2.id,
						court: match.court,
						round: match.round
					});
				}
				teamsAvailable = teamsAvailable - 2;
			});

			// Call multi insert:
			const res = await this.databaseService.insertMatches(userMatches);
			if (res) {
				this.matches = res;
			}
			return this;
		} catch (err) {
			// Handle and log the error appropriately
			console.error('Failed to generate matches:', err);
			error(500, Error(err as string));
		}
	}

	async updateMatch(match: MatchRow): Promise<MatchRow> {
		const res = await this.databaseService.updateMatch(match);
		if (res) {
			match = res;
		}
		return match;
	}
}
