
/*
Temp script to figure out our scheduling logic for tournaments

Parameters:
    Divisions: [power, low, high, etc]
    Teams: [team1, team2, ...]
    // Should we be able to say how many courts per division?
    Courts: [court1, court2, court3...]
*/


// We do a list as we are not accounting for divisions right now

function createSchedule(teams: string[], courts: string[], poolPlayGames: number) {
    // One division for now
    let divisions: string[] = ["power"];

    // This means each team has four pool play games

    let i = 0;
    let teamsCopy = Object.assign(teams);
    let schedule: any = {};

    for (; i < poolPlayGames;) {
        // Each game we look at how many courts we have:
        while (teamsCopy.length >= 2) {
            courts.forEach((court) => {
                if (teamsCopy.length === 0) {
                    return;
                }

                if (teamsCopy.length < 2) {
                    console.log(`Not enough teams: ${teamsCopy}`)
                    return;
                }

                // We should check our last team in the array that we are going to `pop()` and confirm
                // that the teams we are grabbing haven't already played one another
                let home = teamsCopy[teamsCopy.length - (i + 1)];
                let guest = teamsCopy[teamsCopy.length - (i + 2)];

                if (schedule[court]) {
                    schedule[court].push(`${teamsCopy.pop()} vs ${teamsCopy.pop()}`);
                } else {
                    schedule[court] = [`${teamsCopy.pop()} vs ${teamsCopy.pop()}`];
                }
            })
            i++;
        }
        teamsCopy = teams;
    }
    // If we are not testing, do not upload to Supabase
    if (!import.meta.vitest) {
        //... update Supabase
    }
    return schedule;
}


if (import.meta.vitest) {

    interface gamesPlayedMap {
        [key: string]: number
    }

    const { it, expect } = import.meta.vitest;
    // We should loop over even/odd number of courts, teams and divisions and
    // confirm that teams aren't sitting too often, facing the same team too much
    // etc
    let teams: string[] = [];
    let i: number = 0;
    for (; i < 28;) {
        teams.push(`team${i}`);
        i++;
    }
    let courts = ["court1", "court2", "court3"];
    let poolPlayGames = 4;

    let schedule = createSchedule(teams, courts, poolPlayGames);

    it("No teams sit for more than two games", () => {
        // expect(schedule).toEqual({});
    });

    it("Teams do not face the same team too much", () => {
        // expect(schedule).toEqual({});
    });

    it("All teams play the correct number of games", () => {
        let gamesPlayedPerTeam: gamesPlayedMap = { 'team0': 0 };
        Object.keys(schedule).forEach((court: string) => {
            schedule[court].forEach((game: string) => {
                const match = game.match(/(.*) vs (.*)/);
                if (match) {
                    const [_, home, guest] = match;
                    gamesPlayedPerTeam[guest] = (gamesPlayedPerTeam[guest] + 1) || 1;
                    gamesPlayedPerTeam[home] = (gamesPlayedPerTeam[home] + 1) || 1;
                }
            });
        });

        Object.keys(gamesPlayedPerTeam).forEach((teamName: string) => {
            expect(gamesPlayedPerTeam[teamName]).to.equal(poolPlayGames);
        });
    });
}
