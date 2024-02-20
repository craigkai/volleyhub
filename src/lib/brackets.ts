import { Event } from './event';
import { findStandings } from './helper';
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
		if (teams.length < 2) {
			this.handleError(400, 'Number of teams must be at least 2 for a single-elimination bracket.');
		}

		const teamScores: TeamScores = await findStandings(matches ?? [], event, teams);

		const orderedTeamScores = Object.keys(teamScores).sort((a, b) => teamScores[b] - teamScores[a]);
		const matchups: Partial<MatchRow>[] = [];

		// Generate matchups for the initial round of the bracket
		for (let i = 0; i < orderedTeamScores.length; i += 2) {
			const matchup: Partial<MatchRow> = {
				team1: teams.find((t) => t.name === orderedTeamScores[i])?.id as number,
				team2: teams.find((t) => t.name === orderedTeamScores[i + 1])?.id as number,
				event_id: this.event_id,
				round: 0,
				type: 'bracket'
			};
			const res = await this.databaseService.insertMatches([matchup] as UserMatch[]);
			matchups.push(res[0]);
		}

		await this.load();

		// Generate empty matchups for subsequent rounds
		const totalRounds = Math.floor(Math.log2(teams.length));
		for (let currentRound = 1; currentRound <= totalRounds; currentRound++) {
			for (let i = 0; i < 2 ** (totalRounds - currentRound); i++) {
				const emptyMatchup: Partial<MatchRow> = {
					event_id: this.event_id,
					round: currentRound,
					type: 'bracket'
				};
				const res = await this.databaseService.insertMatches([emptyMatchup] as UserMatch[]);
				matchups.push(res[0]);
			}
		}

		return this.matches;
	}

	async nextRound(oldMatchId: { id: number }, newMatch: MatchRow) {
		try {
			if (newMatch && newMatch.team1_score && newMatch.team2_score) {
				const siblingMatch = this.matches?.find((m) => m.sibling_id === newMatch.id);

				if (siblingMatch && siblingMatch.team1_score && siblingMatch.team2_score) {
					const childMatch = this.matches?.find((m) => m.parent_id === newMatch.id);

					if (childMatch) {
						const childTeams = [childMatch.team1, childMatch.team2];
						const correctTeams = [newMatch.team1, newMatch.team2];

						if (childTeams.includes(correctTeams[0]) && childTeams.includes(correctTeams[1])) {
							console.debug('Child match already has the correct teams');
							return;
						}

						// Delete the incorrect child match
						await this.databaseService.deleteMatch(childMatch.id);
					}

					const newBracketMatch: Partial<MatchRow> = {
						team1: newMatch.team1_score > newMatch.team2_score ? newMatch.team1 : newMatch.team2,
						team2:
							siblingMatch.team1_score > siblingMatch.team2_score
								? siblingMatch.team1
								: siblingMatch.team2,
						event_id: this.event_id,
						round: newMatch.round + 1,
						type: 'bracket',
						sibling_id: null,
						parent_id: newMatch.id
					};

					console.log('Inserting new match', newBracketMatch);

					// Uncomment the following line when you're ready to insert the new bracket match
					await this.databaseService.insertMatches([newBracketMatch] as UserMatch[]);
				}
			} else {
				console.debug('Sibling match not complete');
			}
		} catch (error) {
			this.handleError(500, `An error occurred in nextRound ${error}`);
			// Handle the error appropriately (e.g., log, throw, or return an error response)
		}
	}
}
