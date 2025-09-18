<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	let deferredPrompt: any = null;
	const showInstallPrompt = writable(false);
	const isInstalled = writable(false);

	onMount(() => {
		// Check if app is already installed
		if (window.matchMedia('(display-mode: standalone)').matches) {
			isInstalled.set(true);
			return;
		}

		// Listen for the beforeinstallprompt event
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			deferredPrompt = e;
			showInstallPrompt.set(true);
		});

		// Listen for app installed event
		window.addEventListener('appinstalled', () => {
			isInstalled.set(true);
			showInstallPrompt.set(false);
			deferredPrompt = null;
		});
	});

	async function installApp() {
		if (!deferredPrompt) return;

		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === 'accepted') {
			showInstallPrompt.set(false);
		}

		deferredPrompt = null;
	}

	function dismissPrompt() {
		showInstallPrompt.set(false);
		// Store user preference to not show again for this session
		sessionStorage.setItem('pwa-install-dismissed', 'true');
	}

	// Check if user previously dismissed the prompt this session
	onMount(() => {
		if (sessionStorage.getItem('pwa-install-dismissed')) {
			showInstallPrompt.set(false);
		}
	});
</script>

{#if $showInstallPrompt && !$isInstalled}
	<div
		class="fixed right-4 bottom-4 left-4 z-50 mx-auto max-w-sm rounded-lg bg-blue-600 p-4 text-white shadow-lg"
	>
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<h3 class="font-semibold">Install VolleyHub</h3>
				<p class="mt-1 text-sm text-blue-100">
					Install our app for faster access and offline support!
				</p>
			</div>
			<button
				onclick={dismissPrompt}
				class="ml-2 text-blue-200 hover:text-white"
				aria-label="Dismiss install prompt"
			>
				×
			</button>
		</div>
		<div class="mt-3 flex space-x-2">
			<button
				onclick={installApp}
				class="rounded bg-white px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50"
			>
				Install
			</button>
			<button
				onclick={dismissPrompt}
				class="rounded border border-blue-400 px-3 py-1 text-sm font-medium text-blue-100 hover:bg-blue-500"
			>
				Not now
			</button>
		</div>
	</div>
{/if}
