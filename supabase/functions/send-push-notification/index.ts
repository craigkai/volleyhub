import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
	// Handle CORS preflight requests
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const { eventId, teamId, teamName, round, action, isRef = false, tournamentName, court } = await req.json();

		console.log('Sending push notifications for:', { eventId, teamId, teamName, round, action, isRef, tournamentName, court });

		if (!eventId || !teamId) {
			throw new Error('Missing required parameters: eventId and teamId');
		}

		// Use OneSignal instead of managing subscriptions directly
		const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID');
		const oneSignalApiKey = Deno.env.get('ONESIGNAL_API_KEY');

		if (!oneSignalAppId || !oneSignalApiKey) {
			throw new Error('OneSignal credentials not configured');
		}

		// Send OneSignal notification
		const notification = {
			app_id: oneSignalAppId,
			headings: {
				en: tournamentName ? `🏐 ${tournamentName}` : '🏐 VolleyHub Tournament Update'
			},
			contents: {
				en: isRef
					? `You're refereeing round ${round + 1}${court !== undefined ? ` on court ${court}` : ''}! Check your schedule.`
					: `${teamName} plays in round ${round + 1}${court !== undefined ? ` on court ${court}` : ''}! Get ready!`
			},
			data: {
				eventId,
				teamName,
				tournamentName,
				round,
				court,
				action,
				isRef,
				url: `/events/${eventId}?team=${encodeURIComponent(teamName)}`
			},
			// Target users based on tags - only users with matching eventId and selectedTeam
			filters: [
				{ field: 'tag', key: 'eventId', relation: '=', value: eventId.toString() },
				{ operator: 'AND' },
				{ field: 'tag', key: 'selectedTeam', relation: '=', value: teamId.toString() }
			],
			web_url: `${Deno.env.get('SITE_URL') || 'https://volleyhub.app'}/events/${eventId}?team=${encodeURIComponent(teamName)}`,
			chrome_web_icon: '/pwa-192x192.png',
			chrome_web_badge: '/pwa-64x64.png'
		};


		const response = await fetch('https://onesignal.com/api/v1/notifications', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${oneSignalApiKey}`
			},
			body: JSON.stringify(notification)
		});

		const result = await response.json();

		if (!response.ok) {
			console.error('OneSignal error:', result);
			throw new Error(`OneSignal API error: ${result.errors?.[0] || 'Unknown error'}`);
		}

		console.log('OneSignal response:', result);

		return new Response(
			JSON.stringify({
				message: 'Push notification sent via OneSignal',
				oneSignalId: result.id,
				recipients: result.recipients || 0,
				result
			}),
			{ headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	} catch (error) {
		console.error('Error in send-push-notification function:', error);
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
});
