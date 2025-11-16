import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface LogEntry {
	level: 'debug' | 'info' | 'warn' | 'error';
	message: string;
	metadata?: Record<string, unknown>;
	timestamp?: string;
	userAgent?: string;
	url?: string;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const logEntry: LogEntry = await request.json();

		const {
			level = 'info',
			message,
			metadata,
			timestamp = new Date().toISOString(),
			userAgent = request.headers.get('user-agent') || 'unknown',
			url = request.headers.get('referer') || 'unknown'
		} = logEntry;

		// Format the log message for better readability in Vercel logs
		const formattedMessage = `[CLIENT ${level.toUpperCase()}] ${message}`;
		const logData = {
			timestamp,
			userAgent,
			url,
			...metadata
		};

		// Log to appropriate level
		switch (level) {
			case 'error':
				console.error(formattedMessage, logData);
				break;
			case 'warn':
				console.warn(formattedMessage, logData);
				break;
			case 'debug':
				console.debug(formattedMessage, logData);
				break;
			default:
				console.log(formattedMessage, logData);
		}

		return json({ success: true });
	} catch (error) {
		console.error('[SERVER] Failed to process client log:', error);
		return json({ success: false, error: 'Failed to log message' }, { status: 500 });
	}
};
