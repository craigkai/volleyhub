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
		const teamCount = teams.length;

		if (teamCount < 2) {
			this.handleError(400, 'Number of teams must be at least 2 for a bracket.');
		}

		let teamScores: TeamScores = {};
		matches.forEach((match: MatchRow) => {
			// Existing logic to calculate team scores
		});

		const orderedTeamScores = Object.keys(teamScores).sort((a, b) => teamScores[b] - teamScores[a]);
		const matchups: any[] = [];

		// Generate matchups for the initial round of the bracket
		for (let i = 0; i < teamCount - 1; i += 2) {
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

		// Generate the entire bracket structure for subsequent rounds
		const numberOfRounds = Math.ceil(Math.log2(teamCount));

		for (let round = 1; round < numberOfRounds; round++) {
			const roundMatches: Partial<MatchRow>[] = [];

			for (let i = 0; i < Math.ceil(teamCount / Math.pow(2, round)); i++) {
				const matchup: Partial<MatchRow> = {
					event_id: this.event_id,
					round,
					type: 'bracket'
				};

				roundMatches.push(matchup);
			}

			const res = await this.databaseService.insertMatches(roundMatches as UserMatch[]);
			matchups.push(...res);
		}

		await this.load();

		return this.matches;
	}

	async nextRound(oldMatchId: { id: number }, newMatch: MatchRow) {
		try {
			if (newMatch && newMatch.team1_score && newMatch.team2_score) {
				const parentMatches = this.matches?.filter((m) => m.child_id === newMatch.id);

				// if (siblingMatch && siblingMatch.team1_score && siblingMatch.team2_score) {
				// 	const childMatch = this.matches?.find((m) => m.parent_id === newMatch.id);

				// 	if (childMatch) {
				// 		const childTeams = [childMatch.team1, childMatch.team2];
				// 		const correctTeams = [newMatch.team1, newMatch.team2];

				// 		if (childTeams.includes(correctTeams[0]) && childTeams.includes(correctTeams[1])) {
				// 			console.debug('Child match already has the correct teams');
				// 			return;
				// 		}

				// 		// Delete the incorrect child match
				// 		await this.databaseService.deleteMatch(childMatch.id);
				// 	}

				const newBracketMatch: Partial<MatchRow> = {
					team1: newMatch.team1_score > newMatch.team2_score ? newMatch.team1 : newMatch.team2,
					team2:
						siblingMatch.team1_score > siblingMatch.team2_score
							? siblingMatch.team1
							: siblingMatch.team2,
					event_id: this.event_id,
					round: newMatch.round + 1,
					type: 'bracket'
				};

				console.log('Inserting new match', newBracketMatch);

				// Uncomment the following line when you're ready to insert the new bracket match
				await this.databaseService.insertMatches([newBracketMatch] as UserMatch[]);

				// TOOD: Update parents with child_id of new match
				// }
			} else {
				console.debug('Sibling match not complete');
			}
		} catch (error) {
			this.handleError(500, `An error occurred in nextRound ${error}`);
			// Handle the error appropriately (e.g., log, throw, or return an error response)
		}
	}
}
