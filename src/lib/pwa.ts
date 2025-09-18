import { Workbox } from 'workbox-window';

let wb: Workbox | null = null;

export function registerSW() {
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
