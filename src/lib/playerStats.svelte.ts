import { Base } from './base';
import { PlayerStatsSupabaseDatabaseService } from './database/playerStats';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * The PlayerStats class manages individual player statistics for mix-and-match tournaments.
 */
export class PlayerStats extends Base {
	private databaseService: PlayerStatsSupabaseDatabaseService;
	eventId?: number;
	stats = $state<PlayerStatsRow[]>([]);
	subscriptionStatus = $state();

	/**
	 * The constructor for the PlayerStats class.
	 * @param {PlayerStatsSupabaseDatabaseService} databaseService - The service used to interact with the database.
	 */
	constructor(databaseService: PlayerStatsSupabaseDatabaseService) {
		super();
		this.databaseService = databaseService;
	}

	/**
	 * Load all player stats for a specific event.
	 * @param {number} eventId - The event ID to load stats for.
	 * @returns {Promise<PlayerStatsRow[] | undefined>} - A promise that resolves to the loaded stats.
	 */
	async loadByEvent(eventId: number): Promise<PlayerStatsRow[] | undefined> {
		if (!eventId) {
			this.handleError(400, 'Invalid event ID');
			return undefined;
		}

		this.eventId = eventId;

		try {
			const res = await this.databaseService.loadByEvent(eventId);
			if (!res) {
				console.warn('No player stats found for event', eventId);
				return [];
			}

			this.stats = res;
			return this.stats;
		} catch (err) {
			this.handleError(500, `Failed to load player stats: ${(err as Error).message}`);
			return undefined;
		}
	}

	/**
	 * Load all stats for a specific player.
	 * @param {number} playerId - The player ID to load stats for.
	 * @returns {Promise<PlayerStatsRow[] | undefined>} - A promise that resolves to the loaded stats.
	 */
	async loadByPlayer(playerId: number): Promise<PlayerStatsRow[] | undefined> {
		if (!playerId) {
			this.handleError(400, 'Invalid player ID');
			return undefined;
		}

		try {
			const res = await this.databaseService.loadByPlayer(playerId);
			if (!res) {
				console.warn('No stats found for player', playerId);
				return [];
			}

			return res;
		} catch (err) {
			this.handleError(500, `Failed to load stats for player: ${(err as Error).message}`);
			return undefined;
		}
	}

	/**
	 * Create multiple player stats records at once (batch).
	 * Useful when a match completes and we need to record stats for all players.
	 * @param {Partial<PlayerStatsRow>[]} stats - Array of player stats to create.
	 * @returns {Promise<PlayerStatsRow[] | undefined>} - A promise that resolves to the created stats.
	 */
	async createBatch(stats: Partial<PlayerStatsRow>[]): Promise<PlayerStatsRow[] | undefined> {
		try {
			const res = await this.databaseService.createBatch(stats);
			if (!res) {
				console.warn('Failed to create player stats batch');
				return undefined;
			}

			// Add new stats to the local state using array spread for reactivity
			this.stats = [...this.stats, ...res];

			return res;
		} catch (err) {
			this.handleError(500, `Failed to create player stats batch: ${(err as Error).message}`);
			return undefined;
		}
	}

	/**
	 * Create a single player stat record.
	 * @param {Partial<PlayerStatsRow>} stat - The player stat data to create.
	 * @returns {Promise<PlayerStatsRow | undefined>} - A promise that resolves to the created stat.
	 */
	async create(stat: Partial<PlayerStatsRow>): Promise<PlayerStatsRow | undefined> {
		try {
			const res = await this.databaseService.create(stat);
			if (!res) {
				console.warn('Failed to create player stat', stat);
				return undefined;
			}

			// Add new stat to the local state using array spread for reactivity
			this.stats = [...this.stats, res];

			return res;
		} catch (err) {
			this.handleError(500, `Failed to create player stat: ${(err as Error).message}`);
			return undefined;
		}
	}

	/**
	 * Get all stats for a specific player from the loaded stats.
	 * @param {number} playerId - The player ID.
	 * @returns {PlayerStatsRow[]} - Array of stats for the player.
	 */
	getByPlayerId(playerId: number): PlayerStatsRow[] {
		return this.stats.filter((s) => s.player_id === playerId);
	}

	/**
	 * Handles real-time updates for the player_stats table.
	 */
	async handleUpdate(
		self: PlayerStats,
		payload: RealtimePostgresChangesPayload<Record<string, unknown>>
	): Promise<void> {
		if (!self.eventId) {
			throw new Error('Event ID is required to handle player stats updates.');
		}

		const updated = payload.new as PlayerStatsRow;
		const old = payload.old as PlayerStatsRow;

		if (import.meta.env.DEV) {
			console.info(`handlePlayerStatsUpdate: ${JSON.stringify(payload)}`);
		}

		if (payload.eventType === 'INSERT') {
			// Use array spread to trigger reactivity
			self.stats = [...self.stats, updated];
			return;
		}

		if (payload.eventType === 'UPDATE') {
			const statToUpdate = self.stats.find((s: PlayerStatsRow) => s.id === old.id);
			if (statToUpdate) {
				// Update properties individually to trigger reactivity
				statToUpdate.player_id = updated.player_id;
				statToUpdate.event_id = updated.event_id;
				statToUpdate.match_id = updated.match_id;
				statToUpdate.win = updated.win;
				statToUpdate.points_scored = updated.points_scored;
				statToUpdate.points_allowed = updated.points_allowed;
			}
			return;
		}

		if (payload.eventType === 'DELETE') {
			// Use filter to create new array and trigger reactivity
			self.stats = self.stats.filter((s: PlayerStatsRow) => s.id !== old.id);
			return;
		}
	}

	/**
	 * Subscribes to live changes for player stats belonging to the current event.
	 */
	async subscribeToPlayerStats(): Promise<RealtimeChannel> {
		if (!this.eventId) {
			throw new Error('Event ID is required to subscribe to player stats.');
		}

		const channel = await this.databaseService.subscribeToChanges(
			this,
			this.handleUpdate,
			'player_stats',
			`event_id=eq.${this.eventId}`
		);
		this.subscriptionStatus = channel;
		return channel;
	}

	/**
	 * Unsubscribe from real-time updates for player stats.
	 */
	async unsubscribe(): Promise<void> {
		if (this.subscriptionStatus) {
			await this.databaseService.supabaseClient.removeChannel(this.subscriptionStatus);
		}
	}
}
