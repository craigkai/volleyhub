/*
Temp script to figure out our scheduling logic for tournaments

Parameters:
    Divisions: [power, low, high, etc]
    Teams: [team1, team2, ...]
    // Should we be able to say how many courts per division?
    Courts: [court1, court2, court3...]
*/

class TeamsQueue {
    teams: string[];
    teamsAvailable: string[];
    playedLast: string[];

    constructor(teams: string[]) {
        this.teams = teams;

        if (this.teams.length % 2) {
            this.teams.push("bye")
        }

        this.playedLast = [];
        this.teamsAvailable = [];
    }

    /*
    Make all teams available for scheduling again
    */
    newRound(): void {
        // We move each element over one so that the neighbors are new
        let temp = [...this.teams];
        console.log(temp)

        temp.push(temp.shift());
        console.log(temp)

        this.teams = [...temp];
        this.playedLast = [];
        this.teamsAvailable = [...temp];
    }

    /*
    If we have at least two available teams then return true
    */
    hasNext(): boolean {
        return this.teamsAvailable ? this.teamsAvailable.length >= 2 : false;
    }

    findMatch(): [string, string] {
        if (!this.teamsAvailable || this.teamsAvailable?.length < 2) {
            console.error(`Found the following available teams: ${this.teamsAvailable}`);
            throw 'Not enough teams!';
        }

        // Get a list of the teams that didn't play last round
        let teamsWhoNeedToPlay = this.teamsAvailable?.filter(
            (team: string) => !this.playedLast.includes(team)
        );

        if (teamsWhoNeedToPlay.length < 2) {
            console.error(`Not enough teams left in this round, bye?: ${teamsWhoNeedToPlay}`);
            throw 'Not enough teams who have not played!!';
        }

        const [home, guest] = [teamsWhoNeedToPlay.pop(), teamsWhoNeedToPlay.pop()];
        if (!home || !guest) {
            throw 'One of our teams is undefined!';
        }

        this.playedLast.push(home);
        this.playedLast.push(guest);

        this.teamsAvailable.splice(this.teamsAvailable.indexOf(home), 1);
        this.teamsAvailable.splice(this.teamsAvailable.indexOf(guest), 1);

        if (this.playedLast.length >= this.teams.length) {
            this.playedLast.shift();
            this.playedLast.shift();
        }
        return [home, guest];
    }
}

export function createSchedule(teams: string[], courts: string[], poolPlayGames: number): any {
    let schedule: any = {};
    courts.forEach((court: string) => (schedule[court] = []));

    let teamsQueue = new TeamsQueue(teams);

    // Loop for each time we should have a pool play game
    for (var i = 0; i < poolPlayGames; i++) {
        teamsQueue.newRound();

        // Each game we look at how many courts we have:
        while (teamsQueue.hasNext()) {
            // We are going to loop over each court for each `round`, we can cover multiple `rounds` until
            // we run out of teams and then everyone has played one game of pool play and we can restart.
            courts.forEach((court: string) => {
                if (!teamsQueue.hasNext()) {
                    return;
                }
                let matchup = teamsQueue.findMatch();
                console.debug(`Round ${i} court ${court} matchup found ${matchup}`);

                schedule[court].push(matchup);
            });
        }
    }

    // If we are not testing, do not upload to Supabase
    if (!import.meta.vitest) {
        //... update Supabase
    }
    return schedule;
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
            teamsCount: 4,
            courts: 2,
            poolPlayGames: 3
        }
    ];

    inputs.forEach((input: any) => {
        let teams: string[] = [];
        let i: number = 0;
        for (; i < input.teamsCount; i++) {
            teams.push(`team${i}`);
        }

        let courts = [];
        for (i = 0; i < input.courts; i++) {
            courts.push(`court${i}`);
        }

        let schedule = createSchedule(teams, courts, input.poolPlayGames);

        let gamesPlayedPerTeam: gamesPlayedMap = {};
        Object.keys(schedule).forEach((court: string) => {
            schedule[court].forEach((game: string) => {
                const [home, guest] = game;
                gamesPlayedPerTeam[guest] ? gamesPlayedPerTeam[guest].push(home) : gamesPlayedPerTeam[guest] = [home];
                gamesPlayedPerTeam[home] ? gamesPlayedPerTeam[home].push(guest) : gamesPlayedPerTeam[home] = [guest];
            });
        });

        // TODO
        it('No teams sit for more than two games', () => {
            // expect(schedule).toEqual({});
        });

        it('Teams do not face the same team too much', () => {
            Object.keys(gamesPlayedPerTeam).forEach((teamName: string) => {
                let teamsSeen: any = {};
                gamesPlayedPerTeam[teamName].forEach((team: string) => {
                    console.log(input)
                    expect(teamsSeen[team]).toEqual(undefined);
                    teamsSeen[team] = 1;
                });
            });
        });

        it('All teams play the correct number of games', () => {
            Object.keys(gamesPlayedPerTeam).forEach((teamName: string) => {
                expect(gamesPlayedPerTeam[teamName].length).to.equal(input.poolPlayGames);
            });
        });
    });
}
