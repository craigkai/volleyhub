import type { EventSupabaseDatabaseService } from '$lib/database/event';
import type { Infer } from 'sveltekit-superforms';
import { Base } from './base';
import type { FormSchema } from '$schemas/settingsSchema';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * The Event class represents a tournament in the application.
 * It provides methods for creating and managing a tournament.
 */
export class Event extends Base {
	// The service used to interact with the database
	private databaseService: EventSupabaseDatabaseService;

	// Event properties
	id?: number;
	name?: string = $state();
	date?: string = $state();
	pools?: number = $state();
	courts?: number = $state();
	owner?: string = $state();
	created_at?: string;
	scoring?: string = $state();
	refs?: string = $state();
	description?: string;
	current_round?: number = $state();
	subscriptionStatus = $state();

	/**
	 * The constructor for the Event class.
	 * @param {EventSupabaseDatabaseService} databaseService - The service used to interact with the database.
	 */
	constructor(databaseService: EventSupabaseDatabaseService) {
		super();

		this.databaseService = databaseService;
	}

	/**
	 * Handles real-time updates for the `events` table.
	 *
	 * @param {Event | Tournament} self - Instance managing the current event state.
	 * @param {RealtimePostgresChangesPayload<Record<string, unknown>>} payload - Supabase change payload.
	 * @returns {Promise<void>} - Resolves after handling the update.
	 */
	async handleUpdate(
		self: { id: number; current_round?: number } & Record<string, unknown>,
		payload: RealtimePostgresChangesPayload<Record<string, unknown>>
	): Promise<void> {
		if (!self.id) {
			throw new Error('Event ID is required to handle updates.');
		}

		const updated = payload.new as EventRow;

		if (updated.id !== self.id) return;

		console.info(`handleEventUpdate: ${JSON.stringify(payload)}`);

		// Update all tournament settings that can change
		if (typeof updated.current_round === 'number') {
			self.current_round = updated.current_round;
		}
		if (updated.refs !== undefined) {
			self.refs = updated.refs;
		}
		if (updated.name !== undefined) {
			self.name = updated.name;
		}
		if (updated.description !== undefined) {
			self.description = updated.description;
		}
		if (typeof updated.courts === 'number') {
			self.courts = updated.courts;
		}
		if (typeof updated.pools === 'number') {
			self.pools = updated.pools;
		}
		if (updated.scoring !== undefined) {
			self.scoring = updated.scoring;
		}
		if (updated.date !== undefined) {
			self.date = updated.date;
		}
	}

	/**
	 * Subscribes to live changes for matches belonging to the current event.
	 *
	 * @returns {Promise<RealtimeChannel>} - Promise resolving with the Supabase real-time channel.
	 */
	async subscribeToCurrentRound(): Promise<RealtimeChannel> {
		if (!this.id) {
			throw new Error('Event ID is required to subscribe to current round.');
		}

		const channel = await this.databaseService.subscribeToChanges(
			this,
			this.handleUpdate,
			'events',
			`id=eq.${this.id}`
		);
		this.subscriptionStatus = channel.state;
		return channel;
	}

	/**
	 * Create a new event. This creates the tournament settings only.
	 * @param {Infer<FormSchema>} input - The data for the event to create.
	 * @returns {Promise<Event>} - Returns a promise that resolves to the newly created event.
	 * @throws {Error} - Throws an error if the event data does not have all required values.
	 */
	async create(input: Infer<FormSchema>): Promise<Event> {
		if ('id' in input) {
			delete input.id;
		}

		const currentUser = await this.databaseService.getCurrentUser();
		input.owner = currentUser?.id as string;

		const res: EventRow | null = await this.databaseService.create(input);

		if (res !== null) {
			Object.assign(this, res);
		}

		return this;
	}

	/**
	 * Updates the event with the given data.
	 * @param {number} id - The ID of the event.
	 * @param {Infer<FormSchema>} input - The data to update the event with.
	 * @returns {Promise<Event>} - Returns a promise that resolves to the updated event.
	 * @throws {Error} - Throws an error if there's an issue updating the event.
	 */
	async update(id: number, input: Infer<FormSchema>): Promise<Event> {
		const res: EventRow | null = await this.databaseService.put(id, input);

		if (res !== null) {
			Object.assign(this, res);
		}
		return this;
	}

	/**
	 * Load the event (tournament settings) from the database.
	 * @returns {Promise<Event>} - Returns a promise that resolves to the loaded event.
	 */
	async load(id: number): Promise<Event> {
		if (!id) {
			this.handleError(400, 'Invalid event ID, are you sure your link is correct?');
		}

		try {
			const eventResponse: EventRow | null = await this.databaseService.load(id);

			if (eventResponse !== null) {
				Object.assign(this, eventResponse);
			}
		} catch (err) {
			this.handleError(500, `Failed to load event: ${(err as Error).message}`);
		}
		return this;
	}

	/**
	 * Deletes the event.
	 * @returns {Promise<void>} - Returns a promise that resolves when the event is deleted.
	 */
	async delete(): Promise<void> {
		if (!this.id) {
			this.handleError(400, 'Invalid event ID, are you sure your link is correct?');
			return;
		}

		try {
			await this.databaseService.delete(this.id);
		} catch (err) {
			this.handleError(500, `Failed to delete event: ${(err as Error).message}`);
		}
	}

	/**
	 * Set the current round for this event.
	 * @param {number} round - The round number to mark as current.
	 * @returns {Promise<void>} - Resolves once the round is updated.
	 */
	async setCurrentRound(round: number): Promise<void> {
		if (!this.id) {
			this.handleError(400, 'Event ID is missing. Cannot set current round.');
			return;
		}

		try {
			const res: EventRow | null = await this.databaseService.setCurrentRound(this.id, round);
			if (res !== null) {
				Object.assign(this, res);
			}
		} catch (err) {
			this.handleError(500, `Failed to set current round: ${(err as Error).message}`);
		}
	}
}

// Vitest unit tests

if (import.meta.vitest) {
	const { vi, it, expect, beforeEach } = import.meta.vitest;

	let mockDatabaseService: any;
	let event: Event;

	beforeEach(() => {
		mockDatabaseService = {
			update: vi.fn(() => console.log('mockDatabaseService.update called')),
			delete: vi.fn(() => console.log('mockDatabaseService.delete called')),
			load: vi.fn(() => ({
				id: 1,
				name: 'Test Event',
				date: '2023-01-01',
				pools: 2,
				courts: 4,
				owner: 'test',
				created_at: '2023-01-01',
				scoring: 'standard',
				refs: 'assigned'
			})),
			getCurrentUser: vi.fn(() => {
				return {
					id: 1
				};
			}),
			createEvent: vi.fn((input: any) => {
				input.id = 1;
				return input;
			}),
			updateMatch: vi.fn((input: any) => {
				return input;
			})
		};
		event = new Event(mockDatabaseService);
	});

	it('should throw an error if not all required values are provided', async () => {
		const input: Partial<EventRow> = {
			name: 'Test Tournament'
			// date, pools, and courts are missing
		};

		await expect(event.update(1, input as Infer<FormSchema>)).rejects.toThrow();
	});
}
