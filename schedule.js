
/*
Temp script to figure out our scheduling logic for tournaments

Parameters:
    Divisions: [power, low, high, etc]
    Teams: [team1, team2, ...]
    // Should we be able to say how many courts per division?
    Courts: [court1, court2, court3...]
*/


// We do a list as we are not accounting for divisions right now
let teams = [];
let i = 0;
for (; i < 28;) {
    teams.push(`team${i}`);
    i++;
}

let courts = ["court1", "court2", "court3"];
// One division for now
let divisions = ["power"];

// This means each team has four pool play games
let poolPlayGames = 4;

i = 0;
let teamsCopy = Object.assign(teams);
let schedule = {};

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

            console.log(`${home} vs ${guest}`)

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
console.log(schedule)

/*
Need tests for:

   1. Each team has the right amount of games
   2. Each team faces different teams (unless more pool play games than teams)
*/
