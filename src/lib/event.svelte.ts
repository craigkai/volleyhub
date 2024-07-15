import type { EventSupabaseDatabaseService } from '$lib/database/event.svelte';
import type { Infer } from 'sveltekit-superforms';
import { Base } from './base';
import type { FormSchema } from '$schemas/settingsSchema';

/**
 * The Event class represents a tournament in the application.
 * It provides methods for creating and managing a tournament.
 */
export class Event extends Base {
	// The service used to interact with the database
	private databaseService: EventSupabaseDatabaseService;

	// Event properties
	id: number;
	name?: string;
	date?: string;
	pools?: number;
	courts?: number;
	owner?: string;
	created_at?: string;
	scoring?: string;
	refs?: string;
	description?: string;

	/**
	 * The constructor for the Event class.
	 * @param {number} event_id - The ID of the event.
	 * @param {EventSupabaseDatabaseService} databaseService - The service used to interact with the database.
	 */
	constructor(event_id: number, databaseService: EventSupabaseDatabaseService) {
		super();
		if (!event_id) {
			this.handleError(400, 'Invalid event ID, are you sure your link is correct?');
		}

		this.databaseService = databaseService;
		this.id = event_id;

		if ((this.id as unknown as string) !== 'create') this.load();
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
	async load(): Promise<Event> {
		const eventResponse: EventRow | null = await this.databaseService.load(this.id);

		if (eventResponse !== null) {
			Object.assign(this, eventResponse);
		}

		return this;
	}

	/**
	 * Deletes the event.
	 * @returns {Promise<void>} - Returns a promise that resolves when the event is deleted.
	 */
	async delete(): Promise<void> {
		try {
			await this.databaseService.delete(this.id);
		} catch (err) {
			this.handleError(500, `Failed to delete event: ${(err as Error).message}`);
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
		event = new Event(1, mockDatabaseService);
	});

	it('should throw an error if not all required values are provided', async () => {
		const input: Partial<EventRow> = {
			name: 'Test Tournament'
			// date, pools, and courts are missing
		};

		await expect(event.update(1, input as Infer<FormSchema>)).rejects.toThrow();
	});

	it('should update the event if all required values are provided', async () => {
		const input: Partial<EventRow> = {
			name: 'Test Tournament',
			date: new Date().toString(),
			pools: 1,
			courts: 2,
			owner: 'test',
			created_at: 'test'
		};

		const updatedEvent = new Event(1, mockDatabaseService);
		Object.assign(updatedEvent, input);

		mockDatabaseService.updateEvent.mockResolvedValue(updatedEvent);

		await expect(event.update(1, input as Infer<FormSchema>)).resolves.toEqual(event);

		expect(event).toEqual(updatedEvent);
		expect(mockDatabaseService.updateEvent).toHaveBeenCalledWith(1, input as Infer<FormSchema>);
	});
}
