import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_ONESIGNAL_APP_ID } from '$env/static/public';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { userId, eventId, selectedTeam, pushSubscription } = await request.json();

		if (!PUBLIC_ONESIGNAL_APP_ID || !env.ONESIGNAL_API_KEY) {
			throw new Error('OneSignal credentials not configured');
		}

		// Create or update user in OneSignal with tags and push subscription
		const oneSignalPayload = {
			identity: {
				external_id: userId
			},
			properties: {
				tags: {
					eventId: eventId?.toString(),
					selectedTeam: selectedTeam?.toString()
				}
			}
		};

		console.log('=== SUBSCRIPTION DEBUG ===');
		console.log('Input parameters:', { userId, eventId, selectedTeam });
		console.log('Creating OneSignal user with payload:', JSON.stringify(oneSignalPayload, null, 2));
		console.log('=========================');

		// Add push subscription if provided
		if (pushSubscription) {
			oneSignalPayload.subscriptions = [
				{
					type: 'ChromePush',
					token: pushSubscription.endpoint,
					web_auth: pushSubscription.keys.auth,
					web_p256: pushSubscription.keys.p256dh,
					enabled: true
				}
			];
		}

		const oneSignalResponse = await fetch(
			`https://onesignal.com/api/v1/apps/${PUBLIC_ONESIGNAL_APP_ID}/users`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Basic ${env.ONESIGNAL_API_KEY}`
				},
				body: JSON.stringify(oneSignalPayload)
			}
		);

		if (!oneSignalResponse.ok) {
			const error = await oneSignalResponse.text();
			console.error('OneSignal user creation failed:', error);
			throw new Error(`OneSignal registration failed: ${error}`);
		}

		const oneSignalResult = await oneSignalResponse.json();
		console.log('OneSignal user created/updated:', oneSignalResult);

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
