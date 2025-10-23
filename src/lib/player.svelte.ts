import { Base } from './base';
import type { PlayerSupabaseDatabaseService } from './database/player';

export class Player extends Base {
	private databaseService: PlayerSupabaseDatabaseService;

	id?: number;
	created_at?: string;
	name: string = $state('');
	event_id?: number;
	email?: string | null = $state(null);
	phone?: string | null = $state(null);
	gender?: string | null = $state(null);
	skill_level?: number | null = $state(null);
	state: string = $state('active');

	// Computed stats (populated from player_stats)
	wins: number = $state(0);
	losses: number = $state(0);
	pointsDiff: number = $state(0);
	totalPoints: number = $state(0);
	matchesPlayed: number = $state(0);

	constructor(databaseService: PlayerSupabaseDatabaseService) {
		super();
		this.databaseService = databaseService;
	}

	async load(id: number): Promise<Player | null> {
		try {
			const res = await this.databaseService.load(id);
			if (res) {
				Object.assign(this, res);
			}
			return this;
		} catch (error) {
			console.error('An error occurred while loading the player:', error);
			throw error;
		}
	}

	/**
	 * Inserts a new player into the database.
	 * @param {Partial<PlayerRow>} player - The player data to be created.
	 * @returns {Promise<number | undefined>} - A promise that resolves to the player ID.
	 */
	async create(player: Partial<PlayerRow>): Promise<number | undefined> {
		try {
			const res = await this.databaseService.create(player);
			if (res) {
				Object.assign(this, res);
				return res.id;
			}
			console.warn('Failed to create player', player);
			return undefined;
		} catch (err) {
			this.handleError(500, `Failed to create player: ${(err as Error).message}`);
			return undefined;
		}
	}

	/**
	 * Deletes a player from the database.
	 * @param {Player} player - The player to be deleted.
	 * @returns {Promise<void>} - A promise that resolves when the player is successfully deleted.
	 */
	async delete(player: Player): Promise<void> {
		if (!this.event_id) {
			this.handleError(400, 'No event Id found for player');
			return;
		}

		try {
			await this.databaseService.delete(player);
		} catch (err) {
			this.handleError(500, `Failed to delete player: ${(err as Error).message}`);
		}
	}

	/**
	 * Updates a player in the database.
	 * @param {Player} player - The player to be updated.
	 * @returns {Promise<Player | undefined>} - A promise that resolves to the updated player.
	 */
	async update(player: Player): Promise<Player | undefined> {
		try {
			const res = await this.databaseService.put(player);
			if (res) {
				Object.assign(this, res);
				return this;
			}
			console.warn('Failed to update player', player);
			this.handleError(500, 'Failed to update player');
		} catch (err) {
			this.handleError(500, `Failed to update player: ${(err as Error).message}`);
			return undefined;
		}
	}

	/**
	 * Calculate win percentage
	 */
	get winPercentage(): number {
		if (this.matchesPlayed === 0) return 0;
		return this.wins / this.matchesPlayed;
	}
}
