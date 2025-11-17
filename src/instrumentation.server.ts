import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: 'https://14ba82edd8d6d0f2295af7682d01abac@o4510380716589056.ingest.us.sentry.io/4510380718161920',

	tracesSampleRate: 1.0,

	// Enable logs to be sent to Sentry
	enableLogs: true

	// uncomment the line below to enable Spotlight (https://spotlightjs.com)
	// spotlight: import.meta.env.DEV,
});
