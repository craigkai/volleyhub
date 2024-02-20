import type { MatchesSupabaseDatabaseService } from '$lib/database/matches';
import { RoundRobin } from './roundRobin';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { writable, type Unsubscriber, type Invalidator, type Subscriber } from 'svelte/store';
import { Base } from './base';
import type { Brackets } from './brackets';

export class Matches extends Base {
	public databaseService: MatchesSupabaseDatabaseService;
	public subscribe: (
		run: Subscriber<Matches>,
		invalidate?: Invalidator<Matches> | undefined
	) => Unsubscriber;
	public _set: Function;
	public _update: Function;

	event_id: number;
	matches?: MatchRow[];

	constructor(event_id: number, databaseService: MatchesSupabaseDatabaseService) {
		super();
		const { subscribe, set, update } = writable(this);
		this.subscribe = subscribe;
		this._set = set;
		this._update = update;

		this.databaseService = databaseService;
		this.event_id = event_id;
	}

	/*
	Load all matches for the current tournament.
	*/
	async load() {
		const res = await this.databaseService.load(this.event_id, {
			column: 'type',
			operator: 'eq',
			value: 'pool'
		});

		if (res) {
			this._update((that: Matches) => {
				that.matches = res;
				return that;
			});
		}

		return this;
	}

	async handleUpdate(
		self: Matches | Brackets,
		payload: RealtimePostgresChangesPayload<{ [key: string]: any }>
	): Promise<void> {
		const old = payload.old as MatchRow;
		const updated = payload.new as MatchRow;

		// If we don't have the matches loaded, load them
		if (Object.keys(old).length === 0 || Object.keys(updated).length === 0) {
			await self.load();
			return;
		}

		if (self.constructor.name === 'Brackets') {
			if (updated.type !== 'bracket') {
				// Updated match is not a bracket match, so we don't care about it
				return;
			} else {
				// Generate next bracket match
				(self as Brackets).nextRound(old, updated);
			}
		}

		const matchesArray = self.matches;

		const matchIndex = matchesArray?.findIndex((m: MatchRow) => m.id === old.id);
		if (matchIndex !== undefined && matchIndex !== -1) {
			if (matchesArray) {
				updated.matches_team1_fkey = matchesArray[matchIndex].matches_team1_fkey;
				updated.matches_team2_fkey = matchesArray[matchIndex].matches_team2_fkey;
				updated.matches_ref_fkey = matchesArray[matchIndex].matches_ref_fkey;
			}

			matchesArray?.splice(matchIndex, 1, updated as MatchRow);
			const matches = matchesArray;

			self._update((that: Matches) => {
				that.matches = matches;
				return that;
			});
		} else {
			self.handleError(400, `Failed to find match to update.`);
		}
	}

	async subscribeToMatches(): Promise<RealtimeChannel> {
		return await this.databaseService.subscribeToChanges(
			this,
			this.handleUpdate,
			'matches',
			'event_id=eq.' + this.event_id
		);
	}

	async create(
		{ pools, courts, refs = 'provided' }: Partial<EventRow>,
		teams: TeamRow[]
	): Promise<Matches | undefined> {
		try {
			this.validateInputs(teams, pools, courts, refs);

			// We have validated our inputs, so we can safely cast them to their expected types
			pools = pools as number;
			courts = courts as number;
			refs = refs as string;

			const matches = this.generateMatches(pools, teams);
			await this.databaseService.deleteMatchesByEvent(this.event_id);

			const userMatches = this.prepareUserMatches(matches, courts, teams, pools);

			if (refs === 'teams') {
				this.assignReferees(userMatches, teams);
			}

			const res = await this.databaseService.insertMatches(userMatches);
			if (res) {
				this._update((that: Matches) => {
					that.matches = res;
					return that;
				});
			}

			return this;
		} catch (err) {
			this.handleError(500, err instanceof Error ? err.message : (err as string));
		}
	}

