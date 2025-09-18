import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_ONESIGNAL_APP_ID } from '$env/static/public';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { userId, eventId, selectedTeam } = await request.json();

		if (!PUBLIC_ONESIGNAL_APP_ID || !env.ONESIGNAL_API_KEY) {
			throw new Error('OneSignal credentials not configured');
		}

		// Create or update user in OneSignal with tags
		const oneSignalResponse = await fetch(
			`https://onesignal.com/api/v1/apps/${PUBLIC_ONESIGNAL_APP_ID}/users`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Basic ${env.ONESIGNAL_API_KEY}`
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
			}
		);

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
		return json({ error: 'Failed to subscribe' }, { status: 500 });
	}
};
