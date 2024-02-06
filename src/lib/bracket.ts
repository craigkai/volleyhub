interface Match {
	team1: string | null;
	team2: string | null;
	winner: string | null;
}

export class SingleEliminationBracket {
	private matches: Match[] = [];

	constructor(teams: string[]) {
		this.generateBracket(teams);
	}

	private generateBracket(teams: string[]): void {
		if (!this.isPowerOfTwo(teams.length)) {
			throw new Error('Number of teams must be a power of 2.');
		}

		let round = 1;
		while (teams.length > 1) {
			const roundMatches: Match[] = [];

			for (let i = 0; i < teams.length; i += 2) {
				const match: Match = {
					team1: teams[i],
					team2: teams[i + 1],
					winner: null
				};
				roundMatches.push(match);
			}

			this.matches.push(...roundMatches);
			teams = roundMatches.map((match) => match.winner || '');

			round++;
		}
	}

	private isPowerOfTwo(num: number): boolean {
		return (num & (num - 1)) === 0 && num !== 0;
	}

	public getBracket(): Match[] {
		return this.matches;
	}
}
