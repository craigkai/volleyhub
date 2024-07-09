import type { MatchesSupabaseDatabaseService } from '$lib/database/matches.svelte';
import { RoundRobin } from './brackets/roundRobin';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Base } from './base';
import type { Brackets } from './brackets/brackets.svelte';

export class Matches extends Base {
	public databaseService: MatchesSupabaseDatabaseService;
	event_id: number;
	matches?: MatchRow[] = $state<MatchRow[]>();
	subscriptionStatus? = $state();

	constructor(event_id: number, databaseService: MatchesSupabaseDatabaseService) {
		super();
		this.databaseService = databaseService;
		this.event_id = Number(event_id);
	}

	async load() {
		const res = await this.databaseService.load(this.event_id, {
			column: 'type',
			operator: 'eq',
			value: 'pool'
		});

		if (res) this.matches = res;
		return this;
	}

	async handleUpdate(
		self: Matches | Brackets,
		payload: RealtimePostgresChangesPayload<{ [key: string]: any }>
	): Promise<void> {
		console.debug('Handling update for matches ', self.constructor.name);

		const old = payload.old as MatchRow;
		const updated = payload.new as MatchRow;

		// If we are updating for another type of match, ignore it
		if (!self.constructor.name.toLowerCase().includes(updated.type)) return;

		if (self.constructor.name === 'Brackets' && updated.type === 'bracket') {
			await self.load();
			(self as Brackets).nextRound(updated);
		}

		if (!self.matches) {
			await self.load();
			return;
		}

		const matchIndex = self.matches.findIndex((m: MatchRow) => m.id === old.id);

		if (matchIndex !== -1) {
			// Existing match, update it
			const updatedMatch = { ...self.matches[matchIndex], ...updated };
			self.matches.splice(matchIndex, 1, updatedMatch);
		} else {
			self.handleError(400, `Failed to find match to update.`);
		}
	}

	async subscribeToMatches(): Promise<RealtimeChannel> {
		return await this.databaseService.subscribeToChanges(
			this,
			this.handleUpdate,
			'matches',
			`event_id=eq.${this.event_id}`
		);
	}

	async create(
		{ pools, courts, refs = 'provided' }: Partial<EventRow>,
		teams: TeamRow[]
	): Promise<Matches | undefined> {
		try {
			this.validateInputs(teams, pools, courts, refs);

			const matches = this.generateMatches(pools!, teams);
			await this.databaseService.deleteMatchesByEvent(this.event_id);

			const userMatches = this.prepareUserMatches(matches, courts!, teams, pools!);
			if (refs === 'teams') {
				this.assignReferees(userMatches, teams);
			}

			const res = await this.databaseService.insertMatches(userMatches);
			if (res) this.matches = res;

			return this;
		} catch (err) {
			this.handleError(500, err instanceof Error ? err.message : (err as string));
		}
	}

	async put(match: MatchRow): Promise<MatchRow | null> {
		const updatedMatch = await this.databaseService.updateMatch(match);
		if (!updatedMatch) {
			this.handleError(500, 'Failed to update match.');
		}
		return updatedMatch;
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

		if (teams.length <= 2 && refs === 'teams') {
			this.handleError(400, 'Cannot have refs with less than 3 teams');
		}
	}

	calculateRoundsAndCourts(
		teams: TeamRow[],
		courts: number
	): { rounds: number; courtsPerRound: number } {
		const numberOfTeams = teams.length;
		const rounds = numberOfTeams % 2 === 0 ? numberOfTeams - 1 : numberOfTeams;
		const courtsPerRound = Math.min(courts, Math.floor(numberOfTeams / 2));
		return { rounds, courtsPerRound };
	}

	generateMatches(pools: number, teams: TeamRow[]): Partial<MatchRow>[] {
		let matches: Partial<MatchRow>[] = [];
		const totalRounds = pools * teams.length;

		for (let round = 0; round < totalRounds; round++) {
			matches = matches.concat(RoundRobin(teams.map((t) => t.id)));
		}

		return matches;
	}

