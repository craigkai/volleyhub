import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ONESIGNAL_APP_ID, ONESIGNAL_API_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { userId, eventId, selectedTeam, tags } = await request.json();

		if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
			throw new Error('OneSignal credentials not configured');
		}

		// Create or update user in OneSignal with tags
		const oneSignalResponse = await fetch(`https://onesignal.com/api/v1/apps/${ONESIGNAL_APP_ID}/users`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Basic ${ONESIGNAL_API_KEY}`
			},
			body: JSON.stringify({
				identity: {
					external_id: userId
				},
				properties: {
					tags: {
						eventId: eventId?.toString(),
						selectedTeam: selectedTeam
					}
				}
			})
		});

		if (!oneSignalResponse.ok) {
			const error = await oneSignalResponse.text();
			console.error('OneSignal user creation failed:', error);
			// Don't throw - we can still track locally
		}

		return json({
			success: true,
			message: 'Subscribed to notifications',
			userId
		});
	} catch (error) {
		console.error('Subscription error:', error);
		return json(
			{ error: 'Failed to subscribe' },
			{ status: 500 }
		);
	}
};