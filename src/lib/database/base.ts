import type { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { error, type NumericRange } from '@sveltejs/kit';
import type { z } from 'zod';

export class Base {
	// Private property for Supabase client
	supabaseClient: supabaseClient;

	// Constructor to initialize Supabase client
	constructor(supabaseClient: supabaseClient) {
		this.supabaseClient = supabaseClient;
	}

	validateAndHandleErrors<T>(
		response: PostgrestResponse<T> | PostgrestSingleResponse<T>,
		schema: z.ZodType<T, any, any>
	): T {
		this.handleDatabaseError(response as PostgrestResponse<T[]> | PostgrestResponse<T[][]>);

		const result = schema.safeParse(response.data);
		if (!result.success) {
			const errorResponse = { status: 500, error: result.error } as unknown as PostgrestResponse<T>;
			this.handleDatabaseError(errorResponse as PostgrestResponse<T[]> | PostgrestResponse<T[][]>);
		}

		return response.data as T;
	}

	// Method to handle database errors
	handleDatabaseError<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T>): void {
		// If there's an error in the response
		if (response.error) {
			// Log the status and error message
			console.error(`Failed operation with status ${response.status}: ${response.error.message}`);
			// Log the error details
			console.error(response.error);
			error(response.status as NumericRange<400, 599>, response.error);
		}
	}
}
