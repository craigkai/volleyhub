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
	let courtNumber = 0; // Start from 0

	for (let r = 0; r < totalRounds; r++) {
		const round: Partial<MatchRow>[] = [];

		for (let i = 0; i < teamArray.length / 2; i++) {
			const team1 = teamArray[i];
			const team2 = teamArray[teamArray.length - i - 1];

			// Exclude matches involving the dummy team (team ID 0)
			if (team1 === 0 || team2 === 0) continue;

			const match: Partial<MatchRow> = {
				round: roundNumber,
				team1,
				team2,
				court: courtNumber
			};

			round.push(match);

			// Increment the court number and reset if it exceeds the available courts
			courtNumber = (courtNumber + 1) % courts;
		}

		matches = matches.concat(round); // Add the round matches to the overall matches array
		roundNumber++;

		// Rotate the teams in the array, excluding the first team
		teamArray = [teamArray[0], ...teamArray.slice(2), teamArray[1]];
	}

	return matches;
}
