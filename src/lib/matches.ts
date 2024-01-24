import { error } from '@sveltejs/kit';
import type { SupabaseDatabaseService } from './supabaseDatabaseService';
import { RoundRobin } from './roundRobin';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import {
	writable,
	type Unsubscriber,
	type Writable,
	type Invalidator,
	type Subscriber
} from 'svelte/store';

export class Matches implements Writable<Matches> {
	private databaseService: SupabaseDatabaseService;
	public subscribe: (
		run: Subscriber<Matches>,
		invalidate?: Invalidator<Matches> | undefined
	) => Unsubscriber;
	private _set: Function;
	private _update: Function;

	event_id: number;
	matches?: MatchRow[];

	constructor(event_id: number, databaseService: SupabaseDatabaseService) {
		let { subscribe, set, update } = writable(this);
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
		const res = await this.databaseService.loadMatches(this.event_id);

		if (res) {
			this._update((that: Matches) => {
				that.matches = res;
				return that;
			});
		}

		return this;
	}

	async matchUpdated(
		self: Matches,
		payload: RealtimePostgresChangesPayload<{
			[key: string]: MatchRow;
		}>
	): Promise<void> {
		const old = payload.old as MatchRow;
		const updated = payload.new as MatchRow;

		const matchIndex = self.matches?.findIndex((m: MatchRow) => m.id === old.id);
		if (matchIndex !== undefined && matchIndex !== -1) {
			updated.matches_team1_fkey = self.matches[matchIndex].matches_team1_fkey;
			updated.matches_team2_fkey = self.matches[matchIndex].matches_team2_fkey;
			updated.matches_ref_fkey = self.matches[matchIndex].matches_ref_fkey;

			self.matches?.splice(matchIndex, 1, updated as MatchRow);
			const matches = self.matches;

			self._update((that: Matches) => {
				that.matches = matches;
				return that;
			});
		} else {
			console.error('Failed to find match to update.');
		}
	}

	async subscribeToDB(): Promise<RealtimeChannel> {
		return await this.databaseService.subscribeToChanges(
			this,
			this.matchUpdated,
			'matches',
			'event_id=eq.' + this.event_id
		);
	}

	async create(
		{ pools, courts, refs }: Partial<EventRow>,
		teams: TeamRow[]
	): Promise<Matches | undefined> {
		if (!teams || teams.length === 0) {
			console.error("Can't generate matches without Teams");
			error(500, Error("Can't generate matches without Teams"));
		}

		if (teams.length <= 2 && refs === 'teams') {
			throw new Error('Cannot have refs with less than 3 teams');
		}

		if (!pools || pools <= 0) {
			console.error("Can't generate matches without Pools");
			error(500, Error("Can't generate matches without Pools"));
		}

		if (!courts || courts <= 0) {
			console.error("Can't generate matches without courts");
			error(500, Error("Can't generate matches without courts"));
		}

		try {
			let matches: Partial<MatchRow>[] = [];
			// If we have more pool play games than matches we got
			// back, then we need to generate some more.
			while (matches.length < pools * teams.length) {
				matches = matches.concat(RoundRobin(teams.map((t) => t.id)));
			}
			// Delete all old matches as they are now invalid
			await this.databaseService.deleteMatchesByEvent(this.event_id);

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

					// Short circuit if we have more matches than pool play games
					// (you don't play every team).
					if (pools && userMatches.length === pools * (teams.length / 2)) {
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
							ref: match.ref
						});
					}
					teamsAvailable = teamsAvailable - 2;
				});

			if (refs === 'teams') {
				Object.keys(teamsPerRound).forEach((round: string) => {
					userMatches.forEach((match: UserMatch) => {
						if (match.round === Number(round)) {
							const ref = this.determineReferee(
								teamsPerRound[round],
								teams.map((t) => t.id),
								userMatches
							);
							match.ref = ref;
						}
					});
				});
			}

			// Call multi insert:
			const res = await this.databaseService.insertMatches(userMatches);
			if (res) {
				this._update((that: Matches) => {
					that.matches = res;
					return that;
				});
			}
			return this;
		} catch (err) {
			// Handle and log the error appropriately
			console.error('Failed to generate matches:', err);
			error(500, Error(err as string));
		}
	}

	async update(match: MatchRow): Promise<MatchRow> {
		const updatedMatch = await this.databaseService.updateMatch(match);
		if (updatedMatch === null) {
			error(500, new Error('Failed to update match.'));
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
		const teamsWithPreviousReferee = new Set(previousMatches.map((match) => match.ref));
		const availableTeamsByRefsCount: { [key: number]: number } = availableTeams.reduce(
			(acc, team) => {
				if (teamsWithPreviousReferee.has(team)) {
					acc[team] = acc[team] ? acc[team] + 1 : 1;
				} else {
					acc[team] = 0;
				}
				return acc;
			},
			{}
		);
		const availableTeamsOrdered = Object.keys(availableTeamsByRefsCount).sort(
			(a, b) => availableTeamsByRefsCount[a] - availableTeamsByRefsCount[b]
		);

		// Choose a referee from the remaining available teams
		return Number(availableTeamsOrdered[0]);
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
			loadMatches: vi.fn()
		};
		matches = new Matches(1, mockDatabaseService);
	});

	it('Test matches are correct with two teams and one pool play game', async () => {
		const input: Partial<EventRow> = {
			name: 'Test Tournament',
			date: new Date().toString(),
			pools: 1,
			courts: 2,
			owner: 'test'
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
			owner: 'test'
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
}
