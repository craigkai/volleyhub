/**
 * Page visibility tracker for detecting when the page has been frozen
 * (e.g., when phone is locked or app is backgrounded)
 */

import { serverLog } from './serverLogger';
import * as Sentry from '@sentry/sveltekit';

export class PageVisibilityTracker {
	private lastActiveTime: number = Date.now();
	private isCurrentlyVisible: boolean = true;
	private visibilityHandler?: () => void;
	private focusHandler?: () => void;
	private blurHandler?: () => void;
	private clickHandler?: () => void;
	private lastClickTime: number = 0;

	// Callbacks
	onWakeup?: () => void;
	onSleep?: () => void;

	constructor() {
		this.lastActiveTime = Date.now();
		this.isCurrentlyVisible = !document.hidden;
	}

	/**
	 * Start monitoring page visibility
	 */
	start() {
		this.visibilityHandler = () => {
			const wasHidden = !this.isCurrentlyVisible;
			this.isCurrentlyVisible = !document.hidden;

			if (wasHidden && this.isCurrentlyVisible) {
				// Page just became visible
				const timeHidden = Date.now() - this.lastActiveTime;
				serverLog.info('Page became visible after being hidden', {
					timeHiddenMs: timeHidden,
					timeHiddenSeconds: Math.round(timeHidden / 1000)
				});

				// Add Sentry breadcrumb for page wakeup
				Sentry.addBreadcrumb({
					category: 'pwa.lifecycle',
					message: 'Page became visible (woke from sleep)',
					level: 'info',
					data: {
						timeHiddenMs: timeHidden,
						timeHiddenSeconds: Math.round(timeHidden / 1000),
					},
				});

				// Always trigger wakeup when page becomes visible
				// This is critical for PWAs on iOS which freeze when backgrounded
				serverLog.info('PWA woke from sleep, triggering session refresh', {
					timeHiddenSeconds: Math.round(timeHidden / 1000)
				});
				this.onWakeup?.();

				this.lastActiveTime = Date.now();
			} else if (!this.isCurrentlyVisible) {
				// Page just became hidden
				serverLog.debug('Page became hidden');

				// Add Sentry breadcrumb for page sleep
				Sentry.addBreadcrumb({
					category: 'pwa.lifecycle',
					message: 'Page became hidden (going to sleep)',
					level: 'info',
				});

				this.lastActiveTime = Date.now();
				this.onSleep?.();
			}
		};

		this.focusHandler = () => {
			serverLog.debug('Window gained focus');
			this.lastActiveTime = Date.now();
		};

		this.blurHandler = () => {
			serverLog.debug('Window lost focus');
			this.lastActiveTime = Date.now();
		};

		this.clickHandler = () => {
			const now = Date.now();
			// Only log every 5 seconds to avoid spam
			if (now - this.lastClickTime > 5000) {
				const inactiveTime = this.getInactiveTime();
				serverLog.debug('Click detected on page', {
					inactiveTimeSeconds: Math.round(inactiveTime / 1000),
					wasHiddenRecently: inactiveTime > 5000
				});
				this.lastClickTime = now;
			}
			this.lastActiveTime = now;
		};

		document.addEventListener('visibilitychange', this.visibilityHandler);
		window.addEventListener('focus', this.focusHandler);
		window.addEventListener('blur', this.blurHandler);
		document.addEventListener('click', this.clickHandler, true); // Use capture to catch all clicks

		serverLog.info('Page visibility tracker started');
	}

	/**
	 * Stop monitoring
	 */
	stop() {
		if (this.visibilityHandler) {
			document.removeEventListener('visibilitychange', this.visibilityHandler);
		}
		if (this.focusHandler) {
			window.removeEventListener('focus', this.focusHandler);
		}
		if (this.blurHandler) {
			window.removeEventListener('blur', this.blurHandler);
		}
		if (this.clickHandler) {
			document.removeEventListener('click', this.clickHandler, true);
		}

		serverLog.info('Page visibility tracker stopped');
	}

	/**
	 * Get how long the page has been inactive (in ms)
	 */
	getInactiveTime(): number {
		return Date.now() - this.lastActiveTime;
	}

	/**
	 * Check if page is currently visible
	 */
	isVisible(): boolean {
		return this.isCurrentlyVisible;
	}
}
