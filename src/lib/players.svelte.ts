import { PlayersSupabaseDatabaseService } from '$lib/database/players';
import { Base } from './base';
import { PlayerSupabaseDatabaseService } from './database/player';
import { Player } from './player.svelte';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * The Players class is responsible for managing player-related operations.
 * It extends the Base class and uses the PlayersSupabaseDatabaseService to interact with the database.
 */
export class Players extends Base {
	private databaseService: PlayersSupabaseDatabaseService;
	eventId?: number;
	players = $state<Player[]>([]);
	subscriptionStatus = $state();

	/**
	 * The constructor for the Players class.
	 * @param {PlayersSupabaseDatabaseService} databaseService - The service used to interact with the database.
	 */
	constructor(databaseService: PlayersSupabaseDatabaseService) {
		super();
		this.databaseService = databaseService;
	}

	/**
	 * Load all players for the current event.
	 * @returns {Promise<Player[] | undefined>} - A promise that resolves to the loaded players.
	 */
	async load(eventId: number): Promise<Player[] | undefined> {
		if (!eventId) {
			this.handleError(400, 'Invalid event ID');
			return undefined;
		}

		this.eventId = eventId;

		try {
			const res = await this.databaseService.load(eventId);
			if (!res) {
				console.warn('Failed to load players for event', eventId);
				return undefined;
			}
			const players: Player[] = [];

			const playerSupabaseDatabaseService = new PlayerSupabaseDatabaseService(
				this.databaseService.supabaseClient
			);

			for (let i = 0; i < res.length; i++) {
				let player = new Player(playerSupabaseDatabaseService);

				const playerRow = res[i];
				Object.assign(player, playerRow);
				players.push(player);
			}

			this.players = players;
			return this.players;
		} catch (err) {
			this.handleError(500, `Failed to load players: ${(err as Error).message}`);
			return undefined;
		}
	}

	/**
	 * Inserts a new player into the database.
	 * @param {Partial<PlayerRow>} player - The player data to be created.
	 * @returns {Promise<Player | undefined>} - A promise that resolves to the created player.
	 */
	async create(player: Partial<PlayerRow>): Promise<Player | undefined> {
		try {
			const res = await this.databaseService.create(player);
			if (res) {
				const playerSupabaseDatabaseService = new PlayerSupabaseDatabaseService(
					this.databaseService.supabaseClient
				);

				const newPlayer = new Player(playerSupabaseDatabaseService);
				await newPlayer.load(res.id);

				return newPlayer;
			}
			console.warn('Failed to create player', player);
			return undefined;
		} catch (err) {
			this.handleError(500, `Failed to create player: ${(err as Error).message}`);
			return undefined;
		}
	}

	/**
	 * Get a player by ID from the loaded players.
	 * @param {number} id - The player ID.
	 * @returns {Player | undefined} - The player if found.
	 */
	getById(id: number): Player | undefined {
		return this.players.find((p) => p.id === id);
	}

	/**
	 * Handles real-time updates for the players table.
	 */
	async handleUpdate(
		self: Players,
		payload: RealtimePostgresChangesPayload<Record<string, unknown>>
	): Promise<void> {
		if (!self.eventId) {
			throw new Error('Event ID is required to handle player updates.');
		}

		const updated = payload.new as PlayerRow;
		const old = payload.old as PlayerRow;

		if (import.meta.env.DEV) {
			console.info(`handlePlayerUpdate: ${JSON.stringify(payload)}`);
		}

		if (payload.eventType === 'INSERT') {
			const playerSupabaseDatabaseService = new PlayerSupabaseDatabaseService(
				self.databaseService.supabaseClient
			);
			const newPlayer = new Player(playerSupabaseDatabaseService);
			Object.assign(newPlayer, updated);
			self.players.push(newPlayer);
			return;
		}

		if (payload.eventType === 'UPDATE') {
			const playerToUpdate = self.players.find((p: Player) => p.id === old.id);
			if (playerToUpdate) {
				Object.assign(playerToUpdate, updated);
			}
			return;
		}

		if (payload.eventType === 'DELETE') {
			const index = self.players.findIndex((p: Player) => p.id === old.id);
			if (index > -1) {
				self.players.splice(index, 1);
			}
			return;
		}
	}

	/**
	 * Subscribes to live changes for players belonging to the current event.
	 */
	async subscribeToPlayers(): Promise<RealtimeChannel> {
		if (!this.eventId) {
			throw new Error('Event ID is required to subscribe to players.');
		}

		const channel = await this.databaseService.subscribeToChanges(
			this,
			this.handleUpdate,
			'players',
			`event_id=eq.${this.eventId}`
		);
		this.subscriptionStatus = channel;
		return channel;
	}

	/**
	 * Unsubscribe from real-time updates for players.
	 */
	async unsubscribe(): Promise<void> {
		if (this.subscriptionStatus) {
			await this.databaseService.supabaseClient.removeChannel(this.subscriptionStatus);
		}
	}
}
