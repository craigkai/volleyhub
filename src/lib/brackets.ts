import { Event } from './event';
import { Matches } from './matches';

export class Brackets extends Matches {
	// Overload Matches load method to only load our bracket matches.
	async load() {
		const res = await this.databaseService.load(this.event_id, {
			column: 'type',
			operator: 'eq',
			value: 'bracket'
		});

		if (res) {
			this._update((that: Brackets) => {
				that.matches = res;
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

		// Generate matchups, this is only for the inital round of the bracket
		for (let i = 0; i < orderedTeamScores.length; i += 2) {
			const matchup: Partial<MatchRow> = {
				team1: teams.find((t) => t.name === orderedTeamScores[i])?.id as number,
				team2: teams.find((t) => t.name === orderedTeamScores[orderedTeamScores.length - 1 - i])
					?.id as number,
				event_id: this.event_id,
				round: 0,
				type: 'bracket',
				sibling_id: matchups.length > 0 ? matchups[matchups.length - 1].id : null
			};
			const res = await this.databaseService.insertMatches([matchup] as UserMatch[]);
			matchups.push(res[0]);
		}
		await this.load();

		return this.matches;
	}

	async nextRound(oldMatch: MatchRow, newMatch: MatchRow) {
		console.log('Next round');
		console.log(oldMatch, newMatch);

		//
		// Figure out if we know our next matchup and when we create a new match
		// set the parent_id of the match to the previous match.
	}
}
