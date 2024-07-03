import { Event } from '../event.svelte';
import { findStandings } from '../standings.svelte';
import { Matches } from '../matches.svelte';

export class Brackets extends Matches {
	matches?: MatchRow[] = $state();

	// Overload Matches load method to only load our bracket matches.
	async load() {
		const res = await this.databaseService.load(this.event_id, {
			column: 'type',
			operator: 'eq',
			value: 'bracket'
		});

		if (res) this.matches = res;

		return this;
	}

	async createBracketMatches(event: Event, teams: TeamRow[], matches: MatchRow[]) {
		if (this.matches && this.matches.length > 0) {
			await this.databaseService.deleteMatchesByIds(this.matches.map((m) => m.id));
		}

		if (teams.length < 2) {
			return this.handleError(
				400,
				'Number of teams must be at least 2 for a single-elimination bracket.'
			);
		}

		const teamScores: TeamScores = await findStandings(matches ?? [], event, teams);
		const orderedTeamScores = Object.keys(teamScores).sort((a, b) => teamScores[b] - teamScores[a]);

		const matchups: Partial<MatchRow>[] = [];
		const leftOverTeams: number[] = [];

		// Generate matchups for the initial round of the bracket
		for (let i = 0; i < orderedTeamScores.length; i += 2) {
			const team1 = teams.find((t) => t.name === orderedTeamScores[i])?.id;
			const team2 = teams.find((t) => t.name === orderedTeamScores[i + 1])?.id;

			if (team1 === undefined) {
				leftOverTeams.push(team2!);
			} else if (team2 === undefined) {
				leftOverTeams.push(team1);
			} else {
				const matchup: Partial<MatchRow> = {
					team1,
					team2,
					event_id: this.event_id,
					round: 0,
					type: 'bracket'
				};

				const res = await this.databaseService.insertMatch(matchup as UserMatch);
				matchups.push(res);
			}
		}

		// Handle byes for the initial round
		if (leftOverTeams.length > 0) {
			for (const teamWithBye of leftOverTeams) {
				const byeMatchup: Partial<MatchRow> = {
					team1: teamWithBye,
					team2: null,
					event_id: this.event_id,
					round: 0,
					type: 'bracket'
				};
				const res = await this.databaseService.insertMatch(byeMatchup as UserMatch);
				matchups.push(res);
			}
		}

		// Calculate the number of rounds needed
		const totalRounds = Math.ceil(Math.log2(teams.length));

		// Generate empty matchups for subsequent rounds
		const parentMatches = [...matchups];
		for (let currentRound = 1; currentRound < totalRounds; currentRound++) {
			const numMatches = 2 ** (totalRounds - currentRound - 1);

			for (let i = 0; i < numMatches; i++) {
				const emptyMatchup: Partial<MatchRow> = {
					event_id: this.event_id,
					round: currentRound,
					type: 'bracket'
				};

				const res = await this.databaseService.insertMatch(emptyMatchup as UserMatch);
				matchups.push(res);

				const parent1 = parentMatches.pop();
				const parent2 = parentMatches.pop();
				if (parent1) parent1.child_id = res.id;
				if (parent2) parent2.child_id = res.id;

				await Promise.all(
					[parent1, parent2].map((parent) => (parent ? this.put(parent) : Promise.resolve()))
				);
			}
		}

		return this.matches;
	}

	async nextRound(newMatch: MatchRow) {
		try {
			const child = this.matches?.find((m) => m.id === newMatch.child_id);
			const otherParent = this.matches?.find(
				(m) => m.child_id === newMatch.child_id && m.id !== newMatch.id
			);
			const otherParentComplete = this.isOtherParentComplete(otherParent);

			if (this.canProceedToNextRound(newMatch, otherParentComplete, child)) {
				const winnerOfNew = this.getMatchWinner(newMatch);
				const winnerOfOtherParent = this.getWinnerOfOtherParent(otherParent, child);

				if (this.childHasCorrectTeams(child, winnerOfNew)) {
					console.debug('Child match already has the correct teams');
					return;
				}

				await this.updateChildMatch(child, winnerOfNew, winnerOfOtherParent);
			} else {
				console.debug('Parent matches not complete');
			}
		} catch (error) {
			this.handleError(500, `An error occurred in nextRound: ${error}`);
		}
	}

	isOtherParentComplete(otherParent?: MatchRow): boolean {
		return this.matches!.length > 3 ? otherParent?.state === 'COMPLETE' : true;
	}

	canProceedToNextRound(
		newMatch: MatchRow,
		otherParentComplete: boolean,
		child?: MatchRow
	): boolean {
		return newMatch.state === 'COMPLETE' && otherParentComplete && !!child;
	}

	getMatchWinner(match: MatchRow): string | null {
		return match.team1_score! > match.team2_score! ? match.team1 : match.team2;
	}

	getWinnerOfOtherParent(otherParent?: MatchRow, child?: MatchRow): string | null {
		if (otherParent?.state === 'COMPLETE' && otherParent.team1_score !== null) {
			return otherParent.team1_score > otherParent.team2_score
				? otherParent.team1
				: otherParent.team2;
		}
		return child?.team1 || child?.team2;
	}

	childHasCorrectTeams(child: MatchRow, winnerOfNew: string | null): boolean {
		return child.team1 === winnerOfNew || child.team2 === winnerOfNew;
	}

	async updateChildMatch(
		child: MatchRow,
		winnerOfNew: string | null,
		winnerOfOtherParent: string | null
	): Promise<void> {
		child.team1 = winnerOfNew;
		child.team2 = winnerOfOtherParent;
		const newBracketMatch: Partial<MatchRow> = {
			...child,
			team1_score: 0,
			team2_score: 0
		};
		await this.put(newBracketMatch as MatchRow);
	}
}
