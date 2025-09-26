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
			restApiKey: env.ONESIGNAL_API_KEY,
		});
		const client = new OneSignal.DefaultApi(configuration);

		// Remove specific tags for this team/event
		// With Web SDK, we can remove tags to stop targeted notifications
		try {
			await client.updateUser(PUBLIC_ONESIGNAL_APP_ID, userId, {
				properties: {
					tags: {
						eventId: '',
						selectedTeam: '',
						subscription_type: ''
					}
				}
			});
		} catch (updateError) {
			console.log('User not found in OneSignal or already unsubscribed:', userId);
		}

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