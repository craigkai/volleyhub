import { Event } from './event';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Base } from './base';
import { writable, type Unsubscriber, type Invalidator, type Subscriber } from 'svelte/store';
import { BracketsSupabaseDatabaseService } from './database/brackets';

export class Brackets extends Base {
	private databaseService: BracketsSupabaseDatabaseService;
	public subscribe: (
		run: Subscriber<Brackets>,
		invalidate?: Invalidator<Brackets> | undefined
	) => Unsubscriber;
	private _set: Function;
	private _update: Function;

	event_id: number;
	bracketMatches?: BracketRow[];

	constructor(event_id: number, databaseService: BracketsSupabaseDatabaseService) {
		super();
		const { subscribe, set, update } = writable(this);
		this.subscribe = subscribe;
		this._set = set;
		this._update = update;

		this.databaseService = databaseService;
		this.event_id = event_id;
	}

	async load() {
		const res = await this.databaseService.load(this.event_id);

		if (res) {
			this._update((that: Brackets) => {
				that.bracketMatches = res;
				return that;
			});
		}

		return this;
	}

	async createBracketMatches(event: Event, teams: TeamRow[]) {
		if (!((teams.length & (teams.length - 1)) === 0)) {
			this.handleError(
				400,
				'Number of teams must be a power of 2 for a single-elimination bracket.'
			);
		}

		let teamScores: TeamScores = {};
		this?.bracketMatches?.forEach((match: BracketRow) => {
			// We only care about pool play not bracket/playoff matches
			if (match.team1_score && match.team2_score) {
				if (!teamScores[match.brackets_team1_fkey.name]) {
					teamScores[match.brackets_team1_fkey.name] = 0;
				}

				if (!teamScores[match.brackets_team2_fkey.name]) {
					teamScores[match.brackets_team2_fkey.name] = 0;
				}

				if (event?.scoring === 'points') {
					teamScores[match.brackets_team1_fkey.name] += match?.team1_score || 0;
					teamScores[match.brackets_team2_fkey.name] += match?.team2_score || 0;
				} else {
					teamScores[match.brackets_team1_fkey.name] +=
						match.team1_score > match.team2_score ? 1 : 0;
					teamScores[match.brackets_team2_fkey.name] +=
						match.team2_score > match.team1_score ? 1 : 0;
				}
			}
		});
		const orderedTeamScores = Object.keys(teamScores).sort((a, b) => teamScores[b] - teamScores[a]);
		const matchups: any[] = [];

		// Generate matchups
		let court = 0;
		const numCourts = event.courts;
		for (let i = 0; i < orderedTeamScores.length; i += 2) {
			if (court === numCourts) {
				court = 0;
			}

			const matchup: Partial<BracketRow> = {
				team1: teams.find((t) => t.name === orderedTeamScores[i])?.id as number,
				team2: teams.find((t) => t.name === orderedTeamScores[orderedTeamScores.length - 1 - i])
					?.id as number,
				event_id: this.event_id,
				round: 0
			};
			court = court + 1;
			matchups.push(matchup);
		}
		this.bracketMatches = await this.databaseService.insertBracketMatches(matchups);

		return this.bracketMatches;
	}

	async handleBracketMatchUpdate(
		self: Brackets,
		payload: RealtimePostgresChangesPayload<BracketRow>,
		matchesArray: BracketRow[] | undefined
	): Promise<void> {
		const old = payload.old as MatchRow;
		const updated = payload.new as MatchRow;

		// If we don't have the matches loaded, load them
		if (Object.keys(old).length === 0) {
			self.load();
			return;
		}

		const matchIndex = matchesArray?.findIndex((m: BracketRow) => m.id === old.id);
		if (matchIndex !== undefined && matchIndex !== -1) {
			if (matchesArray) {
				updated.brackets_team1_fkey = matchesArray[matchIndex].brackets_team1_fkey;
				updated.brackets_team2_fkey = matchesArray[matchIndex].brackets_team2_fkey;
			}

			matchesArray?.splice(matchIndex, 1, updated as BracketRow);
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
