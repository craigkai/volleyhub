interface ScheduleInput {
	teams: string[];
	courts: number;
	pools: number;
	/** if there are an odd number of teams, setting this to true will mean one team gets skipped per pool games */
	use_bye_on_odd_team_number?: boolean;
}
/*
This is one round of pool play and can contain X matches,
where X is either the number of teams / 2 or number of teams / 2 - 1
if we have BYEs. We track BYEs on a Pool round basis.
*/
interface PoolRound {
	pool_games: GameMatch[];
	bye?: string;
}

interface GameMatch {
	court: number;
	versus: [string, string];
}

interface ScheduleResult {
	pool_matches: PoolRound[];
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

	let team_bye_tracker = [...input.teams];

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

	// We add one as we will need an extra round of pool play since there will be BYEs
	// TODO: Does this handle is multiple BYEs occur? Probs need some kind of math based
	// on team #s and pool play rounds.
	const pool_play_games = input.use_bye_on_odd_team_number ? input.pools + 1 : input.pools;

	for (let pool_game_number = 0; pool_game_number < pool_play_games; pool_game_number++) {
		let pool_team_match_count = 0;

		// TODO: Do we need this?
		let pool_matches_total = input.use_bye_on_odd_team_number
			? Math.floor(input.teams.length / 2)
			: Math.ceil(input.teams.length / 2);

		while (pool_team_match_count < pool_matches_total) {
			// A match contains 
			const pool_round: PoolRound = { pool_games: [] };
			let availableTeamsThisRound = [...input.teams];

			let bye_team: string | undefined = undefined;
			if (input.use_bye_on_odd_team_number) {
				bye_team = team_bye_tracker.pop() as string;
				team_bye_tracker.unshift(bye_team);

				team_games_count_map[bye_team].games_count++;
				team_games_count_map[bye_team].versus_matches.forEach((matchup) => matchup.count++);
				pool_round.bye = bye_team;

				// Remove our BYE team from an avaialble team for the round
				availableTeamsThisRound.splice(availableTeamsThisRound.indexOf(bye_team), 1);
				// We count the BYE as a match?
				pool_team_match_count++;
			}

			// Loop over our courts, if we are out of teams then we bail
			for (var i: number = 1; i < (input.courts + 1); i++) {
				const match_info: GameMatch = { court: i };

				let filteredAvailableMatchups = [...availableMatchups];
				// Remove our matchups with the BYE team
				if (bye_team) {
					filteredAvailableMatchups = availableMatchups.filter((match: VersusGamesCount) => !match.versus.includes(bye_team as string));
				}

				// We can't do a matchup if we run out of teams
				if (availableTeamsThisRound.length < 2) {
					continue;
				}

				filteredAvailableMatchups.sort((a: VersusGamesCount, b: VersusGamesCount) => a.count - b.count);

				let chosen_matchup = filteredAvailableMatchups[0];

				let chosen_team1 = chosen_matchup.versus[0];
				let chosen_team2 = chosen_matchup.versus[1];

				availableTeamsThisRound.splice(availableTeamsThisRound.indexOf(chosen_team1), 1);
				availableTeamsThisRound.splice(availableTeamsThisRound.indexOf(chosen_team2), 1);

				filteredAvailableMatchups[
					filteredAvailableMatchups.findIndex(
						(matchup: VersusGamesCount) => chosen_matchup.versus === matchup.versus
					)
				].count++;

				team_games_count_map[chosen_team1].games_count++;
				team_games_count_map[chosen_team1].versus_matches.forEach((matchup) => matchup.count++);
				team_games_count_map[chosen_team2].games_count++;
				team_games_count_map[chosen_team2].versus_matches.forEach((matchup) => matchup.count++);
				team_games_counts.sort((a, b) => a.games_count - b.games_count);

				match_info.versus = [chosen_team1, chosen_team2];
				pool_round.pool_games.push(match_info);
				pool_team_match_count++;
			}
			schedule.pool_matches.push(pool_round);
		}
	}

	return schedule;
}

if (import.meta.vitest) {
	interface gamesPlayedMap {
		[key: string]: string[];
	}

	const { it, expect } = import.meta.vitest;

	// NUMBER OF COURTS
	for (let courtsNum = 1; courtsNum <= 6; courtsNum++) {
		const input: any = {
			courts: courtsNum
		};

		// NUMBER OF TEAMS
		for (let teamsNum = 2; teamsNum <= 6; teamsNum++) {
			const teams: string[] = [];
			let i: number = 0;
			for (; i < teamsNum; i++) {
				teams.push(`team${i}`);
			}
			input.teams = teams;

			// POOL PLAY GAMES
			for (let pool_number = teamsNum; pool_number <= 6; pool_number++) {
				input.pools = pool_number;

				if (teams.length % 2) {
					input.use_bye_on_odd_team_number = true;
				}

				const schedule = create_schedule(input);

				const gamesPlayedPerTeam: gamesPlayedMap = {};
				schedule.pool_matches.forEach((rounds: PoolRound) => {
					rounds.pool_games.forEach((round: GameMatch) => {
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
						expect(gamesPlayedPerTeam[teamName].length).to.equal(pool_number);
					});
				});
			}
		}
	}
}
