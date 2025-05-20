// src/routes/auth/error/+page.ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
	return {
		errorCode: url.searchParams.get('error_code') ?? 'unknown_error',
		errorDescription:
			url.searchParams.get('error_description') ??
			'An unknown error occurred during authentication.'
	};
};
