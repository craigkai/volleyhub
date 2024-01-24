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
				round: r
			};

			round.push(match);
		}

		if (r === startingRound) {
			round.forEach((m, i) => {
				m.team1 = teamArray[i];
				m.team2 = teamArray[teamArray.length - i - 1];
			});
		} else {
			const prevRound = matches.filter((m) => m.round === r - 1);
			const indexFind = (idx: number) => {
				if (idx + teamArray.length / 2 > teamArray.length - 2) {
					return idx + 1 - teamArray.length / 2;
				} else {
					return idx + teamArray.length / 2;
				}
			};

			for (let i = 0; i < round.length; i++) {
				const prev = prevRound[i];
				const curr = round[i];

				if (i === 0) {
					if (prev.team2 === teamArray[teamArray.length - 1]) {
						curr.team1 = teamArray[teamArray.length - 1];
						curr.team2 = teamArray[indexFind(teamArray.findIndex((p) => p === prev.team1))];
					} else {
						curr.team2 = teamArray[teamArray.length - 1];
						curr.team1 = teamArray[indexFind(teamArray.findIndex((p) => p === prev.team2))];
					}
				} else {
					curr.team1 = teamArray[indexFind(teamArray.findIndex((p) => p === prev.team1))];
					curr.team2 = teamArray[indexFind(teamArray.findIndex((p) => p === prev.team2))];
				}
			}
		}
		matches = [...matches, ...round];
	}
	return matches;
}
