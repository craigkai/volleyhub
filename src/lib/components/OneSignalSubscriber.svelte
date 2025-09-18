<script lang="ts">
	import { onMount } from 'svelte';
	import { Bell, BellOff } from 'lucide-svelte';
	import toast from 'svelte-5-french-toast';
	import { dev } from '$app/environment';
	import { PUBLIC_ONESIGNAL_APP_ID } from '$env/static/public';

	let {
		selectedTeam = '',
		eventId
	} = $props<{
		selectedTeam?: string;
		eventId?: string;
	}>();

	let isSubscribed = $state(false);
	let isSupported = $state(false);
	let isInitialized = $state(false);
	let isStandalone = $state(false);

	// OneSignal configuration
	const ONESIGNAL_APP_ID = PUBLIC_ONESIGNAL_APP_ID;

	onMount(async () => {
		console.log('OneSignalSubscriber mounted:', {
			selectedTeam,
			eventId,
			dev
		});

		// Check if running in standalone mode (added to home screen)
		isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
						(window.navigator as any).standalone === true;

		// Skip in development
		if (dev) {
			console.log('OneSignal disabled in development mode');
			return;
		}

		// Initialize OneSignal
		try {
			await initializeOneSignal();
		} catch (error) {
			console.error('Failed to initialize OneSignal:', error);
		}
	});

	async function initializeOneSignal() {
		// Load OneSignal SDK script
		if (!window.OneSignal) {
			const script = document.createElement('script');
			script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
			script.defer = true;
			document.head.appendChild(script);

			// Wait for script to load
			await new Promise((resolve) => {
				script.onload = resolve;
			});
		}

		await window.OneSignal.init({
			appId: ONESIGNAL_APP_ID,
			safari_web_id: 'web.onesignal.auto.18be6cbb-f3eb-4a7c-9319-a9c9b9f0c2dc', // Optional
			notifyButton: {
				enable: false // We'll use our own button
			},
			allowLocalhostAsSecureOrigin: true
		});

		isSupported = await window.OneSignal.Notifications.isPushSupported();
		isInitialized = true;

		if (isSupported) {
			// Check current subscription status
			const permission = await window.OneSignal.Notifications.getPermissionState();
			isSubscribed = permission === 'granted';

			console.log('OneSignal initialized:', {
				isSupported,
				permission,
				isSubscribed
			});
		}
	}

	async function subscribeToNotifications() {
		if (!isInitialized) {
			toast.error('OneSignal not initialized yet');
			return;
		}

		try {
			const OneSignal = window.OneSignal;

			// Request permission and subscribe
			await OneSignal.Notifications.requestPermission();

			// Set tags for targeting
			if (eventId && selectedTeam) {
				await OneSignal.User.addTags({
					eventId: eventId.toString(),
					selectedTeam: selectedTeam
				});
			}

			isSubscribed = true;
			toast.success(`Notifications enabled${selectedTeam ? ` for ${selectedTeam}` : ''}!`);
		} catch (error) {
			console.error('Error subscribing to OneSignal:', error);
			toast.error('Failed to enable notifications');
		}
	}

	async function unsubscribeFromNotifications() {
		if (!isInitialized) {
			toast.error('OneSignal not initialized yet');
			return;
		}

		try {
			const OneSignal = window.OneSignal;

			// Remove tags
			if (eventId && selectedTeam) {
				await OneSignal.User.removeTags(['eventId', 'selectedTeam']);
			}

			// Optionally unsubscribe completely
			await OneSignal.Notifications.setPermission(false);

			isSubscribed = false;
			toast.success('Notifications disabled');
		} catch (error) {
			console.error('Error unsubscribing from OneSignal:', error);
			toast.error('Failed to disable notifications');
		}
	}

	// Update tags when selectedTeam changes
	$effect(async () => {
		if (isInitialized && isSubscribed && selectedTeam && eventId) {
			try {
				const OneSignal = window.OneSignal;
				await OneSignal.User.addTags({
					eventId: eventId.toString(),
					selectedTeam: selectedTeam
				});
				console.log('Updated OneSignal tags:', { eventId, selectedTeam });
			} catch (error) {
				console.error('Error updating OneSignal tags:', error);
			}
		}
	});
</script>

{#if selectedTeam}
	<div class="flex items-center">
		{#if dev}
			<div
				class="inline-flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm font-medium text-yellow-700 dark:border-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
				title="Push notifications are disabled in development mode"
			>
				<BellOff size={16} />
				Notifications (Dev Mode)
			</div>
		{:else if !isSupported}
			<div
				class="inline-flex items-center gap-2 rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
				title={navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome') && !isStandalone
					? 'Safari: Add to Home Screen first, then enable notifications'
					: 'Push notifications not supported in this browser'}
			>
				<BellOff size={16} />
				{#if navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome') && !isStandalone}
					Add to Home Screen for Notifications
				{:else}
					Notifications Not Supported
				{/if}
			</div>
		{:else if !isInitialized}
			<div
				class="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-500"
			>
				<BellOff size={16} />
				Initializing...
			</div>
		{:else if isSubscribed}
			<button
				onclick={unsubscribeFromNotifications}
				class="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
				title="Disable notifications for {selectedTeam || 'this tournament'}"
			>
				<Bell size={16} />
				Notifications On
			</button>
		{:else}
			<button
				onclick={subscribeToNotifications}
				class="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
				title="Get notified when {selectedTeam || 'your team'} plays or refs"
			>
				<BellOff size={16} />
				Enable Notifications
			</button>
		{/if}
	</div>
{/if}