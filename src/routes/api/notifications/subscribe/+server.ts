import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_ONESIGNAL_APP_ID } from '$env/static/public';
import { env } from '$env/dynamic/private';
import * as OneSignal from '@onesignal/node-onesignal';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { userId, eventId, selectedTeam } = await request.json();

		if (!PUBLIC_ONESIGNAL_APP_ID || !env.ONESIGNAL_API_KEY) {
			throw new Error('OneSignal credentials not configured');
		}

		// Initialize OneSignal client
		const configuration = OneSignal.createConfiguration({
			restApiKey: env.ONESIGNAL_API_KEY
		});
		const client = new OneSignal.DefaultApi(configuration);

		// Update user tags for targeting
		// With Web SDK, the subscription is handled client-side
		// We just need to update user tags on the server for targeting
		const userRequest = {
			properties: {
				tags: {
					eventId: eventId?.toString(),
					selectedTeam: selectedTeam?.toString(),
					subscription_type: 'team_notifications'
				}
			}
		};

		try {
			// Try to update existing user by external_id
			await client.updateUser(PUBLIC_ONESIGNAL_APP_ID, userId, userRequest);
		} catch (updateError) {
			// If user doesn't exist, this is OK - Web SDK will handle user creation
			console.log('User not found in OneSignal, will be created by Web SDK:', userId);
		}

		return json({
			success: true,
			message: 'User tags updated for notifications',
			userId
		});
	} catch (error) {
		console.error('Subscription error:', error);
		return json({ error: 'Failed to update user tags' }, { status: 500 });
	}
};
