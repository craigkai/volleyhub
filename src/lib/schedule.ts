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
        this.playedLast = [];
        this.teamsAvailable = [];
    }

    /*
    Make all teams available for scheduling again
    */
    newRound(): void {
        this.teamsAvailable = [...this.teams];
    }

    /*
    If we have at least two available teams then return true
    */
    hasNext(): boolean {
        return this.teamsAvailable ? this.teamsAvailable.length > 2 : false;
    }

    findMatch(): [string, string] {
        if (!this.teamsAvailable || this.teamsAvailable?.length < 2) {
            console.error(`Found the following available teams: ${this.teamsAvailable}`);
            throw "Not enough teams!";
        }

        // Get a list of the teams that didn't play last round
        let teamsWhoNeedToPlay = this.teamsAvailable?.filter((team: string) => !this.playedLast.includes(team));
        if (teamsWhoNeedToPlay.length < 2) {
            console.error(`Not enough teams left in this round, bye?: ${teamsWhoNeedToPlay}`);
            throw "Not enough teams who have not played!!";
        }

        const [home, guest] = [teamsWhoNeedToPlay.pop(), teamsWhoNeedToPlay.pop()];
        if (!home || !guest) {
            throw 'One of our teams is undefined!';
        }

        this.playedLast.push(home);
        this.playedLast.push(guest);

        this.teamsAvailable.splice(this.teamsAvailable.indexOf(home), 1);
        this.teamsAvailable.splice(this.teamsAvailable.indexOf(guest), 1);

        this.playedLast.shift();
        this.playedLast.shift();

        return [home, guest];
    }
}

export function createSchedule(teams: string[], courts: string[], poolPlayGames: number): any {
    let schedule: any = {};
    courts.forEach((court: string) => schedule[court] = []);

    let teamsQueue = new TeamsQueue(teams);

    // Loop for each time we should have a pool play game
    for (var i = 0; i < poolPlayGames; i++) {
        teamsQueue.newRound();

        // Each game we look at how many courts we have:
        while (teamsQueue.hasNext()) {
            // We are going to loop over each court for each `round`, we can cover multiple `rounds` until
            // we run out of teams and then everyone has played one round of pool play and we can restart.
            courts.forEach((court: string) => {
                // We should check our last team in the array that we are going to `pop()` and confirm
                // that the teams we are grabbing haven't already played one another
                if (!teamsQueue.hasNext()) {
                    return;
                }

                schedule[court].push(teamsQueue.findMatch());
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
        [key: string]: number;
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
    let courts = ['court1', 'court2', 'court3'];
    let poolPlayGames = 2;

    let schedule = createSchedule(teams, courts, poolPlayGames);

    it('No teams sit for more than two games', () => {
        // expect(schedule).toEqual({});
    });

    it('Teams do not face the same team too much', () => {
        // expect(schedule).toEqual({});
    });

    it('All teams play the correct number of games', () => {
        let gamesPlayedPerTeam: gamesPlayedMap = {};
        Object.keys(schedule).forEach((court: string) => {
            schedule[court].forEach((game: string) => {
                const [home, guest] = game;
                gamesPlayedPerTeam[guest] = gamesPlayedPerTeam[guest] + 1 || 1;
                gamesPlayedPerTeam[home] = gamesPlayedPerTeam[home] + 1 || 1;
            });
        });

        Object.keys(gamesPlayedPerTeam).forEach((teamName: string) => {
            expect(gamesPlayedPerTeam[teamName]).to.equal(poolPlayGames);
        });
    });
}
