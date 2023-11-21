import TournamentOrganizer from 'tournament-organizer';
import type { Tournament } from 'tournament-organizer/dist/Tournament';

export function loadTournament(input: any): Tournament {
    const manager = new TournamentOrganizer()
    const tournament: Tournament = manager.createTournament("Craigs Tourney", {
        status: 'setup',
    });

    for (var i = 0; i < input.teams.length; i++) {
        tournament.createPlayer(input.teams[i])
    }

    if (tournament?.stageOne) {
        tournament.stageOne.format = "round-robin";
    }
    if (tournament?.stageTwo) {
        tournament.stageTwo.format = 'single-elimination';
    }

    return tournament;
}

// export function createSchedule(input: ScheduleInput): ScheduleResult {
//     const schedule: ScheduleResult = { poolMatches: [] };

//     let teamByeTracker = [...input.teams];

//     const teamGamesCountMap: Record<string, TeamGamesCount> = Object.fromEntries(
//         input.teams.map((team: string) => [
//             team,
//             {
//                 team,
//                 gamesCount: 0,
//                 versusMatches: [],
//             },
//         ])
//     );

//     const teamVersusCounts: VersusGamesCount[] = input.teams.flatMap((team1, index) =>
//         input.teams.slice(index + 1).map((team2) => ({
//             versus: [team1, team2] as [string, string],
//             count: 0,
//         }))
//     );

//     const teamGamesCounts = Object.values(teamGamesCountMap);
//     const availableMatchups = [...teamVersusCounts];

//     const poolPlayGames = input.useByeOnOddTeamNumber ? input.pools + 1 : input.pools;

//     for (let poolGameNumber = 0; poolGameNumber < poolPlayGames; poolGameNumber++) {
//         let poolTeamMatchCount = 0;

//         const poolMatchesTotal = input.useByeOnOddTeamNumber
//             ? Math.floor(input.teams.length / 2)
//             : Math.ceil(input.teams.length / 2);

//         while (poolTeamMatchCount < poolMatchesTotal) {
//             const poolRound: PoolRound = { poolGames: [] };
//             let availableTeamsThisRound = [...input.teams];

//             let byeTeam: string | undefined = undefined;
//             if (input.useByeOnOddTeamNumber) {
//                 byeTeam = teamByeTracker.pop() as string;
//                 teamByeTracker.unshift(byeTeam);

//                 teamGamesCountMap[byeTeam].gamesCount++;
//                 teamGamesCountMap[byeTeam].versusMatches.forEach((matchup) => matchup.count++);
//                 poolRound.bye = byeTeam;

//                 availableTeamsThisRound.splice(availableTeamsThisRound.indexOf(byeTeam), 1);
//                 poolTeamMatchCount++;
//             }

//             for (let i = 1; i <= input.courts; i++) {
//                 const matchInfo: GameMatch | { court: number } = { court: i };

//                 let filteredAvailableMatchups = [...availableMatchups];
//                 if (byeTeam) {
//                     filteredAvailableMatchups = availableMatchups.filter(
//                         (match) => !match.versus.includes(byeTeam as string)
//                     );
//                 }

//                 if (availableTeamsThisRound.length < 2) {
//                     continue;
//                 }

//                 filteredAvailableMatchups.sort((a, b) => a.count - b.count);

//                 const chosenMatchup = filteredAvailableMatchups[0];

//                 const chosenTeam1 = chosenMatchup.versus[0];
//                 const chosenTeam2 = chosenMatchup.versus[1];

//                 availableTeamsThisRound.splice(availableTeamsThisRound.indexOf(chosenTeam1), 1);
//                 availableTeamsThisRound.splice(availableTeamsThisRound.indexOf(chosenTeam2), 1);

//                 filteredAvailableMatchups[
//                     filteredAvailableMatchups.findIndex(
//                         (matchup) => chosenMatchup.versus === matchup.versus
//                     )
//                 ].count++;

