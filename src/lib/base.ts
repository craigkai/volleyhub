import type { NumericRange } from '@sveltejs/kit';

export class Base {
	handleError(statusCode: NumericRange<400, 599>, message: string) {
		throw new Error(message);
	}
}
