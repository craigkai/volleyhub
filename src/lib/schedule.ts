/*
Temp script to figure out our scheduling logic for tournaments

Parameters:
    Divisions: [power, low, high, etc]
    Teams: [team1, team2, ...]
    // Should we be able to say how many courts per division?
    Courts: [court1, court2, court3...]
*/

interface ScheduleInput {
    teams: string[]
    courts: number
    pools: number
    /** if there are an odd number of teams, setting this to true will mean one team gets skipped per pool games */
    use_bye_on_odd_team_number?: boolean
}

interface GameMatch {
    court: number
    versus: [string, string]
}

interface PoolMatches {
    game_matches: GameMatch[]
}

interface ScheduleResult {
    pool_matches: PoolMatches[]
}

interface VersusGamesCount {
    versus: [string, string]
    count: number
}

interface TeamGamesCount {
    team: string
    games_count: number
    versus_matches: VersusGamesCount[]
}

export function create_schedule(input: ScheduleInput): ScheduleResult {
    const schedule: ScheduleResult = { pool_matches: [] }

    const team_games_count_map: Record<string, TeamGamesCount> = Object.fromEntries(
        input.teams.map((team) => [team, { team, games_count: 0, versus_matches: [] }])
    )
    const team_versus_counts: VersusGamesCount[] = input.teams
        .flatMap((team1, index) =>
            input.teams
                .slice(index)
                .filter((team2) => team1 !== team2)
                .map((team2) => {
                    const versus = [team1, team2] as [string, string]
                    const versus_count = { versus, count: 0 }
                    team_games_count_map[team1].versus_matches.push(versus_count)
                    team_games_count_map[team2].versus_matches.push(versus_count)
                    return versus_count
                })
        )
    const team_games_counts = Object.values(team_games_count_map)

    let availableMatchups = [...team_versus_counts]

    for (let pool_game_number = 0; pool_game_number < input.pools; pool_game_number++) {
        const pool_matches: PoolMatches = { game_matches: [] }

        let pool_team_match_count = 0
        let court_number = 0

        const pool_match_total = input.use_bye_on_odd_team_number
            ? Math.floor(input.teams.length / 2)
            : Math.ceil(input.teams.length / 2)

        while (pool_team_match_count < pool_match_total) {
            court_number = (court_number + 1) % input.courts

            availableMatchups.sort((a, b) => a.count - b.count)

            let chosen_matchup = availableMatchups[0]

            const chosen_team1 = chosen_matchup.versus[0]
            const chosen_team2 = chosen_matchup.versus[1]

            availableMatchups[availableMatchups.findIndex((matchup: VersusGamesCount) => chosen_matchup.versus === matchup.versus)].count++;

            team_games_count_map[chosen_team1].games_count++
            team_games_count_map[chosen_team1].versus_matches.forEach((matchup) => (matchup.count++))
            team_games_count_map[chosen_team2].games_count++
            team_games_count_map[chosen_team2].versus_matches.forEach((matchup) => (matchup.count++))
            team_games_counts.sort((a, b) => a.games_count - b.games_count)

            pool_matches.game_matches.push({ court: court_number, versus: [chosen_team1, chosen_team2] })
            pool_team_match_count++
        }
        schedule.pool_matches.push(pool_matches)
    }

    return schedule
}

if (import.meta.vitest) {
    interface gamesPlayedMap {
        [key: string]: string[];
    }

    const { it, expect } = import.meta.vitest;
    // We should loop over even/odd number of courts, teams and divisions and
    // confirm that teams aren't sitting too often, facing the same team too much
    // etc
    let inputs: any = [
        {
            teams: 4,
            courts: 2,
        }
    ];

    inputs.forEach((input: any) => {
        let teams: string[] = [];
        let i: number = 0;
        for (; i < input.teams; i++) {
            teams.push(`team${i}`);
        }
        input.teams = teams;

        for (let pool_number = 1; pool_number <= 20; pool_number++) {
            input.pools = pool_number
            let schedule = create_schedule(input);

            if (teams.length % 2) {
                input.use_bye_on_odd_team_number = true;
            }

            let gamesPlayedPerTeam: gamesPlayedMap = {};
            schedule['pool_matches'].forEach((rounds: PoolMatches) => {
                rounds.game_matches.forEach((round: GameMatch) => {
                    const [home, guest] = round.versus;
                    gamesPlayedPerTeam[guest] ? gamesPlayedPerTeam[guest].push(home) : gamesPlayedPerTeam[guest] = [home];
                    gamesPlayedPerTeam[home] ? gamesPlayedPerTeam[home].push(guest) : gamesPlayedPerTeam[home] = [guest];
                })
            });

            // TODO
            it('No teams sit for more than two games', () => {
                // expect(schedule).toEqual({});
            });

            if (pool_number <= input.teams) {
                it('Teams do not face the same team too much', () => {
                    Object.keys(gamesPlayedPerTeam).forEach((teamName: string) => {
                        let teamsSeen: any = {};
                        gamesPlayedPerTeam[teamName].forEach((team: string) => {
                            expect(teamsSeen[team]).toEqual(undefined);
                            teamsSeen[team] = 1;
                        });
                    });
                });
            }

            it('All teams play the correct number of games', () => {
                Object.keys(gamesPlayedPerTeam).forEach((teamName: string) => {
                    expect(gamesPlayedPerTeam[teamName].length).to.equal(pool_number);
                });
            });
        }
    });
}
