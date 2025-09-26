import type { SupabaseClient } from '@supabase/supabase-js';

export async function sendRoundNotifications(
	supabase: SupabaseClient,
	eventId: string,
	round: number
): Promise<{ success: boolean; message: string }> {
	try {
		// Get tournament name
		const { data: tournamentData, error: tournamentError } = await supabase
			.from('events')
			.select('name')
			.eq('id', eventId)
			.single();

		if (tournamentError) {
			console.warn('Could not fetch tournament name:', tournamentError);
		}

		const tournamentName = tournamentData?.name;

		// Get all matches for this round
		const { data: matches, error: matchesError } = await supabase
			.from('matches')
			.select('*')
			.eq('event_id', eventId)
			.eq('round', round);

		if (matchesError) {
			throw matchesError;
		}

		if (!matches || matches.length === 0) {
			return { success: false, message: 'No matches found for this round' };
		}

		// Get team info separately
		const teamIds = new Set<number>();
		matches.forEach((match) => {
			if (match.team1) teamIds.add(match.team1);
			if (match.team2) teamIds.add(match.team2);
			if (match.ref) teamIds.add(match.ref);
		});

		const { data: teams, error: teamsError } = await supabase
			.from('teams')
			.select('id, name')
			.in('id', Array.from(teamIds));

		if (teamsError) {
			throw teamsError;
		}

		// Create a map for quick team lookup
		const teamMap = new Map();
		teams?.forEach((team) => {
			teamMap.set(team.id, team.name);
		});

		// Collect unique teams that need notifications
		const teamsToNotify = new Set<number>();
		const refsToNotify = new Set<number>();

		matches.forEach((match) => {
			if (match.team1) {
				teamsToNotify.add(match.team1);
			}
			if (match.team2) {
				teamsToNotify.add(match.team2);
			}
			if (match.ref) {
				refsToNotify.add(match.ref);
			}
		});

		// Send notifications for playing teams
		const teamNotifications = Array.from(teamsToNotify).map((teamId) => {
			// Find the match for this team to get court info
			const match = matches.find(m => m.team1 === teamId || m.team2 === teamId);

			return supabase.functions.invoke('send-push-notification', {
				body: {
					eventId,
					teamId,
					teamName: teamMap.get(teamId),
					tournamentName,
					round,
					court: match?.court,
					action: 'round_assigned',
					isRef: false
				}
			});
		});

		// Send notifications for referees
		const refNotifications = Array.from(refsToNotify).map((refId) => {
			// Find the match this team is refereeing to get court info
			const match = matches.find(m => m.ref === refId);

			return supabase.functions.invoke('send-push-notification', {
				body: {
					eventId,
					teamId: refId,
					teamName: teamMap.get(refId),
					tournamentName,
					round,
					court: match?.court,
					action: 'ref_assigned',
					isRef: true
				}
			});
		});

		// Execute all notifications
		const allNotifications = [...teamNotifications, ...refNotifications];
		const results = await Promise.allSettled(allNotifications);

		const successful = results.filter((result) => result.status === 'fulfilled').length;
		const failed = results.length - successful;

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
		// Get tournament name
		const { data: tournamentData, error: tournamentError } = await supabase
			.from('events')
			.select('name')
			.eq('id', eventId)
			.single();

		if (tournamentError) {
			console.warn('Could not fetch tournament name:', tournamentError);
		}

		const tournamentName = tournamentData?.name;

		// Get match details
		const { data: match, error: matchError } = await supabase
			.from('matches')
			.select(
				`
				*,
				team1_info:teams!matches_team1_fkey(name),
				team2_info:teams!matches_team2_fkey(name)
			`
			)
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
						teamId: match.team1,
						teamName: match.team1_info.name,
						tournamentName,
						round: match.round,
						court: match.court,
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
						teamId: match.team2,
						teamName: match.team2_info.name,
						tournamentName,
						round: match.round,
						court: match.court,
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
