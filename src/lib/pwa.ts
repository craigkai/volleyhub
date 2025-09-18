import { Workbox } from 'workbox-window';
import { dev } from '$app/environment';

let wb: Workbox | null = null;

export function registerSW() {
	// Don't register service worker in development mode
	if (dev) {
		console.log('PWA: Skipping service worker registration in development mode');
		return;
	}

	if ('serviceWorker' in navigator) {
		wb = new Workbox('/sw.js');

		wb.addEventListener('installed', (event) => {
			if (event.isUpdate) {
				if (
					confirm('New app version available! Click OK to refresh and get the latest features.')
				) {
					window.location.reload();
				}
			}
		});

		wb.addEventListener('waiting', () => {
			if (confirm('New app version available! Click OK to refresh and get the latest features.')) {
				wb?.messageSkipWaiting();
			}
		});

		wb.addEventListener('controlling', () => {
			window.location.reload();
		});

		wb.register();
	}
}

export function getWB() {
	return wb;
}
