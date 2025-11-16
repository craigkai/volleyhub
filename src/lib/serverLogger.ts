/**
 * Server-side logger for debugging on mobile devices
 * Sends logs to /api/log endpoint which will appear in Vercel logs
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
	metadata?: Record<string, unknown>;
	skipConsole?: boolean; // Skip logging to browser console
}

async function sendLog(level: LogLevel, message: string, options: LogOptions = {}) {
	const { metadata, skipConsole = false } = options;

	// Always log to browser console unless explicitly skipped
	if (!skipConsole) {
		const consoleMethod = level === 'debug' ? console.debug : console[level];
		if (metadata) {
			consoleMethod(`[${level.toUpperCase()}]`, message, metadata);
		} else {
			consoleMethod(`[${level.toUpperCase()}]`, message);
		}
	}

	// Send to server (fire and forget)
	try {
		fetch('/api/log', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				level,
				message,
				metadata,
				timestamp: new Date().toISOString(),
				url: typeof window !== 'undefined' ? window.location.href : undefined
			})
		}).catch((err) => {
			// Silently fail - don't want logging errors to break the app
			console.warn('Failed to send log to server:', err);
		});
	} catch (err) {
		// Silently fail
		console.warn('Failed to send log to server:', err);
	}
}

export const serverLog = {
	debug: (message: string, metadata?: Record<string, unknown>) =>
		sendLog('debug', message, { metadata }),

	info: (message: string, metadata?: Record<string, unknown>) =>
		sendLog('info', message, { metadata }),

	warn: (message: string, metadata?: Record<string, unknown>) =>
		sendLog('warn', message, { metadata }),

	error: (message: string, metadata?: Record<string, unknown>) =>
		sendLog('error', message, { metadata })
};
