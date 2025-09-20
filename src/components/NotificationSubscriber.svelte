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
	let subscriptionState = $state(0); // Force reactivity trigger

	// Derive subscription status from localStorage and permissions
	let isSubscribed = $derived.by(() => {
		// Access subscriptionState to make this reactive to manual updates
		subscriptionState;
		if (!isInitialized || !selectedTeam) return false;
		const stored = localStorage.getItem(getStorageKey());
		const hasPermission = 'Notification' in window && Notification.permission === 'granted';
		return stored === 'true' && hasPermission;
	});

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
		// Clear any old service workers first
		await clearOldServiceWorkers();

		// Check browser support
		const hasServiceWorker = 'serviceWorker' in navigator;
		const hasPushManager = 'PushManager' in window;
		const hasNotification = 'Notification' in window;

		isSupported = hasServiceWorker && hasPushManager && hasNotification;

		// No need for complex reload handling - user can just click again after reload

		isInitialized = true;
	});

	async function clearOldServiceWorkers() {
		if ('serviceWorker' in navigator) {
			try {
				const registrations = await navigator.serviceWorker.getRegistrations();
				for (const registration of registrations) {
					await registration.unregister();
				}
			} catch (error) {
				console.error('Error clearing service workers:', error);
			}
		}
	}

	function subscribeToNotifications() {
		console.log('subscribeToNotifications called');

		// Wrap everything in immediate try-catch to prevent page reload
		setTimeout(async () => {
			try {
				console.log('Starting async subscription process');

				// Request notification permission
				if ('Notification' in window) {
					console.log('Requesting notification permission');
					const permission = await Notification.requestPermission();
					console.log('Permission result:', permission);

				if (permission !== 'granted') {
					toast.error('Notification permission denied');
					return;
				}

				// Get or register service worker (page may reload)
				console.log('Getting service worker registration...');
				let registration = await navigator.serviceWorker.getRegistration();

				if (!registration) {
					console.log('Registering service worker (page may reload)...');
					registration = await navigator.serviceWorker.register('/sw.js');
				}

				await navigator.serviceWorker.ready;
				console.log('Service worker ready, proceeding with subscription...');

				// Subscribe to push notifications with VAPID key
				const vapidPublicKey =
					'BEETJnh6HFQcfifDAkd_j87tFK380FDeXHHCAJgpQws7lEzUl_ZZWjYipszSOQ5MU2u0aGpk3975FK9hyFwlrqg';
				const pushSubscription = await registration.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
				});

				// Register with notification service via our API
				await registerWithNotificationService(pushSubscription);

				// Only store locally if API call succeeds
				localStorage.setItem(getStorageKey(), 'true');
				subscriptionState++; // Trigger reactivity
				toast.success(`Notifications enabled for ${selectedTeam}!`);
			}
			} catch (error) {
				console.error('Error subscribing to notifications:', error);
				toast.error(`Failed to enable notifications: ${error.message}`);
				// Make sure localStorage is not set on failure
				localStorage.removeItem(getStorageKey());
				subscriptionState++; // Trigger reactivity
			}
		}, 0);
	}

	async function unsubscribeFromNotifications() {
		try {
			// Remove subscription preference
			localStorage.removeItem(getStorageKey());
			subscriptionState++; // Trigger reactivity

			// Unregister from notification service
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

		// Call our backend to register this user with OneSignal
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
			})
		});

		if (!response.ok) {
			const errorData = await response.text();
			throw new Error(`Server error: ${errorData}`);
		}

		const result = await response.json();
		if (!result.success) {
			throw new Error(`Registration failed: ${result.error}`);
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
