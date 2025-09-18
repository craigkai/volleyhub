import type { SupabaseClient } from '@supabase/supabase-js';

interface NotificationPayload {
	eventId: string;
	teamName: string;
	round: number;
	action: 'round_assigned' | 'ref_assigned';
	isRef?: boolean;
}

export async function sendRoundNotifications(
	supabase: SupabaseClient,
	eventId: string,
	round: number
): Promise<{ success: boolean; message: string }> {
	try {
		// Get all matches for this round with team and referee info
		const { data: matches, error: matchesError } = await supabase
			.from('matches')
			.select(`
				*,
				team1_info:teams!matches_team1_fkey(name),
				team2_info:teams!matches_team2_fkey(name),
				referee_info:teams!matches_referee_id_fkey(name)
			`)
			.eq('event_id', eventId)
			.eq('round', round);

		if (matchesError) {
			throw matchesError;
		}

		if (!matches || matches.length === 0) {
			return { success: false, message: 'No matches found for this round' };
		}

		// Collect unique teams that need notifications
		const teamsToNotify = new Set<string>();
		const refsToNotify = new Set<string>();

		matches.forEach((match) => {
			if (match.team1_info?.name) {
				teamsToNotify.add(match.team1_info.name);
			}
			if (match.team2_info?.name) {
				teamsToNotify.add(match.team2_info.name);
			}
			if (match.referee_info?.name) {
				refsToNotify.add(match.referee_info.name);
			}
		});

		// Send notifications for playing teams
		const teamNotifications = Array.from(teamsToNotify).map((teamName) =>
			supabase.functions.invoke('send-push-notification', {
				body: {
					eventId,
					teamName,
					round,
					action: 'round_assigned',
					isRef: false
				}
			})
		);

		// Send notifications for referees
		const refNotifications = Array.from(refsToNotify).map((refName) =>
			supabase.functions.invoke('send-push-notification', {
				body: {
					eventId,
					teamName: refName,
					round,
					action: 'ref_assigned',
					isRef: true
				}
			})
		);

		// Execute all notifications
		const allNotifications = [...teamNotifications, ...refNotifications];
		const results = await Promise.allSettled(allNotifications);

		const successful = results.filter((result) => result.status === 'fulfilled').length;
		const failed = results.length - successful;

		console.log(
			`Round ${round + 1} notifications: ${successful} successful, ${failed} failed`
		);

		return {
			success: failed === 0,
			message: `Sent notifications to ${teamsToNotify.size} teams and ${refsToNotify.size} referees`
		};
	} catch (error) {
		console.error('Error sending round notifications:', error);
		return {
			success: false,
			message: `Failed to send notifications: ${error.message}`
		};
	}
}

export async function sendMatchStartNotification(
	supabase: SupabaseClient,
	eventId: string,
	matchId: string,
	minutesUntilStart: number = 15
): Promise<{ success: boolean; message: string }> {
	try {
		// Get match details
		const { data: match, error: matchError } = await supabase
			.from('matches')
			.select(`
				*,
				team1_info:teams!matches_team1_fkey(name),
				team2_info:teams!matches_team2_fkey(name)
			`)
			.eq('id', matchId)
			.single();

		if (matchError || !match) {
			throw new Error('Match not found');
		}

		// Send notifications to both teams
		const notifications = [];

		if (match.team1_info?.name) {
			notifications.push(
				supabase.functions.invoke('send-push-notification', {
					body: {
						eventId,
						teamName: match.team1_info.name,
						round: match.round,
						action: 'match_starting',
						minutesUntilStart
					}
				})
			);
		}

		if (match.team2_info?.name) {
			notifications.push(
				supabase.functions.invoke('send-push-notification', {
					body: {
						eventId,
						teamName: match.team2_info.name,
						round: match.round,
						action: 'match_starting',
						minutesUntilStart
					}
				})
			);
		}

		const results = await Promise.allSettled(notifications);
		const successful = results.filter((result) => result.status === 'fulfilled').length;

		return {
			success: successful > 0,
			message: `Match start notifications sent to ${successful} teams`
		};
	} catch (error) {
		console.error('Error sending match start notification:', error);
		return {
			success: false,
			message: `Failed to send match notifications: ${error.message}`
		};
	}
}