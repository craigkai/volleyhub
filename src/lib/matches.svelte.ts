import type { MatchesSupabaseDatabaseService } from '$lib/database/matches';
import { RoundRobin } from './brackets/roundRobin';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Base } from './base';
import type { Brackets } from './brackets/brackets.svelte';
import { Event } from '$lib/event.svelte';

export class Matches extends Base {
	public databaseService: MatchesSupabaseDatabaseService;
	event_id?: number;
	matches? = $state<MatchRow[]>();
	subscriptionStatus? = $state();
	type = 'pool';

	constructor(databaseService: MatchesSupabaseDatabaseService) {
		super();
		this.databaseService = databaseService;
	}

	async load(id: number) {
		try {
			const res = await this.databaseService.load(id, {
				column: 'type',
				operator: 'eq',
				value: this.type
			});
			this.event_id = id;

			if (res) this.matches = res;
		} catch (err) {
			this.handleError(500, `Failed to load matches: ${(err as Error).message}`);
		}
		return this;
	}

	async handleUpdate(
		self: Matches | Brackets,
		payload: RealtimePostgresChangesPayload<{ [key: string]: any }>
	): Promise<void> {
		if (!self.event_id) {
			throw new Error('Event ID is required to handle updates.');
		}

		const old = payload.old as MatchRow;
		const updated = payload.new as MatchRow;

		// If we are updating for another type of match, ignore it
		if (self.type !== updated.type) return;

		if (self.type === 'bracket') {
			await self.load(self.event_id);
			(self as Brackets).nextRound(updated);
		}

		if (!self.matches) {
			await self.load(self.event_id);
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
		const channel = await this.databaseService.subscribeToChanges(
			this,
			this.handleUpdate,
			'matches',
			`event_id=eq.${this.event_id}`
		);
		this.subscriptionStatus = channel.state;
		return channel;
	}

	async create(
		{ pools, courts, refs = 'provided' }: Event | Partial<EventRow>,
		teams: TeamRow[] | Partial<TeamRow>[]
	): Promise<Matches | undefined> {
		if (!this.event_id) {
			this.handleError(400, 'Event ID is required to create matches.');
			return;
		}

		try {
			this.validateInputs(teams, pools, courts, refs);

			await this.databaseService.deleteMatchesByEvent(this.event_id);

			const matches = this.generateMatches(pools!, teams, courts!);

			if (refs === 'teams') {
				this.assignReferees(matches, teams);
			}

			const res = await this.databaseService.insertMatches(matches);
			if (res) this.matches = res;

			return this;
		} catch (err) {
			this.handleError(500, err instanceof Error ? err.message : (err as string));
		}
	}

	async updateMatch(match: MatchRow): Promise<MatchRow | null> {
		const updatedMatch = await this.databaseService.put(match);

		if (!updatedMatch) {
			this.handleError(500, 'Failed to update match.');
		}

		if (this.matches) {
			const matchIndex = this?.matches.findIndex((m: MatchRow) => m.id === match.id);

			if (matchIndex !== -1) {
				// Existing match, update it
				const updatedMatches = { ...this.matches[matchIndex], ...updatedMatch };
				this.matches.splice(matchIndex, 1, updatedMatches);
			}
		}

		return updatedMatch;
	}

	validateInputs(
		teams: TeamRow[] | Partial<TeamRow>[],
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

	generateMatches(pools: number, teams: Partial<TeamRow>[], courts: number): Partial<MatchRow>[] {
		let matches: Partial<MatchRow>[] = [];
		const totalMatches = (teams.length * pools) / 2; // Calculate the total number of matches needed

		let currentRound = 1;
		const teamsPerRound: { [round: number]: Set<number> } = {};

		// Generate matches using RoundRobin
		for (let i = 0; i < totalMatches; i += courts) {
			const roundMatches = RoundRobin(
				teams.map((t) => t.id).filter((id) => id !== undefined) as number[],
				currentRound,
				courts
			);

			// Assign matches to rounds and distribute them based on courts
			for (const match of roundMatches) {
				if (!teamsPerRound[currentRound]) {
					teamsPerRound[currentRound] = new Set();
				}

				if (teamsPerRound[currentRound].size >= courts * 2) {
					currentRound++;
					teamsPerRound[currentRound] = new Set();
				}

				match.round = currentRound;
				teamsPerRound[currentRound].add(match.team1!);
				teamsPerRound[currentRound].add(match.team2!);
			}

			matches = matches.concat(roundMatches);
		}

		// Add eventId to each match
		matches = matches.map((match) => ({ ...match, event_id: this.event_id }));

		return matches.slice(0, totalMatches); // Limit to the required number of matches
	}

	assignReferees(matches: Partial<MatchRow>[], teams: Partial<TeamRow>[]) {
		const teamsPerRound: { [round: number]: Set<number> } = {};

		matches.forEach((match) => {
			const round = match.round!;
			if (!teamsPerRound[round]) {
				teamsPerRound[round] = new Set();
			}
			teamsPerRound[round].add(match.team1!);
			teamsPerRound[round].add(match.team2!);
		});

		const refereeCounts: { [teamId: number]: number } = {};
		teams.forEach((team) => {
			if (team.id !== undefined) {
				refereeCounts[team.id] = 0;
			}
		});

		matches.forEach((match) => {
			const round = match.round!;
			const ref = this.determineReferee(
				Array.from(teamsPerRound[round]),
				teams.map((t) => t.id).filter((id) => id !== undefined) as number[],
				refereeCounts
			);
			match.ref = ref;
			if (ref !== -1) {
				refereeCounts[ref]++;
			}
		});
	}

	determineReferee(
		teamsPlayingThisRound: number[],
		allTeams: number[],
		refereeCounts: { [teamId: number]: number }
	): number {
		// Filter out teams already playing in the current round
		const availableTeams = allTeams.filter((team) => !teamsPlayingThisRound.includes(team));

		if (availableTeams.length === 0) {
			throw new Error('No available teams to assign as referees.');
		}

		// Sort available teams by the number of times they have refereed, ascending
		availableTeams.sort((a, b) => refereeCounts[a] - refereeCounts[b]);

		return availableTeams[0];
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
			eventId: '1',
			created_at: null,
			name: '',
			state: null
		})) as unknown as Partial<TeamRow>[];

		await matches.load();
		await matches.create(input, teams);

		expect(matches.matches?.length).toEqual(1);

		const gamesPerTeam: any = { team0: 0, team1: 0 };
		matches?.matches?.forEach((match: MatchRow) => {
			if (match.team1 && match.team2) {
				gamesPerTeam[match.team1]++;
				gamesPerTeam[match.team2]++;
			}
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
			eventId: '1',
			created_at: '',
			name: `team${i}`,
			state: 'active'
		})) as unknown as Partial<TeamRow>[];

		await matches.load();
		await matches.create(input, teams);

		expect(matches?.matches?.length).toEqual(3 * (4 / 2));

		const gamesPerTeam: any = { team0: 0, team1: 0, team2: 0, team3: 0 };
		matches?.matches?.forEach((match: MatchRow) => {
			if (match.team1 && match.team2) {
				gamesPerTeam[match.team1]++;
				gamesPerTeam[match.team2]++;
			}
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
			eventId: '1',
			created_at: '',
			name: `team${i}`,
			state: 'active'
		})) as unknown as Partial<TeamRow>[];

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
