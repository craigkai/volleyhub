<script lang="ts">
	import { onMount } from 'svelte';
	import { Bell, BellOff } from 'lucide-svelte';
	import toast from 'svelte-5-french-toast';
	import { dev } from '$app/environment';

	let {
		supabase,
		user,
		selectedTeam = '',
		eventId
	} = $props<{
		supabase: any;
		user: any;
		selectedTeam?: string;
		eventId?: string;
	}>();

	let isSubscribed = $state(false);
	let isSupported = $state(false);
	let permission = $state<NotificationPermission>('default');

	const VAPID_PUBLIC_KEY = 'BEETJnh6HFQcfifDAkd_j87tFK380FDeXHHCAJgpQws7lEzUl_ZZWjYipszSOQ5MU2u0aGpk3975FK9hyFwlrqg';

	function urlBase64ToUint8Array(base64String: string) {
		const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
		const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
		const rawData = window.atob(base64);
		const outputArray = new Uint8Array(rawData.length);
		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	}

	onMount(async () => {
		console.log('PushNotificationSubscriber mounted:', {
			user: !!user,
			selectedTeam,
			eventId,
			dev
		});

		// Check if push notifications are supported
		const hasServiceWorker = 'serviceWorker' in navigator;
		const hasPushManager = 'PushManager' in window;
		const hasNotification = 'Notification' in window;

		isSupported = hasServiceWorker && hasPushManager && hasNotification;

		console.log('Push notification support check:', {
			hasServiceWorker,
			hasPushManager,
			hasNotification,
			isSupported,
			userAgent: navigator.userAgent
		});

		if (!isSupported) {
			console.log('Push notifications not supported');
			return;
		}

		// Get current permission status
		permission = Notification.permission;
		console.log('Current permission:', permission);

		// Only check subscription status in production
		if (!dev && user) {
			await checkSubscriptionStatus();
		}
	});

	async function checkSubscriptionStatus() {
		if (!isSupported || !selectedTeam) return;

		// For anonymous users, check localStorage for subscription status
		if (!user?.id) {
			const localKey = `push_subscription_${eventId}_${selectedTeam}`;
			isSubscribed = !!localStorage.getItem(localKey);
			return;
		}

		// For logged-in users, check database
		try {
			const { data, error } = await supabase
				.from('push_subscriptions')
				.select('id')
				.eq('user_id', user.id)
				.eq('selected_team', selectedTeam || '')
				.eq('event_id', eventId || '')
				.maybeSingle();

			if (error) {
				console.error('Push subscriptions table error:', error);
				// Table probably doesn't exist - show a warning
				if (error.code === '42P01') {
					console.warn('push_subscriptions table not found. Run database migrations.');
				}
				return;
			}

			isSubscribed = !!data;
		} catch (error) {
			console.error('Error checking subscription status:', error);
		}
	}

	async function requestPermission() {
		if (!isSupported) {
			toast.error('Push notifications are not supported in this browser');
			return false;
		}

		if (permission === 'denied') {
			toast.error('Push notifications are blocked. Please enable them in your browser settings.');
			return false;
		}

		if (permission !== 'granted') {
			permission = await Notification.requestPermission();
		}

		return permission === 'granted';
	}

	async function subscribeToPush() {
		const hasPermission = await requestPermission();
		if (!hasPermission) return;

		try {
			const registration = await navigator.serviceWorker.ready;

			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
			});

			if (user?.id) {
				// Save subscription to database for logged-in users
				const { error } = await supabase.from('push_subscriptions').upsert({
					user_id: user.id,
					endpoint: subscription.endpoint,
					keys: subscription.toJSON().keys,
					selected_team: selectedTeam || null,
					event_id: eventId ? parseInt(eventId.toString()) : null
				});

				if (error) throw error;
			} else {
				// Save subscription locally for anonymous users
				const { error } = await supabase.from('push_subscriptions').upsert({
					user_id: null,
					endpoint: subscription.endpoint,
					keys: subscription.toJSON().keys,
					selected_team: selectedTeam || null,
					event_id: eventId ? parseInt(eventId.toString()) : null
				});

				if (error) throw error;

				// Also store in localStorage for quick checking
				const localKey = `push_subscription_${eventId}_${selectedTeam}`;
				localStorage.setItem(localKey, 'true');
			}

			isSubscribed = true;
			toast.success(`Notifications enabled${selectedTeam ? ` for ${selectedTeam}` : ''}!`);
		} catch (error) {
			console.error('Error subscribing to push notifications:', error);
			toast.error('Failed to enable notifications');
		}
	}

	async function unsubscribeFromPush() {
		try {
			if (user?.id) {
				// Remove from database for logged-in users
				const { error } = await supabase
					.from('push_subscriptions')
					.delete()
					.eq('user_id', user.id)
					.eq('selected_team', selectedTeam || '')
					.eq('event_id', eventId || '');

				if (error) throw error;
			} else {
				// Remove from database for anonymous users
				const registration = await navigator.serviceWorker.ready;
				const subscription = await registration.pushManager.getSubscription();

				if (subscription) {
					const { error } = await supabase
						.from('push_subscriptions')
						.delete()
						.eq('endpoint', subscription.endpoint)
						.eq('selected_team', selectedTeam || '')
						.eq('event_id', eventId || '');

					if (error) throw error;
				}

				// Remove from localStorage
				const localKey = `push_subscription_${eventId}_${selectedTeam}`;
				localStorage.removeItem(localKey);
			}

			// Unsubscribe from browser
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.getSubscription();
			if (subscription) {
				await subscription.unsubscribe();
			}

			isSubscribed = false;
			toast.success('Notifications disabled');
		} catch (error) {
			console.error('Error unsubscribing from push notifications:', error);
			toast.error('Failed to disable notifications');
		}
	}

	// Update subscription when selectedTeam changes
	$effect(() => {
		if (isSupported && selectedTeam) {
			checkSubscriptionStatus();
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
				title={navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')
					? 'Safari: Add to Home Screen first, then enable notifications'
					: 'Push notifications not supported in this browser'}
			>
				<BellOff size={16} />
				{#if navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')}
					Add to Home Screen for Notifications
				{:else}
					Notifications Not Supported
				{/if}
			</div>
		{:else if isSubscribed}
			<button
				onclick={unsubscribeFromPush}
				class="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
				title="Disable notifications for {selectedTeam || 'this tournament'}"
			>
				<Bell size={16} />
				Notifications On
			</button>
		{:else}
			<button
				onclick={subscribeToPush}
				class="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
				title="Get notified when {selectedTeam || 'your team'} plays or refs"
			>
				<BellOff size={16} />
				Enable Notifications
			</button>
		{/if}
	</div>
{/if}