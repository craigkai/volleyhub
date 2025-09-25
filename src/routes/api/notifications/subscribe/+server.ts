import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_ONESIGNAL_APP_ID } from '$env/static/public';
import { env } from '$env/dynamic/private';
import * as OneSignal from '@onesignal/node-onesignal';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { userId, eventId, selectedTeam, pushSubscription } = await request.json();

		if (!PUBLIC_ONESIGNAL_APP_ID || !env.ONESIGNAL_API_KEY) {
			throw new Error('OneSignal credentials not configured');
		}

		// Initialize OneSignal client
		const configuration = OneSignal.createConfiguration({
			restApiKey: env.ONESIGNAL_API_KEY,
		});
		const client = new OneSignal.DefaultApi(configuration);

		// Prepare user properties
		const userProperties = {
			tags: {
				eventId: eventId?.toString(),
				selectedTeam: selectedTeam?.toString()
			}
		};

		// Create user request
		const userRequest = {
			identity: {
				external_id: userId
			},
			properties: userProperties
		};

		// Add subscription if provided
		if (pushSubscription) {
			// Detect browser type from endpoint
			const isFirefox = pushSubscription.endpoint.includes('mozilla.com');
			const subscriptionType = isFirefox ? 'FirefoxPush' : 'ChromePush';

			userRequest.subscriptions = [
				{
					type: subscriptionType,
					token: pushSubscription.endpoint,
					web_auth: pushSubscription.keys.auth,
					web_p256: pushSubscription.keys.p256dh,
					enabled: true
				}
			];
		}

		// Create/update user in OneSignal
		const result = await client.createUser(PUBLIC_ONESIGNAL_APP_ID, userRequest);

		return json({
			success: true,
			message: 'Subscribed to notifications',
			userId,
			oneSignalUserId: result.identity?.onesignal_id
		});
	} catch (error) {
		console.error('Subscription error:', error);
		return json({ error: 'Failed to subscribe' }, { status: 500 });
	}
};
