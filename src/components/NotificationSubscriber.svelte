<script lang="ts">
	import { onMount } from 'svelte';
	import { Bell, BellOff } from 'lucide-svelte';
	import toast from 'svelte-5-french-toast';
	import {
		initializeOneSignal,
		subscribeToNotifications,
		unsubscribeFromNotifications,
		checkSubscriptionStatus
	} from '$lib/onesignal';

	let {
		selectedTeam = '', // This is now the team ID
		selectedTeamName = '',
		eventId,
		supabase
	} = $props<{
		selectedTeam?: string;
		selectedTeamName?: string;
		eventId?: string;
		supabase: any;
	}>();

	let isSupported = $state(false);
	let isInitialized = $state(false);
	let isSubscribed = $state(false);
	let isSubscribing = $state(false);
	let isIOSNotStandalone = $state(false);
	let currentSubscribedTeam = $state<string | null>(null);

	// Local storage key for subscription preference (now event-based)
	const getStorageKey = () => `notify_${eventId}`;
	const getTeamStorageKey = (teamId: string) => `notify_${eventId}_${teamId}`;

	// Helper to clear all team subscriptions for this event
	const clearAllTeamSubscriptions = () => {
		// Find and remove all team-specific keys for this event
		const keysToRemove = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.startsWith(`notify_${eventId}_`)) {
				keysToRemove.push(key);
			}
		}
		keysToRemove.forEach((key) => localStorage.removeItem(key));
	};

	// Helper to get currently subscribed team for this event
	const getCurrentSubscribedTeam = () => {
		return localStorage.getItem(getStorageKey());
	};

	// Helper to set current subscribed team
	const setCurrentSubscribedTeam = (teamId: string) => {
		localStorage.setItem(getStorageKey(), teamId);
	};

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
		// Check browser support
		const hasServiceWorker = 'serviceWorker' in navigator;
		const hasPushManager = 'PushManager' in window;
		const hasNotification = 'Notification' in window;

		// iOS specific checks
		const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
		const isInStandaloneMode =
			window.matchMedia('(display-mode: standalone)').matches ||
			(window.navigator as any).standalone === true;

		console.log('Browser support check:', {
			hasServiceWorker,
			hasPushManager,
			hasNotification,
			isIOS,
			isInStandaloneMode,
			userAgent: navigator.userAgent
		});

		isSupported = hasServiceWorker && hasPushManager && hasNotification;

		// On iOS, require standalone mode for push notifications
		if (isIOS && !isInStandaloneMode) {
			console.log('iOS detected but not in standalone mode - notifications not available');
			isSupported = false;
			isIOSNotStandalone = true;
		}

		if (isSupported) {
			try {
				console.log('Attempting to initialize OneSignal...');
				await initializeOneSignal();
				console.log('OneSignal initialized successfully');
				isInitialized = true;
				await updateSubscriptionStatus();
			} catch (error) {
				console.error('OneSignal initialization failed:', error);
				isInitialized = true; // Still allow UI to show with error state
			}
		} else {
			console.log('Browser not supported or iOS not in standalone mode');
			isInitialized = true;
		}
	});

	// Check subscription when team changes
	$effect(() => {
		if (selectedTeam && isInitialized) {
			updateSubscriptionStatus();
		}
	});

	async function updateSubscriptionStatus() {
		if (!selectedTeam || !isInitialized) {
			isSubscribed = false;
			return;
		}

		try {
			const hasPermission = await checkSubscriptionStatus();
			currentSubscribedTeam = getCurrentSubscribedTeam();
			// User is subscribed if they have permission AND the currently selected team is the subscribed team
			isSubscribed = hasPermission && currentSubscribedTeam === selectedTeam;
		} catch (error) {
			console.error('Error checking subscription status:', error);
			isSubscribed = false;
			currentSubscribedTeam = null;
		}
	}

	async function subscribeToNotificationsHandler() {
		if (isSubscribing || !selectedTeam || !eventId) return;
		isSubscribing = true;

		try {
			const userId = getUserId();

			// Subscribe with OneSignal Web SDK
			await subscribeToNotifications(userId, eventId, selectedTeam);

			// Update tags on server for targeting
			const response = await fetch('/api/notifications/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, eventId, selectedTeam })
			});

			if (!response.ok) {
				throw new Error('Failed to update server');
			}

			// Check if switching from another team
			const previousSubscribedTeam = getCurrentSubscribedTeam();
			const isSwitching = previousSubscribedTeam && previousSubscribedTeam !== selectedTeam;

			// Clear any previous team subscriptions for this event
			clearAllTeamSubscriptions();

			// Mark current team as subscribed
			setCurrentSubscribedTeam(selectedTeam);
			currentSubscribedTeam = selectedTeam;
			isSubscribed = true;

			if (isSwitching) {
				toast.success(`Switched notifications to ${selectedTeamName}!`);
			} else {
				toast.success(`Notifications enabled for ${selectedTeamName}!`);
			}
		} catch (error) {
			console.error('Subscription error:', error);
			toast.error(`Failed to enable notifications: ${error.message}`);
			clearAllTeamSubscriptions();
			isSubscribed = false;
		} finally {
			isSubscribing = false;
		}
	}

	async function unsubscribeFromNotificationsHandler() {
		try {
			const userId = getUserId();

			// Unsubscribe with OneSignal Web SDK
			await unsubscribeFromNotifications();

			// Remove tags on server
			const response = await fetch('/api/notifications/unsubscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, eventId, selectedTeam })
			});

			if (!response.ok) {
				console.warn('Failed to update server, but local unsubscribe succeeded');
			}

			// Clear all team subscriptions for this event
			clearAllTeamSubscriptions();
			currentSubscribedTeam = null;
			isSubscribed = false;
			toast.success('Notifications disabled');
		} catch (error) {
			console.error('Error unsubscribing:', error);
			toast.error('Failed to disable notifications');
		}
	}
</script>

{#if selectedTeam}
	<div class="flex items-center">
		{#if !isSupported}
			{#if isIOSNotStandalone}
				<div
					class="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
					title="On iOS, add this app to your home screen first to enable notifications"
				>
					<BellOff size={16} />
					Add to Home Screen First
				</div>
			{:else}
				<div
					class="inline-flex items-center gap-2 rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
					title="Push notifications not supported in this browser"
				>
					<BellOff size={16} />
					Notifications Not Supported
				</div>
			{/if}
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
				class="inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-500"
			>
				<div
					class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"
				></div>
				Subscribing...
			</button>
		{:else if isSubscribed}
			<button
				onclick={unsubscribeFromNotificationsHandler}
				type="button"
				class="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
				title="Disable notifications for {selectedTeamName}"
			>
				<Bell size={16} />
				Notifications On
			</button>
		{:else if currentSubscribedTeam && currentSubscribedTeam !== selectedTeam}
			<button
				onclick={subscribeToNotificationsHandler}
				type="button"
				class="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
				title="Switch notifications from current team to {selectedTeamName}"
			>
				<Bell size={16} />
				Switch to This Team
			</button>
		{:else}
			<button
				onclick={subscribeToNotificationsHandler}
				type="button"
				class="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
				title="Get notified when {selectedTeamName} plays or refs"
			>
				<BellOff size={16} />
				Enable Notifications
			</button>
		{/if}
	</div>
{/if}
