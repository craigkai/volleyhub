interface ScheduleInput {
	teams: string[];
	courts: number;
	pools: number;
	/** if there are an odd number of teams, setting this to true will mean one team gets skipped per pool games */
	use_bye_on_odd_team_number?: boolean;
}

interface GameMatch {
	court: number;
	versus: [string, string];
}

interface PoolMatches {
	game_matches: GameMatch[];
}

interface ScheduleResult {
	pool_matches: PoolMatches[];
}

interface VersusGamesCount {
	versus: [string, string];
	count: number;
}

interface TeamGamesCount {
	team: string;
	games_count: number;
	versus_matches: VersusGamesCount[];
}

export function create_schedule(input: ScheduleInput): ScheduleResult {
	const schedule: ScheduleResult = { pool_matches: [] };

	if (input.use_bye_on_odd_team_number) {
		input.teams.push('BYE');
	}

	const team_games_count_map: Record<string, TeamGamesCount> = Object.fromEntries(
		input.teams.map((team) => [team, { team, games_count: 0, versus_matches: [] }])
	);
	const team_versus_counts: VersusGamesCount[] = input.teams.flatMap((team1, index) =>
		input.teams
			.slice(index)
			.filter((team2) => team1 !== team2)
			.map((team2) => {
				const versus = [team1, team2] as [string, string];
				const versus_count = { versus, count: 0 };
				team_games_count_map[team1].versus_matches.push(versus_count);
				team_games_count_map[team2].versus_matches.push(versus_count);
				return versus_count;
			})
	);
	const team_games_counts = Object.values(team_games_count_map);

	const availableMatchups = [...team_versus_counts];

	for (let pool_game_number = 0; pool_game_number < input.pools; pool_game_number++) {
		const pool_matches: PoolMatches = { game_matches: [] };

		let pool_team_match_count = 0;
		let court_number = 0;

		const pool_match_total = input.use_bye_on_odd_team_number
			? Math.floor(input.teams.length / 2)
			: Math.ceil(input.teams.length / 2);

		while (pool_team_match_count < pool_match_total) {
			court_number = (court_number + 1) % input.courts;

			availableMatchups.sort((a, b) => a.count - b.count);

			const chosen_matchup = availableMatchups[0];

			const chosen_team1 = chosen_matchup.versus[0];
			const chosen_team2 = chosen_matchup.versus[1];

			availableMatchups[
				availableMatchups.findIndex(
					(matchup: VersusGamesCount) => chosen_matchup.versus === matchup.versus
				)
			].count++;

			team_games_count_map[chosen_team1].games_count++;
			team_games_count_map[chosen_team1].versus_matches.forEach((matchup) => matchup.count++);
			team_games_count_map[chosen_team2].games_count++;
			team_games_count_map[chosen_team2].versus_matches.forEach((matchup) => matchup.count++);
			team_games_counts.sort((a, b) => a.games_count - b.games_count);

			pool_matches.game_matches.push({ court: court_number, versus: [chosen_team1, chosen_team2] });
			pool_team_match_count++;
		}
		schedule.pool_matches.push(pool_matches);
	}

	return schedule;
}

if (import.meta.vitest) {
	interface gamesPlayedMap {
		[key: string]: string[];
	}

	const { it, expect } = import.meta.vitest;

	// NUMBER OF COURTS
	for (let courtsNum = 1; courtsNum <= 1; courtsNum++) {
		const input: any = {
			courts: courtsNum
		};

		// NUMBER OF TEAMS
		for (let teamsNum = 2; teamsNum <= 4; teamsNum++) {
			const teams: string[] = [];
			let i: number = 0;
			for (; i < teamsNum; i++) {
				teams.push(`team${i}`);
			}
			input.teams = teams;

			// POOL PLAY GAMES
			for (let pool_number = 1; pool_number <= 2; pool_number++) {
				input.pools = pool_number;
				const schedule = create_schedule(input);

				if (teams.length % 2) {
					input.use_bye_on_odd_team_number = true;
				}

				const gamesPlayedPerTeam: gamesPlayedMap = {};
				schedule['pool_matches'].forEach((rounds: PoolMatches) => {
					rounds.game_matches.forEach((round: GameMatch) => {
						const [home, guest] = round.versus;
						gamesPlayedPerTeam[guest]
							? gamesPlayedPerTeam[guest].push(home)
							: (gamesPlayedPerTeam[guest] = [home]);
						gamesPlayedPerTeam[home]
							? gamesPlayedPerTeam[home].push(guest)
							: (gamesPlayedPerTeam[home] = [guest]);
					});
				});

				// TODO
				it(`No teams sit for more than two games with ${JSON.stringify(input)}`, () => {
					// expect(schedule).toEqual({});
				});

				if (pool_number <= input.teams) {
					it(`Teams do not face the same team too much with ${JSON.stringify(input)}`, () => {
						Object.keys(gamesPlayedPerTeam).forEach((teamName: string) => {
							const teamsSeen: any = {};
							gamesPlayedPerTeam[teamName].forEach((team: string) => {
								expect(teamsSeen[team]).toEqual(undefined);
								teamsSeen[team] = 1;
							});
						});
					});
				}

				it(`All teams play the correct number of games with ${JSON.stringify(input)}`, () => {
					Object.keys(gamesPlayedPerTeam).forEach((teamName: string) => {
						// console.log(JSON.stringify(schedule))
						expect(gamesPlayedPerTeam[teamName].length).to.equal(pool_number);
					});
				});
			}
		}
	}
}
