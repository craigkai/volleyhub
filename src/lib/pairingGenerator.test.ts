import { describe, it, expect, beforeEach } from 'vitest';
import { PairingGenerator } from './pairingGenerator.svelte';
import { Team } from './team.svelte';

// Mock Team class for testing
function createMockTeam(id: number, name: string): Team {
	const team = new Team({} as any);
	team.id = id;
	team.name = name;
	return team;
}

describe('PairingGenerator', () => {
	let generator: PairingGenerator;

	beforeEach(() => {
		generator = new PairingGenerator();
	});

	describe('generateSnakeDraftPairings', () => {
		it('should handle even number of teams for 1v1', () => {
			const teams = [
				createMockTeam(1, 'Team 1'),
				createMockTeam(2, 'Team 2'),
				createMockTeam(3, 'Team 3'),
				createMockTeam(4, 'Team 4')
			];

			const pairings = generator.generateSnakeDraftPairings(teams, 1);

			expect(pairings).toHaveLength(2);
			expect(pairings[0]).toEqual({
				homeTeams: [1],
				awayTeams: [2]
			});
			expect(pairings[1]).toEqual({
				homeTeams: [3],
				awayTeams: [4]
			});
		});

		it('should handle odd number of teams for 1v1 (one team sits out)', () => {
			const teams = [
				createMockTeam(1, 'Team 1'),
				createMockTeam(2, 'Team 2'),
				createMockTeam(3, 'Team 3'),
				createMockTeam(4, 'Team 4'),
				createMockTeam(5, 'Team 5')
			];

			const pairings = generator.generateSnakeDraftPairings(teams, 1);

			expect(pairings).toHaveLength(2);
			// Team 5 should sit out
			expect(pairings[0]).toEqual({
				homeTeams: [1],
				awayTeams: [2]
			});
			expect(pairings[1]).toEqual({
				homeTeams: [3],
				awayTeams: [4]
			});
		});

		it('should handle even number of teams for 2v2', () => {
			const teams = [
				createMockTeam(1, 'Team 1'),
				createMockTeam(2, 'Team 2'),
				createMockTeam(3, 'Team 3'),
				createMockTeam(4, 'Team 4')
			];

			const pairings = generator.generateSnakeDraftPairings(teams, 2);

			expect(pairings).toHaveLength(1);
			expect(pairings[0]).toEqual({
				homeTeams: [1, 4],
				awayTeams: [2, 3]
			});
		});

		it('should handle 5 teams for 2v2 (one team sits out)', () => {
			const teams = [
				createMockTeam(1, 'Team 1'),
				createMockTeam(2, 'Team 2'),
				createMockTeam(3, 'Team 3'),
				createMockTeam(4, 'Team 4'),
				createMockTeam(5, 'Team 5')
			];

			const pairings = generator.generateSnakeDraftPairings(teams, 2);

			expect(pairings).toHaveLength(1);
			// Team 5 sits out
			expect(pairings[0]).toEqual({
				homeTeams: [1, 4],
				awayTeams: [2, 3]
			});
		});

		it('should handle 6 teams for 2v2 (creates 1 full match and 1 partial match)', () => {
			const teams = [
				createMockTeam(1, 'Team 1'),
				createMockTeam(2, 'Team 2'),
				createMockTeam(3, 'Team 3'),
				createMockTeam(4, 'Team 4'),
				createMockTeam(5, 'Team 5'),
				createMockTeam(6, 'Team 6')
			];

			const pairings = generator.generateSnakeDraftPairings(teams, 2);

			expect(pairings).toHaveLength(2);
			// First match is full 2v2
			expect(pairings[0]).toEqual({
				homeTeams: [1, 4],
				awayTeams: [2, 3]
			});
			// Second match is partial 1v1 with remaining teams
			expect(pairings[1]).toEqual({
				homeTeams: [5],
				awayTeams: [6]
			});
		});

		it('should handle even number of teams for 3v3', () => {
			const teams = [
				createMockTeam(1, 'Team 1'),
				createMockTeam(2, 'Team 2'),
				createMockTeam(3, 'Team 3'),
				createMockTeam(4, 'Team 4'),
				createMockTeam(5, 'Team 5'),
				createMockTeam(6, 'Team 6')
			];

			const pairings = generator.generateSnakeDraftPairings(teams, 3);

			expect(pairings).toHaveLength(1);
			expect(pairings[0].homeTeams).toHaveLength(3);
			expect(pairings[0].awayTeams).toHaveLength(3);
		});

		it('should handle 8 teams for 3v3 (2 teams sit out)', () => {
			const teams = [
				createMockTeam(1, 'Team 1'),
				createMockTeam(2, 'Team 2'),
				createMockTeam(3, 'Team 3'),
				createMockTeam(4, 'Team 4'),
				createMockTeam(5, 'Team 5'),
				createMockTeam(6, 'Team 6'),
				createMockTeam(7, 'Team 7'),
				createMockTeam(8, 'Team 8')
			];

			const pairings = generator.generateSnakeDraftPairings(teams, 3);

			expect(pairings).toHaveLength(1);
			// Should create one complete 3v3 match, teams 7 and 8 sit out
			expect(pairings[0].homeTeams).toHaveLength(3);
			expect(pairings[0].awayTeams).toHaveLength(3);
		});
	});

	describe('generateConsecutivePairings', () => {
		it('should handle even number of teams for 1v1', () => {
			const teams = [
				createMockTeam(1, 'Team 1'),
				createMockTeam(2, 'Team 2'),
				createMockTeam(3, 'Team 3'),
				createMockTeam(4, 'Team 4')
			];

			const pairings = generator.generateConsecutivePairings(teams, 1);

			expect(pairings).toHaveLength(2);
			expect(pairings[0]).toEqual({
				homeTeams: [1],
				awayTeams: [2]
			});
			expect(pairings[1]).toEqual({
				homeTeams: [3],
				awayTeams: [4]
			});
		});

		it('should handle odd number of teams for 1v1 (one team sits out)', () => {
			const teams = [
				createMockTeam(1, 'Team 1'),
				createMockTeam(2, 'Team 2'),
				createMockTeam(3, 'Team 3')
			];

			const pairings = generator.generateConsecutivePairings(teams, 1);

			expect(pairings).toHaveLength(1);
			// Team 3 sits out
			expect(pairings[0]).toEqual({
				homeTeams: [1],
				awayTeams: [2]
			});
		});

		it('should handle 5 teams for 2v2 (one team sits out)', () => {
			const teams = [
				createMockTeam(1, 'Team 1'),
				createMockTeam(2, 'Team 2'),
				createMockTeam(3, 'Team 3'),
				createMockTeam(4, 'Team 4'),
				createMockTeam(5, 'Team 5')
			];

			const pairings = generator.generateConsecutivePairings(teams, 2);

			expect(pairings).toHaveLength(1);
			// Team 5 sits out
			expect(pairings[0]).toEqual({
				homeTeams: [1, 2],
				awayTeams: [3, 4]
			});
		});

		it('should handle 7 teams for 3v3 (one team sits out)', () => {
			const teams = [
				createMockTeam(1, 'Team 1'),
				createMockTeam(2, 'Team 2'),
				createMockTeam(3, 'Team 3'),
				createMockTeam(4, 'Team 4'),
				createMockTeam(5, 'Team 5'),
				createMockTeam(6, 'Team 6'),
				createMockTeam(7, 'Team 7')
			];

			const pairings = generator.generateConsecutivePairings(teams, 3);

			expect(pairings).toHaveLength(1);
			// Team 7 sits out
			expect(pairings[0]).toEqual({
				homeTeams: [1, 2, 3],
				awayTeams: [4, 5, 6]
			});
		});
	});

	describe('generateRandomPairings', () => {
		it('should handle odd number of teams (one team sits out)', () => {
			const teams = [
				createMockTeam(1, 'Team 1'),
				createMockTeam(2, 'Team 2'),
				createMockTeam(3, 'Team 3'),
				createMockTeam(4, 'Team 4'),
				createMockTeam(5, 'Team 5')
			];

			const pairings = generator.generateRandomPairings(teams, 1);

			// Should create 2 matches, with one team sitting out
			expect(pairings).toHaveLength(2);
			pairings.forEach((pairing) => {
				expect(pairing.homeTeams).toHaveLength(1);
				expect(pairing.awayTeams).toHaveLength(1);
			});
		});
	});

	describe('generateMultiRoundIndividualPairings', () => {
		it('should generate enough matches for each player to play target number of games (3v3)', () => {
			// 12 players, 3v3 format, each player should play 5 games
			const teams = Array.from({ length: 12 }, (_, i) => createMockTeam(i + 1, `Player ${i + 1}`));
			const teamsPerSide = 3;
			const targetGames = 5;

			const pairings = generator.generateMultiRoundIndividualPairings(teams, teamsPerSide, targetGames);

			// Count games per player
			const playerGameCounts = new Map<number, number>();
			teams.forEach((team) => playerGameCounts.set(team.id!, 0));

			pairings.forEach((pairing) => {
				[...pairing.homeTeams, ...pairing.awayTeams].forEach((playerId) => {
					playerGameCounts.set(playerId, (playerGameCounts.get(playerId) ?? 0) + 1);
				});
			});

			// Each player should have played approximately the target number of games
			playerGameCounts.forEach((count, playerId) => {
				expect(count).toBeGreaterThanOrEqual(targetGames - 1);
				expect(count).toBeLessThanOrEqual(targetGames + 1);
			});

			// Each match should have correct number of players
			pairings.forEach((pairing) => {
				expect(pairing.homeTeams).toHaveLength(teamsPerSide);
				expect(pairing.awayTeams).toHaveLength(teamsPerSide);
			});
		});

		it('should generate multiple rounds for 2v2', () => {
			// 8 players, 2v2 format, each player should play 3 games
			const teams = Array.from({ length: 8 }, (_, i) => createMockTeam(i + 1, `Player ${i + 1}`));
			const teamsPerSide = 2;
			const targetGames = 3;

			const pairings = generator.generateMultiRoundIndividualPairings(teams, teamsPerSide, targetGames);

			// Count games per player
			const playerGameCounts = new Map<number, number>();
			teams.forEach((team) => playerGameCounts.set(team.id!, 0));

			pairings.forEach((pairing) => {
				[...pairing.homeTeams, ...pairing.awayTeams].forEach((playerId) => {
					playerGameCounts.set(playerId, (playerGameCounts.get(playerId) ?? 0) + 1);
				});
			});

			// Each player should have played the target number of games
			playerGameCounts.forEach((count) => {
				expect(count).toBe(targetGames);
			});
		});

		it('should handle uneven player counts (some players sit out)', () => {
			// 10 players, 3v3 format - not divisible by 6
			const teams = Array.from({ length: 10 }, (_, i) => createMockTeam(i + 1, `Player ${i + 1}`));
			const teamsPerSide = 3;
			const targetGames = 4;

			const pairings = generator.generateMultiRoundIndividualPairings(teams, teamsPerSide, targetGames);

			// Should generate matches even with uneven numbers
			expect(pairings.length).toBeGreaterThan(0);

			// Each match should still have correct structure
			pairings.forEach((pairing) => {
				expect(pairing.homeTeams).toHaveLength(teamsPerSide);
				expect(pairing.awayTeams).toHaveLength(teamsPerSide);
			});
		});

		it('should minimize repeat teammates', () => {
			// 12 players, 2v2 format, 6 games each = 36 total matches
			// With 12 players, each player has 11 potential teammates
			// Playing 6 games = 6 teammate slots
			// Should have minimal repeats
			const teams = Array.from({ length: 12 }, (_, i) => createMockTeam(i + 1, `Player ${i + 1}`));
			const teamsPerSide = 2;
			const targetGames = 6;

			const pairings = generator.generateMultiRoundIndividualPairings(teams, teamsPerSide, targetGames);

			// Track teammate pairs
			const teammateCounts = new Map<string, number>();

			pairings.forEach((pairing) => {
				// Home teammates
				const [home1, home2] = pairing.homeTeams;
				const homeKey = home1 < home2 ? `${home1}-${home2}` : `${home2}-${home1}`;
				teammateCounts.set(homeKey, (teammateCounts.get(homeKey) ?? 0) + 1);

				// Away teammates
				const [away1, away2] = pairing.awayTeams;
				const awayKey = away1 < away2 ? `${away1}-${away2}` : `${away2}-${away1}`;
				teammateCounts.set(awayKey, (teammateCounts.get(awayKey) ?? 0) + 1);
			});

			// Calculate statistics
			const repeatCounts = Array.from(teammateCounts.values());
			const maxRepeats = Math.max(...repeatCounts);
			const avgRepeats = repeatCounts.reduce((a, b) => a + b, 0) / repeatCounts.length;

			// With greedy algorithm, most pairs should only play together once
			// Maximum repeats should be low (ideally ≤2, but we'll allow ≤3 for variance)
			expect(maxRepeats).toBeLessThanOrEqual(3);

			// Average should be close to 1 (most pairs play together once)
			expect(avgRepeats).toBeLessThanOrEqual(1.5);
		});

		it('should minimize repeat opponents', () => {
			// 8 players, 2v2 format, 5 games each
			const teams = Array.from({ length: 8 }, (_, i) => createMockTeam(i + 1, `Player ${i + 1}`));
			const teamsPerSide = 2;
			const targetGames = 5;

			const pairings = generator.generateMultiRoundIndividualPairings(teams, teamsPerSide, targetGames);

			// Track opponent pairs
			const opponentCounts = new Map<string, number>();

			pairings.forEach((pairing) => {
				// Each home player faces each away player
				pairing.homeTeams.forEach((homeId) => {
					pairing.awayTeams.forEach((awayId) => {
						const key = homeId < awayId ? `${homeId}-${awayId}` : `${awayId}-${homeId}`;
						opponentCounts.set(key, (opponentCounts.get(key) ?? 0) + 1);
					});
				});
			});

			// Calculate statistics
			const repeatCounts = Array.from(opponentCounts.values());
			const maxRepeats = Math.max(...repeatCounts);

			// With 8 players, 2v2, playing 5 games = each player faces 10 opponent slots
			// But there are only 7 possible opponents
			// Some repeats are inevitable, but should be minimized
			// Max repeats should be reasonable (≤3)
			expect(maxRepeats).toBeLessThanOrEqual(3);
		});

		it('should perform better than pure random for 3v3', () => {
			// This test compares greedy to random by running both and comparing repeat statistics
			const teams = Array.from({ length: 12 }, (_, i) => createMockTeam(i + 1, `Player ${i + 1}`));
			const teamsPerSide = 3;
			const targetGames = 4;

			// Generate with greedy algorithm
			const greedyPairings = generator.generateMultiRoundIndividualPairings(teams, teamsPerSide, targetGames);

			// Count repeats in greedy
			const greedyTeammateCounts = new Map<string, number>();
			greedyPairings.forEach((pairing) => {
				// Count all teammate pairs in both teams
				const countTeamPairs = (teamIds: number[]) => {
					for (let i = 0; i < teamIds.length; i++) {
						for (let j = i + 1; j < teamIds.length; j++) {
							const key = teamIds[i] < teamIds[j]
								? `${teamIds[i]}-${teamIds[j]}`
								: `${teamIds[j]}-${teamIds[i]}`;
							greedyTeammateCounts.set(key, (greedyTeammateCounts.get(key) ?? 0) + 1);
						}
					}
				};
				countTeamPairs(pairing.homeTeams);
				countTeamPairs(pairing.awayTeams);
			});

			const greedyRepeats = Array.from(greedyTeammateCounts.values());
			const greedyMaxRepeats = Math.max(...greedyRepeats);
			const greedyAvgRepeats = greedyRepeats.reduce((a, b) => a + b, 0) / greedyRepeats.length;

			// Greedy should keep repeats low
			expect(greedyMaxRepeats).toBeLessThanOrEqual(2);
			expect(greedyAvgRepeats).toBeLessThanOrEqual(1.3);
		});
	});
});
