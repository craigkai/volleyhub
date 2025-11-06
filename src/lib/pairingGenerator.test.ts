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
});
