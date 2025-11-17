import { handleErrorWithSentry, replayIntegration, browserTracingIntegration } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: 'https://14ba82edd8d6d0f2295af7682d01abac@o4510380716589056.ingest.us.sentry.io/4510380718161920',

	// Lower sample rates to stay in free tier (increase for iOS debugging, decrease later)
	tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1, // 100% in dev, 10% in prod

	// Enable logs to be sent to Sentry
	enableLogs: true,

	// Sample 10% of normal sessions, but 100% of sessions with errors
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,

	environment: import.meta.env.MODE,

	integrations: [
		browserTracingIntegration(),
		replayIntegration({
			// Mask sensitive data but capture console logs for debugging
			maskAllText: true,
			blockAllMedia: false,
			networkDetailAllowUrls: [window.location.origin],
		})
	],

	// Enhanced for iOS PWA debugging
	beforeSend(event, hint) {
		// Detect if running as PWA
		const isPWA = window.matchMedia('(display-mode: standalone)').matches;
		const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

		// Add PWA-specific context
		event.contexts = event.contexts || {};
		event.contexts.pwa = {
			standalone: isPWA,
			displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
			userAgent: navigator.userAgent,
			online: navigator.onLine,
			pageVisible: !document.hidden,
		};

		// Tag iOS PWA issues for easy filtering in Sentry dashboard
		event.tags = event.tags || {};
		if (isIOS) {
			event.tags.ios = true;
			event.tags.device_type = isPWA ? 'ios_pwa' : 'ios_web';
		}

		// Add page visibility state
		event.tags.page_visible = !document.hidden;

		return event;
	},

	// Ignore known noisy errors that don't affect functionality
	ignoreErrors: [
		// Browser extensions
		'top.GLOBALS',
		'canvas.contentDocument',
		'atomicFindClose',
		// Network errors we handle gracefully
		'NetworkError',
		'Failed to fetch',
	],

	// Don't send PII by default (names, emails, etc)
	sendDefaultPii: false
});

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
