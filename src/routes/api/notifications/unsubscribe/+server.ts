import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { eventId, selectedTeam } = await request.json();

		// Future: remove user from OneSignal or update tags

		return json({
			success: true,
			message: 'Unsubscribed from notifications'
		});
	} catch (error) {
		console.error('Unsubscription error:', error);
		return json(
			{ error: 'Failed to unsubscribe' },
			{ status: 500 }
		);
	}
};