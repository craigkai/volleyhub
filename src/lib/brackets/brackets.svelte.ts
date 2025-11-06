import { Event } from '../event.svelte';
import { findStandings } from '../standings.svelte';
import { Matches } from '../matches.svelte';
import { Match } from '$lib/match.svelte';
import { MatchSupabaseDatabaseService } from '$lib/database/match';
import type { Team } from '$lib/team.svelte';

export class Brackets extends Matches {
	matches = $state<Match[]>([]);
	type = 'bracket';

	// Overload Matches load method to only load our bracket matches.
	async load(eventId: number): Promise<this> {
		try {
			const res = await this.databaseService.load(eventId, {
				column: 'type',
				operator: 'eq',
				value: 'bracket'
			});

			const matchSupabaseDatabaseService = new MatchSupabaseDatabaseService(
				this.databaseService.supabaseClient
			);
			const matches: Match[] = [];
			if (res) {
				for (let i = 0; i < res.length; i++) {
					let match = new Match(matchSupabaseDatabaseService);

					const matchRow = res[i];

					try {
						await match.load(matchRow.id);

						matches.push(match);
					} catch (err: any) {
						this.handleError(500, `Faild to load team ${err}`);
					}
				}
				this.matches = matches;
			}
		} catch (error) {
			this.handleError(500, `Failed to load bracket matches: ${(error as Error).message}`);
		}
		return this;
	}

	async createBracketMatches(event: Event, teams: Team[], matches: Match[]) {
		try {
			if (this.matches && this.matches.length > 0) {
				await this.databaseService.deleteMatchesByIds(
					this.matches.map((m) => m.id).filter((id): id is number => id !== undefined)
				);
			}

			if (teams.length < 2) {
				return this.handleError(
					400,
					'Number of teams must be at least 2 for a single-elimination bracket.'
				);
			}

			const teamScoresArray = findStandings(matches, teams);
			const orderedTeamNames = teamScoresArray
				.sort((a, b) => b.wins - a.wins || b.pointsDiff - a.pointsDiff)
				.map((score) => score.name);

			const matchups: Partial<MatchRow>[] = [];
			const leftOverTeams: number[] = [];

			// Generate matchups for the initial round of the bracket
			for (let i = 0; i < orderedTeamNames.length; i += 2) {
				const team1 = teams.find((t) => t.name === orderedTeamNames[i])?.id;
				const team2 = teams.find((t) => t.name === orderedTeamNames[i + 1])?.id;

				if (team1 === undefined || team2 === undefined) {
					leftOverTeams.push(team1 ?? team2!);
				} else {
					const matchup: Partial<MatchRow> = {
						team1,
						team2,
						event_id: this.event_id,
						round: 1,  // Brackets start at round 1 (consistent with pool matches)
						type: 'bracket'
					};
					const res = await this.databaseService.insertMatches([matchup as Partial<MatchRow>]);
					if (res.length > 0) {
						matchups.push(res[0]);
					}
				}
			}

			// Handle byes for the initial round
			for (const teamWithBye of leftOverTeams) {
				const byeMatchup: Partial<MatchRow> = {
					team1: teamWithBye,
					team2: null,
					event_id: this.event_id,
					round: 1,  // Brackets start at round 1 (consistent with pool matches)
					type: 'bracket'
				};
				const res = await this.databaseService.insertMatches([byeMatchup as Partial<MatchRow>]);
				if (res.length > 0) {
					matchups.push(res[0]);
				}
			}

			await this.generateSubsequentRounds(matchups, teams.length);
			return this.matches;
		} catch (error) {
			this.handleError(500, `Failed to create bracket matches: ${(error as Error).message}`);
		}
	}

	async generateSubsequentRounds(parentMatches: Partial<MatchRow>[], totalTeams: number) {
		const totalRounds = Math.ceil(Math.log2(totalTeams));
		const matchups: Partial<MatchRow>[] = [...parentMatches];

		for (let currentRound = 1; currentRound < totalRounds; currentRound++) {
			const numMatches = 2 ** (totalRounds - currentRound - 1);

			for (let i = 0; i < numMatches; i++) {
				const emptyMatchup: Partial<MatchRow> = {
					event_id: this.event_id,
					round: currentRound,
					type: 'bracket'
				};

				const res = await this.databaseService.insertMatches([emptyMatchup as Partial<MatchRow>]);
				if (res.length > 0) {
					matchups.push(res[0]);

					const parent1 = parentMatches.pop();
					const parent2 = parentMatches.pop();
					if (parent1) parent1.child_id = res[0].id;
					if (parent2) parent2.child_id = res[0].id;

					await Promise.all(
						[parent1, parent2].map((parent) =>
							parent ? this.updateMatchRow(parent as MatchRow) : Promise.resolve()
						)
					);
				}
			}
		}
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
				const winnerOfOtherParent = this.getWinnerOfOtherParent(otherParent);

				if (child && this.childHasCorrectTeams(child, winnerOfNew, winnerOfOtherParent)) {
					return;
				}

				if (child) {
					await this.updateChildMatch(child, winnerOfNew, winnerOfOtherParent);
				}
			} else {
			}
		} catch (error) {
			this.handleError(500, `An error occurred in nextRound: ${(error as Error).message}`);
		}
	}

	isOtherParentComplete(otherParent?: MatchRow): boolean {
		return otherParent ? otherParent.state === 'COMPLETE' : false;
	}

	canProceedToNextRound(newMatch: MatchRow, otherParentComplete: boolean, child?: Match): boolean {
		return newMatch.state === 'COMPLETE' && otherParentComplete && !!child;
	}

	getMatchWinner(match: MatchRow): string | null {
		return match.team1_score! > match.team2_score! ? match.team1 : match.team2;
	}

	getWinnerOfOtherParent(otherParent?: MatchRow): string | null {
		if (otherParent?.state === 'COMPLETE' && otherParent.team1_score !== null) {
			return otherParent.team1_score > otherParent.team2_score
				? otherParent.team1
				: otherParent.team2;
		}
		return null;
	}

	childHasCorrectTeams(
		child: Match,
		winnerOfNew: string | null,
		winnerOfOtherParent: string | null
	): boolean {
		return (
			(child.team1 === winnerOfNew && child.team2 === winnerOfOtherParent) ||
			(child.team1 === winnerOfOtherParent && child.team2 === winnerOfNew)
		);
	}

	async updateChildMatch(
		child: Match,
		winnerOfNew: string | null,
		winnerOfOtherParent: string | null
	): Promise<void> {
		if (child) {
			child.team1 = winnerOfNew;
			child.team2 = winnerOfOtherParent;
			child.team1_score = 0;
			child.team2_score = 0;
			await child.update();
		}
	}

	async updateMatchRow(matchRow: MatchRow): Promise<void> {
		const match = this.matches?.find((m) => m.id === matchRow.id);
		if (match) {
			Object.assign(match, matchRow);
			await match.update();
		}
	}
}
