import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { eventId, selectedTeam, tags } = await request.json();

		// Future: register user with OneSignal REST API here

		return json({
			success: true,
			message: 'Subscribed to notifications'
		});
	} catch (error) {
		console.error('Subscription error:', error);
		return json(
			{ error: 'Failed to subscribe' },
			{ status: 500 }
		);
	}
};