import { shuffle } from './shuffle';

export function RoundRobin(
	players: number[],
	startingRound: number = 1,
	courts: number = 1,
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

	const totalRounds = teamArray.length - 1;
	let roundNumber = startingRound;

	for (let r = 0; r < totalRounds; r++) {
		const round: Partial<MatchRow>[] = [];

		for (let i = 0; i < teamArray.length / 2; i++) {
			const match: Partial<MatchRow> = {
				round: roundNumber,
				team1: teamArray[i],
				team2: teamArray[teamArray.length - i - 1]
			};

			round.push(match);
			if (round.length === courts) {
				matches = matches.concat(round);
				roundNumber++;
				round.length = 0; // Clear the round array for the next set of matches
			}
		}

		matches = matches.concat(round); // Add remaining matches if any

		// Rotate the teams in the array, excluding the first team
		teamArray = [teamArray[0], ...teamArray.slice(2), teamArray[1]];
	}

	return matches;
}
