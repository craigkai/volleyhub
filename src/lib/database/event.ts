import type { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { z } from 'zod';
import { eventsRowSchema, eventsUpdateSchema } from '$schemas/supabase';
import type { Infer } from 'sveltekit-superforms';
import type { FormSchema } from '$schemas/settingsSchema';
import { SupabaseDatabaseService } from './supabaseDatabaseService';

const EventsRowSchemaArray = z.array(eventsRowSchema);

export class EventSupabaseDatabaseService extends SupabaseDatabaseService {
	/**
	 * Create a new event in the database.
	 * @param {EventRow} input - The data for the new event.
	 * @returns {Promise<EventRow>} - Returns a promise that resolves to the newly created event.
	 * @throws {Error} - Throws an error if there's an issue creating the event.
	 */
	async create(input: Infer<FormSchema>): Promise<EventRow | null> {
		try {
			const parsedEvent = eventsRowSchema.partial().parse(input);

			// Insert the new event into the 'events' table
			const res: PostgrestSingleResponse<EventRow | null> = await this.supabaseClient
				.from('events')
				.insert(parsedEvent)
				.select()
				.maybeSingle();

			this.validateAndHandleErrors(res, eventsRowSchema);

			// Return the newly created event
			return res.data;
		} catch (error) {
			// If an error occurs while creating the event, log it and rethrow it
			console.error('An error occurred while creating the event:', error);
			throw error;
		}
	}

	/**
	 * Load an event from the database.
	 * @param {string} event_id - The ID of the event to load.
	 * @returns {Promise<EventRow>} - Returns a promise that resolves to the loaded event.
	 * @throws {Error} - Throws an error if there's an issue loading the event.
	 */
	async load(event_id: number): Promise<EventRow | null> {
		try {
			const res: PostgrestSingleResponse<EventRow | null> = await this.supabaseClient
				.from('events')
				.select('*')
				.eq('id', event_id)
				.maybeSingle();

			this.validateAndHandleErrors(res, eventsRowSchema);

			return res.data;
		} catch (error) {
			console.error('An error occurred while loading the event:', error);
			throw error;
		}
	}

	/**
	 * Update the details of a tournament in the database.
	 * @param {EventRow} input - The new data for the tournament.
	 * @returns {Promise<EventRow>} - Returns a promise that resolves to the updated tournament.
	 * @throws {Error} - Throws an error if there's an issue updating the tournament.
	 */
	async put(id: number, input: Infer<FormSchema>): Promise<EventRow | null> {
		try {
			const parsedEvent = eventsUpdateSchema.parse(input);

			const res: PostgrestSingleResponse<EventRow | null> = await this.supabaseClient
				.from('events')
				.update(parsedEvent)
				.eq('id', id)
				.select()
				.maybeSingle();

			this.validateAndHandleErrors(res, eventsRowSchema);

			return res.data as unknown as EventRow;
		} catch (error) {
			console.error('An error occurred while updating the tournament:', error);
			throw error;
		}
	}

	/**
	 * Delete an event from the database.
	 * @param {string} event_id - The ID of the event to delete.
	 * @returns {Promise<void>} - Returns a promise that resolves when the event has been deleted.
	 * @throws {Error} - Throws an error if there's an issue deleting the event.
	 */
	async delete(event_id: number): Promise<void> {
		try {
			const res: PostgrestSingleResponse<EventRow | null> = await this.supabaseClient
				.from('events')
				.delete()
				.eq('id', event_id);

			this.handleDatabaseError(res);
		} catch (error) {
			console.error('An error occurred while deleting the event:', error);
			throw error;
		}
	}

	/**
	 * Load all events owned by a specific user from the database.
	 * @param {string} ownerId - The ID of the owner whose events to load.
	 * @returns {Promise<EventRow[]>} - Returns a promise that resolves to an array of the loaded events.
	 * @throws {Error} - Throws an error if there's an issue loading the events.
	 */
	async loadEvents(ownerId: string): Promise<EventRow[]> {
		const res = await this.supabaseClient.from('events').select('*').eq('owner', ownerId);

		this.validateAndHandleErrors(res, EventsRowSchemaArray);

		return res.data ?? [];
	}

	async getUpcomingEvents(): Promise<EventRow[] | null> {
		const today = new Date();
		today.setHours(0, 0, 0, 0); // Set time to 00:00:00.000
		today.setDate(today.getDate() - 1);

		const res = await this.supabaseClient
			.from('events')
			.select('*')
			.gte('date', today.toISOString());

		this.validateAndHandleErrors(res, EventsRowSchemaArray);

		return res.data;
	}

	async setCurrentRound(eventId: number, round: number): Promise<EventRow | null> {
		const { data, error } = await this.supabaseClient
			.from('events')
			.update({ current_round: round })
			.eq('id', eventId)
			.select()
			.maybeSingle();

		if (error) {
			throw new Error(`Failed to set current round: ${error.message}`);
		}

		return data;
	}
}
