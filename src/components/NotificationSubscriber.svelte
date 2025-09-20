<script lang="ts">
	import { onMount } from 'svelte';
	import { Bell, BellOff } from 'lucide-svelte';
	import toast from 'svelte-5-french-toast';

	let {
		selectedTeam = '',
		eventId,
		supabase
	} = $props<{
		selectedTeam?: string;
		eventId?: string;
		supabase: any;
	}>();

	let isSupported = $state(false);
	let isInitialized = $state(false);
	let isSubscribed = $state(false);
	let isSubscribing = $state(false);

	// Local storage key for subscription preference
	const getStorageKey = () => `notify_${eventId}_${selectedTeam}`;

	// Get or create a unique user ID for this browser
	const getUserId = () => {
		const key = 'volleyhub_user_id';
		let userId = localStorage.getItem(key);
		if (!userId) {
			// Create a unique ID for this browser
			userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			localStorage.setItem(key, userId);
		}
		return userId;
	};

	// Convert VAPID key for push subscription
	function urlBase64ToUint8Array(base64String: string) {
		const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
		const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
		const rawData = atob(base64);
		const outputArray = new Uint8Array(rawData.length);
		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	}

	onMount(async () => {
		// Check browser support
		const hasServiceWorker = 'serviceWorker' in navigator;
		const hasPushManager = 'PushManager' in window;
		const hasNotification = 'Notification' in window;

		isSupported = hasServiceWorker && hasPushManager && hasNotification;
		isInitialized = true;

		// Check existing subscription
		checkSubscriptionStatus();
	});

	// Check subscription when team changes
	$effect(() => {
		if (selectedTeam && isInitialized) {
			checkSubscriptionStatus();
		}
	});

	function checkSubscriptionStatus() {
		if (!selectedTeam || !isInitialized) {
			isSubscribed = false;
			return;
		}

		const stored = localStorage.getItem(getStorageKey());
		const hasPermission = 'Notification' in window && Notification.permission === 'granted';
		isSubscribed = stored === 'true' && hasPermission;
	}


	async function subscribeToNotifications() {
		if (isSubscribing) return;
		isSubscribing = true;

		try {
			// Request notification permission
			const permission = await Notification.requestPermission();
			if (permission !== 'granted') {
				toast.error('Notification permission denied');
				return;
			}

			// Get or register service worker
			let registration = await navigator.serviceWorker.getRegistration();
			if (!registration) {
				registration = await navigator.serviceWorker.register('/sw.js');
			}
			await navigator.serviceWorker.ready;

			// Create push subscription
			const vapidPublicKey = 'BEETJnh6HFQcfifDAkd_j87tFK380FDeXHHCAJgpQws7lEzUl_ZZWjYipszSOQ5MU2u0aGpk3975FK9hyFwlrqg';
			const pushSubscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
			});

			// Register with API
			await registerWithNotificationService(pushSubscription);

			// Mark as subscribed
			localStorage.setItem(getStorageKey(), 'true');
			isSubscribed = true;
			toast.success(`Notifications enabled for ${selectedTeam}!`);

		} catch (error) {
			console.error('Subscription error:', error);
			toast.error(`Failed to enable notifications: ${error.message}`);
			localStorage.removeItem(getStorageKey());
			isSubscribed = false;
		} finally {
			isSubscribing = false;
		}
	}

	async function unsubscribeFromNotifications() {
		try {
			localStorage.removeItem(getStorageKey());
			isSubscribed = false;
			await unregisterFromNotificationService();
			toast.success('Notifications disabled');
		} catch (error) {
			console.error('Error unsubscribing:', error);
			toast.error('Failed to disable notifications');
		}
	}

	async function registerWithNotificationService(pushSubscription: PushSubscription) {
		// Get or create a unique user ID for this browser/team combination
		const userId = getUserId();

		console.log('Registering with notification service...', {
			userId,
			eventId,
			selectedTeam,
			endpoint: pushSubscription.endpoint.substring(0, 50) + '...'
		});

		// Call our backend to register this user with OneSignal (with timeout)
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

		try {
			const response = await fetch('/api/notifications/subscribe', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					userId,
					eventId,
					selectedTeam,
					pushSubscription: {
						endpoint: pushSubscription.endpoint,
						keys: pushSubscription.toJSON().keys
					}
				}),
				signal: controller.signal
			});
			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorData = await response.text();
				console.error('Server registration failed:', errorData);
				throw new Error(`Server error (${response.status}): ${errorData}`);
			}

			const result = await response.json();
			console.log('Registration response:', result);

			if (!result.success) {
				throw new Error(`Registration failed: ${result.error || 'Unknown error'}`);
			}

			console.log('Successfully registered with notification service');
		} catch (fetchError) {
			clearTimeout(timeoutId);
			if (fetchError.name === 'AbortError') {
				throw new Error('Registration timed out - please try again');
			}
			throw fetchError;
		}
	}


	async function unregisterFromNotificationService() {
		try {
			const response = await fetch('/api/notifications/unsubscribe', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					eventId,
					selectedTeam
				})
			});

			if (!response.ok) {
				throw new Error('Failed to unregister from notification service');
			}
		} catch (error) {
			console.error('Notification unregistration failed:', error);
			// Don't throw - local unsubscription still works
		}
	}
</script>

{#if selectedTeam}
	<div class="flex items-center">
		{#if !isSupported}
			<div
				class="inline-flex items-center gap-2 rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
				title="Push notifications not supported in this browser"
			>
				<BellOff size={16} />
				Notifications Not Supported
			</div>
		{:else if !isInitialized}
			<div
				class="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-500"
			>
				<BellOff size={16} />
				Initializing...
			</div>
		{:else if isSubscribing}
			<button
				disabled
				type="button"
				class="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-500 cursor-not-allowed"
			>
				<div class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
				Subscribing...
			</button>
		{:else if isSubscribed}
			<button
				onclick={unsubscribeFromNotifications}
				type="button"
				class="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
				title="Disable notifications for {selectedTeam}"
			>
				<Bell size={16} />
				Notifications On
			</button>
		{:else}
			<button
				onclick={subscribeToNotifications}
				type="button"
				class="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
				title="Get notified when {selectedTeam} plays or refs"
			>
				<BellOff size={16} />
				Enable Notifications
			</button>
		{/if}
	</div>
{/if}