	prepareUserMatches(
		matches: Partial<MatchRow>[],
		courts: number,
		teams: TeamRow[],
		pools: number
	): UserMatch[] {
		let round = 0;
		const userMatches: UserMatch[] = [];
		const teamsPerRound: { [round: number]: Set<number> } = {};

		// Initialize team availability per round
		const teamAvailability: { [round: number]: Set<number> } = {};
		for (let i = 0; i < teams.length; i++) {
			for (let r = 0; r < teams.length - 1; r++) {
				if (!teamAvailability[r]) {
					teamAvailability[r] = new Set();
				}
				teamAvailability[r].add(teams[i].id);
			}
		}

		matches
			.sort((a, b) => (a.round ?? 0) - (b.round ?? 0))
			.forEach((match: Partial<MatchRow>) => {
				if (match.team1 === 0 || match.team2 === 0) {
					return;
				}

				if (pools && userMatches.length >= (pools * teams.length) / 2) {
					return;
				}

				if (!teamsPerRound[round]) {
					teamsPerRound[round] = new Set();
				}

				// Check if teams are available for this round
				if (
					!teamAvailability[round].has(match.team1) ||
					!teamAvailability[round].has(match.team2)
				) {
					round++;
					if (!teamsPerRound[round]) {
						teamsPerRound[round] = new Set();
					}
					if (!teamAvailability[round]) {
						teamAvailability[round] = new Set();
					}
				}

				teamsPerRound[round].add(match.team1!);
				teamsPerRound[round].add(match.team2!);

				// Remove teams from availability for this round
				teamAvailability[round].delete(match.team1!);
				teamAvailability[round].delete(match.team2!);

				match.court = Math.floor(userMatches.length % courts);
				match.round = round;

				userMatches.push({
					event_id: this.event_id,
					team1: match.team1!,
					team2: match.team2!,
					court: match.court!,
					round: match.round!,
					ref: match.ref,
					type: match.type || 'pool',
					child_id: match.child_id ?? undefined
				});
			});

		return userMatches;
	}

	assignReferees(userMatches: UserMatch[], teams: TeamRow[]) {
		const teamsPerRound: { [key: string]: number[] } = {};

		userMatches.forEach((match: UserMatch) => {
			const round = match.round.toString();
			teamsPerRound[round] = teamsPerRound[round]
				? teamsPerRound[round].concat(match.team1, match.team2)
				: [match.team1, match.team2];
		});

		const refereeCounts: { [teamId: number]: number } = {};
		teams.forEach((team) => (refereeCounts[team.id] = 0));

		userMatches.forEach((match: UserMatch, i) => {
			const round = match.round.toString();
			const ref = this.determineReferee(
				teamsPerRound[round],
				teams.map((t) => t.id),
				userMatches,
				refereeCounts
			);
			userMatches[i].ref = ref;
			refereeCounts[ref]++;
		});
	}

	determineReferee(
		teamsPerRound: number[],
		teams: number[],
		previousMatches: UserMatch[],
		refereeCounts: { [teamId: number]: number }
	): number {
		const availableTeams = teams.filter((team) => !teamsPerRound.includes(team));

		availableTeams.sort((a, b) => (refereeCounts[a] ?? 0) - (refereeCounts[b] ?? 0));

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
				return { id: 1 };
			}),
			createEvent: vi.fn((input: any) => {
				console.log('mockDatabaseService.createEvent called');
				input.id = 1;
				return input;
			}),
			deleteMatchesByEvent: vi.fn(),
			insertMatches: vi.fn((matches: UserMatch[]) => matches),
			load: vi.fn(() => []), // Return an empty array or the matches as expected
			updateMatch: vi.fn((match: MatchRow) => match)
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

		const teams = Array.from({ length: 2 }, (_x, i) => ({
			id: `team${i}`,
			event_id: '1',
			created_at: null,
			name: '',
			state: null
		}));

		await matches.load();
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

		const teams = Array.from({ length: 4 }, (_x, i) => ({
			id: `team${i}`,
			event_id: '1',
			created_at: '',
			name: `team${i}`,
			state: 'active'
		}));

		await matches.load();
		await matches.create(input, teams);

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

		const teams = Array.from({ length: 7 }, (_x, i) => ({
			id: `${i + 1}`,
			event_id: '1',
			created_at: '',
			name: `team${i}`,
			state: 'active'
		}));

		await matches.load();
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

		expect(min).toEqual(max);
	});
}