	validateInputs(
		teams: TeamRow[],
		pools: number | undefined | null,
		courts: number | undefined | null,
		refs: string | undefined | null
	) {
		if (!teams || teams.length === 0) {
			this.handleError(400, "Can't generate matches without Teams");
		}

		if (!pools || pools <= 0) {
			this.handleError(400, "Can't generate matches without Pools");
		}

		if (!courts || courts <= 0) {
			this.handleError(400, "Can't generate matches without courts");
		}

		if (teams.length <= 2 && refs && refs === 'teams') {
			this.handleError(400, 'Cannot have refs with less than 3 teams');
		}
	}

	generateMatches(pools: number, teams: TeamRow[]) {
		let matches: Partial<MatchRow>[] = [];
		while (matches.length < pools * teams.length) {
			matches = matches.concat(RoundRobin(teams.map((t) => t.id)));
		}
		return matches;
	}

	prepareUserMatches(
		matches: Partial<MatchRow>[],
		courts: number,
		teams: string | any[],
		pools: number
	) {
		let courtsAvailable = courts;
		let teamsAvailable = teams.length;
		let round = 0;
		let totalRounds = 0;
		const userMatches: UserMatch[] = [];
		const teamsPerRound: { number: number[] } = { 0: [] };

		matches
			.sort((a, b) => a.round - b.round)
			.forEach((match: Partial<MatchRow>) => {
				if (match.team1 === 0 || match.team2 === 0) {
					// bye
					return;
				}

				if (pools && userMatches.length === pools * (teams.length / 2)) {
					// Short circuit if we have more matches than pool play games
					return;
				}

				if (courtsAvailable === 0 || teamsAvailable < 2) {
					courtsAvailable = courts;
					teamsAvailable = teams?.length;
					round = round + 1;
					totalRounds = totalRounds + 1;
				}

				teamsPerRound[round] = teamsPerRound[round]
					? teamsPerRound[round].concat(match.team1, match.team2)
					: [match.team1, match.team2];

				match.court = courts - courtsAvailable;
				match.round = round;

				courtsAvailable = courtsAvailable - 1;
				if (teamsAvailable >= 2) {
					userMatches.push({
						event_id: this.event_id,
						team1: match.team1 as number,
						team2: match.team2 as number,
						court: match.court,
						round: match.round,
						ref: match.ref,
						type: match?.type || 'pool',
						child_id: match?.child_id as number
					});
				}
				teamsAvailable = teamsAvailable - 2;
			});

		return userMatches;
	}

	assignReferees(userMatches: UserMatch[], teams: TeamRow[]) {
		const teamsPerRound: { number: number[] } = { 0: [] };

		userMatches.forEach((match: UserMatch) => {
			const round = match.round.toString();
			teamsPerRound[round] = teamsPerRound[round]
				? teamsPerRound[round].concat(match.team1, match.team2)
				: [match.team1, match.team2];
		});

		Object.keys(teamsPerRound).forEach((round: string) => {
			userMatches.forEach((match: UserMatch, i) => {
				if (match.round === Number(round)) {
					const ref = this.determineReferee(
						teamsPerRound[round],
						teams.map((t) => t.id),
						userMatches
					);
					userMatches[i].ref = ref;
				}
			});
		});
	}

	async put(match: MatchRow): Promise<MatchRow> {
		const updatedMatch = await this.databaseService.updateMatch(match);
		if (updatedMatch === null) {
			this.handleError(500, 'Failed to update match.');
		}
		return updatedMatch;
	}

	determineReferee(
		teamsPerRound: [{ number: number[] }],
		teams: number[],
		previousMatches: Partial<MatchRow>[]
	): number {
		// Exclude teams playing in the current round from the referee selection
		const availableTeams = teams.filter((team) => !teamsPerRound.includes(team) && team !== 0);

		// Exclude teams that have already refereed in previous matches
		const availableTeamsByRefsCount: { [key: number]: number } = previousMatches.reduce(
			(acc, match) => {
				if (match.ref) {
					acc[match.ref] = acc[match.ref] ? acc[match.ref] + 1 : 1;
				}
				return acc;
			},
			{}
		);

		availableTeams.sort(
			(a, b) => (availableTeamsByRefsCount[a] ?? 0) - (availableTeamsByRefsCount[b] ?? 0)
		);

		// Choose a referee from the remaining available teams
		return Number(availableTeams[0]);
	}
}

