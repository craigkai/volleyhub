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

	let isSubscribed = $state(false);
	let isSupported = $state(false);
	let isInitialized = $state(false);

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

	onMount(async () => {
		// Clear any old service workers first
		await clearOldServiceWorkers();

		// Check browser support
		const hasServiceWorker = 'serviceWorker' in navigator;
		const hasPushManager = 'PushManager' in window;
		const hasNotification = 'Notification' in window;

		isSupported = hasServiceWorker && hasPushManager && hasNotification;

		// Check if user has subscribed for this team
		if (isSupported && selectedTeam) {
			const stored = localStorage.getItem(getStorageKey());
			const hasPermission = 'Notification' in window && Notification.permission === 'granted';
			isSubscribed = stored === 'true' && hasPermission;
		}

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

	async function subscribeToNotifications() {
		try {
			// Request notification permission
			if ('Notification' in window) {
				const permission = await Notification.requestPermission();

				if (permission !== 'granted') {
					toast.error('Notification permission denied');
					return;
				}

				// Store subscription preference locally
				localStorage.setItem(getStorageKey(), 'true');
				isSubscribed = true;

				// Register with notification service via our API
				await registerWithNotificationService();

				toast.success(`Notifications enabled for ${selectedTeam}!`);
			}
		} catch (error) {
			console.error('Error subscribing to notifications:', error);
			toast.error('Failed to enable notifications');
		}
	}

	async function unsubscribeFromNotifications() {
		try {
			// Remove subscription preference
			localStorage.removeItem(getStorageKey());
			isSubscribed = false;

			// Unregister from notification service
			await unregisterFromNotificationService();

			toast.success('Notifications disabled');
		} catch (error) {
			console.error('Error unsubscribing:', error);
			toast.error('Failed to disable notifications');
		}
	}

	async function registerWithNotificationService() {
		try {
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
					tags: {
						eventId: eventId?.toString(),
						selectedTeam
					}
				})
			});

			if (!response.ok) {
				throw new Error('Failed to register with notification service');
			}
		} catch (error) {
			console.error('Notification registration failed:', error);
			// Don't throw - local subscription still works
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

	// Update subscription when selectedTeam changes
	$effect(() => {
		if (isInitialized && selectedTeam) {
			const stored = localStorage.getItem(getStorageKey());
			const hasPermission = 'Notification' in window && Notification.permission === 'granted';
			isSubscribed = stored === 'true' && hasPermission;
		}
	});
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
				class="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
				title="Disable notifications for {selectedTeam}"
			>
				<Bell size={16} />
				Notifications On
			</button>
		{:else}
			<button
				onclick={subscribeToNotifications}
				class="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
				title="Get notified when {selectedTeam} plays or refs"
			>
				<BellOff size={16} />
				Enable Notifications
			</button>
		{/if}
	</div>
{/if}