//                 teamGamesCountMap[chosenTeam1].gamesCount++;
//                 teamGamesCountMap[chosenTeam1].versusMatches.forEach((matchup) => matchup.count++);
//                 teamGamesCountMap[chosenTeam2].gamesCount++;
//                 teamGamesCountMap[chosenTeam2].versusMatches.forEach((matchup) => matchup.count++);
//                 teamGamesCounts.sort((a, b) => a.gamesCount - b.gamesCount);

//                 matchInfo.versus = [chosenTeam1, chosenTeam2];
//                 poolRound.poolGames.push(matchInfo);
//                 poolTeamMatchCount++;
//             }
//             schedule.poolMatches.push(poolRound);
//         }
//     }

//     return schedule;
// }


// if (import.meta.vitest) {
//     interface gamesPlayedMap {
//         [key: string]: string[];
//     }

//     const { it, expect } = import.meta.vitest;

//     // NUMBER OF COURTS
//     for (let courtsNum = 1; courtsNum <= 6; courtsNum++) {
//         const input: any = {
//             courts: courtsNum
//         };

//         // NUMBER OF TEAMS
//         for (let teamsNum = 2; teamsNum <= 6; teamsNum++) {
//             const teams: string[] = [];
//             let i: number = 0;
//             for (; i < teamsNum; i++) {
//                 teams.push(`team${i}`);
//             }
//             input.teams = teams;

//             // POOL PLAY GAMES
//             for (let pool_number = teamsNum; pool_number <= 6; pool_number++) {
//                 input.pools = pool_number;

//                 if (teams.length % 2) {
//                     input.use_bye_on_odd_team_number = true;
//                 }

//                 const schedule = createSchedule(input);

//                 const gamesPlayedPerTeam: gamesPlayedMap = {};
//                 schedule.poolMatches.forEach((rounds: PoolRound) => {
//                     rounds.poolGames.forEach((round: GameMatch) => {
//                         const [home, guest] = round.versus;
//                         gamesPlayedPerTeam[guest]
//                             ? gamesPlayedPerTeam[guest].push(home)
//                             : (gamesPlayedPerTeam[guest] = [home]);
//                         gamesPlayedPerTeam[home]
//                             ? gamesPlayedPerTeam[home].push(guest)
//                             : (gamesPlayedPerTeam[home] = [guest]);
//                     });
//                 });

//                 // TODO
//                 it(`No teams sit for more than two games with ${JSON.stringify(input)}`, () => {
//                     // expect(schedule).toEqual({});
//                 });

//                 if (pool_number <= input.teams) {
//                     it(`Teams do not face the same team too much with ${JSON.stringify(input)}`, () => {
//                         Object.keys(gamesPlayedPerTeam).forEach((teamName: string) => {
//                             const teamsSeen: any = {};
//                             gamesPlayedPerTeam[teamName].forEach((team: string) => {
//                                 expect(teamsSeen[team]).toEqual(undefined);
//                                 teamsSeen[team] = 1;
//                             });
//                         });
//                     });
//                 }

//                 it(`All teams play the correct number of games with ${JSON.stringify(input)}`, () => {
//                     Object.keys(gamesPlayedPerTeam).forEach((teamName: string) => {
//                         expect(gamesPlayedPerTeam[teamName].length).to.equal(input.pools);
//                     });
//                 });
//             }
//         }
//     }
// }


function createSchedule() {
    const manager = new TournamentOrganizer()
    const tournament = manager.createTournament("Craigs Tourney")

    let players: any = [];
    for (var i = 0; i < 6; i++) {
        players.push(tournament.createPlayer(`team${i}`))
    }

    tournament.players = players

    if (tournament?.stageOne) {
        tournament.stageOne.format = "round-robin";
    }
    if (tournament?.stageTwo) {
        tournament.stageTwo.format = 'single-elimination';
    }
    tournament.start()
    console.log(tournament.matches)

}
if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest;
    createSchedule()
}