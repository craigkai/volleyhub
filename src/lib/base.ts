import type { NumericRange } from '@sveltejs/kit';
import type { MatchesSupabaseDatabaseService } from './database/matches.svelte';

export class Base {
	databaseService?: MatchesSupabaseDatabaseService;

	constructor(databaseService?: MatchesSupabaseDatabaseService) {
		if (databaseService) this.databaseService = databaseService;
	}

	handleError(statusCode: NumericRange<400, 599>, message: string) {
		console.error(message);
		throw new Error(message);
	}
}
