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
		// Using OneSignal v2 API format
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

		// Add push subscription if provided
		if (pushSubscription) {
			// Detect device/browser type from endpoint and user agent
			const userAgent = request.headers.get('user-agent') || '';
			const isIOS = /iPad|iPhone|iPod/.test(userAgent);
			const isFirefox = pushSubscription.endpoint.includes('mozilla.com');

			let subscriptionType;
			if (isIOS) {
				subscriptionType = 'iOS';
			} else if (isFirefox) {
				subscriptionType = 'FirefoxPush';
			} else {
				subscriptionType = 'ChromePush';
			}

			oneSignalPayload.subscriptions = [
				{
					type: subscriptionType,
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
