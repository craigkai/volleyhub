import { error } from '@sveltejs/kit';
import type { SupabaseDatabaseService } from './supabaseDatabaseService';
import { RoundRobin } from './roundRobin';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export class Matches {
	private databaseService: SupabaseDatabaseService;

	event_id: number;
	matches?: MatchRow[];

	constructor(event_id: number, databaseService: SupabaseDatabaseService) {
		this.databaseService = databaseService;
		this.event_id = event_id;
	}

	/*
	Load all matches for the current tournament.
	*/
	async load() {
		const res = await this.databaseService.loadMatches(this.event_id);

		if (res) {
			this.matches = res;
		}

		return this.matches;
	}

	async matchUpdated(
		payload: RealtimePostgresChangesPayload<{
			[key: string]: MatchRow;
		}>
	): Promise<void> {
		const old = payload.old.id as MatchRow;
		const matchIndex = this.matches?.findIndex((m: MatchRow) => m.id === old.id);
		if (matchIndex !== undefined && matchIndex !== -1) {
			this.matches?.splice(matchIndex, 1, payload.new as MatchRow);
			const matches = this.matches;
			this.matches = matches;
		}
	}

	async subscribe(): Promise<RealtimeChannel> {
		return await this.databaseService.subscribeToChanges(
			() => this.matchUpdated,
			'matches',
			'event_id=eq.' + this.event_id
		);
	}

	async create(
		{ pools, courts }: Partial<EventRow>,
		teams: TeamRow[]
	): Promise<Matches | undefined> {
		if (!teams || teams.length === 0) {
			console.error("Can't generate matches without Teams");
			error(500, Error("Can't generate matches without Teams"));
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
			let matches: Match[] = [];
			// If we have more pool play games than matches we got
			// back, then we need to generate some more.
			while (matches.length < pools * teams.length) {
				matches = matches.concat(RoundRobin(teams));
			}
			// Delete all old matches as they are now invalid
			await this.databaseService.deleteMatchesByEvent(this.event_id);

			let courtsAvailable = courts;
			let teamsAvailable = teams.length;
			let round = 0;

			let totalRounds = 0;
			const userMatches: UserMatch[] = [];
			matches.forEach((match: Match) => {
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

				match.court = courts - courtsAvailable;
				match.round = round;

				courtsAvailable = courtsAvailable - 1;
				if (teamsAvailable >= 2) {
					userMatches.push({
						event_id: this.event_id,
						team1: match?.player1?.id,
						team2: match?.player2?.id,
						court: match.court,
						round: match.round
					});
				}
				teamsAvailable = teamsAvailable - 2;
			});

			// Call multi insert:
			const res = await this.databaseService.insertMatches(userMatches);
			if (res) {
				this.matches = res;
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