if (import.meta.vitest) {
	const { vi, it, expect, beforeEach } = import.meta.vitest;

	let mockDatabaseService: any;
	let matches: Matches;

	beforeEach(() => {
		mockDatabaseService = {
			updateTournament: vi.fn(() => console.log('mockDatabaseService.updateTournament called')),
			getCurrentUser: vi.fn(() => {
				console.log('mockDatabaseService.getCurrentUser called');
				return {
					id: 1
				};
			}),
			createEvent: vi.fn((input: any) => {
				console.log('mockDatabaseService.createEvent called');
				input.id = 1;
				return input;
			}),
			deleteMatchesByEvent: vi.fn(),
			insertMatches: vi.fn((matches: UserMatch[]) => matches),
			load: vi.fn()
		};
		matches = new Matches(1, mockDatabaseService);
	});

	it('Test matches are correct with two teams and one pool play game', async () => {
		const input: Partial<EventRow> = {
			name: 'Test Tournament',
			date: new Date().toString(),
			pools: 1,
			courts: 2,
			owner: 'test',
			refs: 'provided'
		};

		const teams = Array.from({ length: 2 }, (_x, i) => {
			return {
				id: `team${i}`,
				event_id: '1',
				created_at: null, // Add the created_at property with a value of null
				name: '', // Add the name property with an empty string value
				state: null // Add the state property with a value of null
			};
		});
		await matches.load(); // Ensure matches are loaded before creating new ones
		await matches.create(input, teams);

		expect(matches.matches?.length).toEqual(1);

		const gamesPerTeam: any = { team0: 0, team1: 0 };
		matches?.matches?.forEach((match: MatchRow) => {
			gamesPerTeam[match.team1]++;
			gamesPerTeam[match.team2]++;
		});
		Object.keys(gamesPerTeam).forEach((team: string) => {
			expect(gamesPerTeam[team]).toEqual(1);
		});
	});

	it('Test matches are correct with four teams and three pool play games', async () => {
		const input: Partial<EventRow> = {
			name: 'Test Tournament',
			date: new Date().toString(),
			pools: 3,
			courts: 2,
			owner: 'test',
			refs: 'teams'
		};

		const teams = Array.from({ length: 4 }, (_x, i) => {
			return {
				id: `team${i}`,
				event_id: '1',
				created_at: '',
				name: `team${i}`,
				state: 'active'
			};
		});
		await matches.load(); // Ensure matches are loaded before creating new ones
		await matches.create(input, teams);

		// Teams / 2 * pool play
		expect(matches?.matches?.length).toEqual(3 * (4 / 2));

		const gamesPerTeam: any = { team0: 0, team1: 0, team2: 0, team3: 0 };
		matches?.matches?.forEach((match: MatchRow) => {
			gamesPerTeam[match.team1]++;
			gamesPerTeam[match.team2]++;
		});
		Object.keys(gamesPerTeam).forEach((team: string) => {
			expect(gamesPerTeam[team]).toEqual(3);
		});
	});

	it('Test matches refs are correct with four teams and three pool play games one court', async () => {
		const input: Partial<EventRow> = {
			name: 'Test Tournament',
			date: new Date().toString(),
			pools: 10,
			courts: 1,
			owner: 'test',
			refs: 'teams'
		};

		const teams = Array.from({ length: 7 }, (_x, i) => {
			return {
				id: `${i + 1}`,
				event_id: '1',
				created_at: '',
				name: `team${i}`,
				state: 'active'
			};
		});
		await matches.load(); // Ensure matches are loaded before creating new ones
		await matches.create(input, teams);

		const refGamesPerTeam: any = {};
		matches?.matches?.forEach((match: MatchRow) => {
			if (match.ref) {
				refGamesPerTeam[match.ref] = refGamesPerTeam[match.ref]
					? refGamesPerTeam[match.ref] + 1
					: 1;
			}
		});

		const max = Math.max(...Object.values(refGamesPerTeam).map((value) => Number(value)));
		const min = Math.min(...Object.values(refGamesPerTeam).map((value) => Number(value)));

		// Even number of games and teams means ever team should ref the same amount of games
		expect(min).toEqual(max);
	});
}
