import { shuffle } from './shuffle';

export function RoundRobin(
	players: number[],
	startingRound: number = 1,
	ordered: boolean = false
): Partial<MatchRow>[] {
	let matches: Partial<MatchRow>[] = [];
	let teamArray: number[] = [];

	if (Array.isArray(players)) {
		teamArray = ordered ? players : shuffle(players);
	} else {
		teamArray = [...new Array(players)].map((_, i) => i + 1);
	}

	if (teamArray.length % 2 === 1) {
		teamArray.push(0); // Add a dummy team
	}

	for (let r = startingRound; r < startingRound + teamArray.length - 1; r++) {
		const round: Partial<MatchRow>[] = [];

		for (let i = 0; i < teamArray.length / 2; i++) {
			const match: Partial<MatchRow> = {
				round: r,
				team1: teamArray[i],
				team2: teamArray[teamArray.length - i - 1]
			};

			round.push(match);
		}

		matches = [...matches, ...round];
	}

	return matches;
}
