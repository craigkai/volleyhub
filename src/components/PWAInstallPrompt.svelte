<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	let deferredPrompt: any = null;
	const showInstallPrompt = writable(false);
	const isInstalled = writable(false);
	const isIOS = writable(false);
	const showIOSInstructions = writable(false);

	onMount(() => {
		// Detect iOS
		const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
		isIOS.set(iOS);

		// Check if app is already installed
		if (
			window.matchMedia('(display-mode: standalone)').matches ||
			(window.navigator as any).standalone === true
		) {
			isInstalled.set(true);
			return;
		}

		// For iOS, show instructions instead of automatic prompt
		if (iOS) {
			// Show iOS instructions after a short delay, but only if not dismissed before
			setTimeout(() => {
				if (!sessionStorage.getItem('ios-install-dismissed')) {
					showIOSInstructions.set(true);
				}
			}, 3000); // Wait 3 seconds after page load
		} else {
			// Listen for the beforeinstallprompt event (Chrome/Android)
			window.addEventListener('beforeinstallprompt', (e) => {
				e.preventDefault();
				deferredPrompt = e;
				showInstallPrompt.set(true);
			});
		}

		// Listen for app installed event
		window.addEventListener('appinstalled', () => {
			isInstalled.set(true);
			showInstallPrompt.set(false);
			showIOSInstructions.set(false);
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

	function dismissIOSInstructions() {
		showIOSInstructions.set(false);
		// Store user preference to not show again for this session
		sessionStorage.setItem('ios-install-dismissed', 'true');
	}

	// Check if user previously dismissed the prompt this session
	onMount(() => {
		if (sessionStorage.getItem('pwa-install-dismissed')) {
			showInstallPrompt.set(false);
		}
	});
</script>

<!-- Chrome/Android Install Prompt -->
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

<!-- iOS Install Instructions -->
{#if $showIOSInstructions && !$isInstalled && $isIOS}
	<div
		class="fixed right-4 bottom-4 left-4 z-50 mx-auto max-w-sm rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white shadow-lg"
	>
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<h3 class="flex items-center gap-2 font-semibold">📱 Install VolleyHub</h3>
				<p class="mt-1 text-sm text-blue-100">
					Add to your home screen for the best experience and push notifications!
				</p>
			</div>
			<button
				onclick={dismissIOSInstructions}
				class="ml-2 text-blue-200 hover:text-white"
				aria-label="Dismiss install instructions"
			>
				×
			</button>
		</div>

		<div class="mt-3 space-y-2 text-xs text-blue-100">
			<div class="flex items-center gap-2">
				<span
					class="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold"
					>1</span
				>
				<span>Tap the Share button <span class="font-mono">⬆️</span> below</span>
			</div>
			<div class="flex items-center gap-2">
				<span
					class="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold"
					>2</span
				>
				<span>Scroll down and tap "Add to Home Screen"</span>
			</div>
			<div class="flex items-center gap-2">
				<span
					class="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold"
					>3</span
				>
				<span>Tap "Add" to install VolleyHub</span>
			</div>
		</div>

		<div class="mt-3 flex justify-end">
			<button
				onclick={dismissIOSInstructions}
				class="rounded border border-blue-400 px-3 py-1 text-sm font-medium text-blue-100 hover:bg-blue-500"
			>
				Got it
			</button>
		</div>
	</div>
{/if}
