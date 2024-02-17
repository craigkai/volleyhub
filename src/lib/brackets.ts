import { Event } from './event';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Base } from './base';
import { writable, type Unsubscriber, type Invalidator, type Subscriber } from 'svelte/store';
import type { MatchesSupabaseDatabaseService } from './database/matches';

export class Brackets extends Base {
	private databaseService: MatchesSupabaseDatabaseService;
	public subscribe: (
		run: Subscriber<Brackets>,
		invalidate?: Invalidator<Brackets> | undefined
	) => Unsubscriber;
	private _set: Function;
	private _update: Function;

	event_id: number;
	bracketMatches?: MatchRow[];

	constructor(event_id: number, databaseService: MatchesSupabaseDatabaseService) {
		super();
		const { subscribe, set, update } = writable(this);
		this.subscribe = subscribe;
		this._set = set;
		this._update = update;

		this.databaseService = databaseService;
		this.event_id = event_id;
	}

	async load() {
		const res = await this.databaseService.load(this.event_id, {
			column: 'type',
			operator: 'eq',
			value: 'bracket'
		});

		if (res) {
			this._update((that: Brackets) => {
				that.bracketMatches = res;
				return that;
			});
		}

		return this;
	}

	async createBracketMatches(event: Event, teams: TeamRow[], matches: MatchRow[]) {
		if (!((teams.length & (teams.length - 1)) === 0)) {
			this.handleError(
				400,
				'Number of teams must be a power of 2 for a single-elimination bracket.'
			);
		}

		let teamScores: TeamScores = {};
		matches.forEach((match: MatchRow) => {
			// We only care about pool play not bracket/playoff matches
			if (match.team1_score && match.team2_score) {
				if (!teamScores[match.matches_team1_fkey.name]) {
					teamScores[match.matches_team1_fkey.name] = 0;
				}

				if (!teamScores[match.matches_team2_fkey.name]) {
					teamScores[match.matches_team2_fkey.name] = 0;
				}

				if (event?.scoring === 'points') {
					teamScores[match.matches_team1_fkey.name] += match?.team1_score || 0;
					teamScores[match.matches_team2_fkey.name] += match?.team2_score || 0;
				} else {
					teamScores[match.matches_team1_fkey.name] +=
						match.team1_score > match.team2_score ? 1 : 0;
					teamScores[match.matches_team2_fkey.name] +=
						match.team2_score > match.team1_score ? 1 : 0;
				}
			}
		});
		const orderedTeamScores = Object.keys(teamScores).sort((a, b) => teamScores[b] - teamScores[a]);
		const matchups: any[] = [];

		const rounds = (orderedTeamScores.length = Math.pow(
			2,
			Math.ceil(Math.log2(orderedTeamScores.length))
		));

		// Generate matchups, this is only for the inital round of the bracket
		for (let i = 0; i < orderedTeamScores.length; i += 2) {
			const matchup: Partial<MatchRow> = {
				team1: teams.find((t) => t.name === orderedTeamScores[i])?.id as number,
				team2: teams.find((t) => t.name === orderedTeamScores[orderedTeamScores.length - 1 - i])
					?.id as number,
				event_id: this.event_id,
				round: 0,
				type: 'bracket'
			};
			matchups.push(matchup);
		}
		const bracketMatches = await this.databaseService.insertMatches(matchups);
		this._update((that: Brackets) => {
			that.bracketMatches = bracketMatches;
			return that;
		});

		return this.bracketMatches;
	}

	async handleBracketMatchUpdate(
		self: Brackets,
		payload: RealtimePostgresChangesPayload<MatchRow>
	): Promise<void> {
		const old = payload.old as MatchRow;
		const updated = payload.new as MatchRow;

		// If we don't have the matches loaded, load them
		if (Object.keys(old).length === 0 || Object.keys(updated).length === 0) {
			self.load();
			return;
		}

		const matchesArray = self.bracketMatches;

		const matchIndex = matchesArray?.findIndex((m: MatchRow) => m.id === old.id);
		if (matchIndex !== undefined && matchIndex !== -1) {
			if (matchesArray) {
				updated.matches_team1_fkey = matchesArray[matchIndex].matches_team1_fkey;
				updated.matches_team2_fkey = matchesArray[matchIndex].matches_team2_fkey;
			}

			matchesArray?.splice(matchIndex, 1, updated as MatchRow);
			const matches = matchesArray;

			self._update((that: Brackets) => {
				that.bracketMatches = matches;
				return that;
			});
		} else {
			self.handleError(400, `Failed to find bracket match to update.`);
		}
	}

	async subscribeToBracketMatches(): Promise<RealtimeChannel> {
		return await this.databaseService.subscribeToChanges(
			this,
			this.handleBracketMatchUpdate,
			'brackets',
			'event_id=eq.' + this.event_id
		);
	}
}
