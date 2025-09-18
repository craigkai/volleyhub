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
		// Don't initialize in development mode
		if (dev) {
			console.log('Push notifications: Skipped in development mode');
			return;
		}

		// Check if push notifications are supported
		isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

		if (!isSupported) {
			console.log('Push notifications not supported');
			return;
		}

		// Get current permission status
		permission = Notification.permission;

		// Check if user is already subscribed
		await checkSubscriptionStatus();
	});

	async function checkSubscriptionStatus() {
		if (!user?.id || !isSupported) return;

		try {
			const { data } = await supabase
				.from('push_subscriptions')
				.select('id')
				.eq('user_id', user.id)
				.eq('selected_team', selectedTeam || '')
				.eq('event_id', eventId || '')
				.maybeSingle();

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
		if (!user?.id) {
			toast.error('Please log in to enable notifications');
			return;
		}

		const hasPermission = await requestPermission();
		if (!hasPermission) return;

		try {
			const registration = await navigator.serviceWorker.ready;

			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
			});

			// Save subscription to database
			const { error } = await supabase.from('push_subscriptions').upsert({
				user_id: user.id,
				endpoint: subscription.endpoint,
				keys: subscription.toJSON().keys,
				selected_team: selectedTeam || null,
				event_id: eventId || null
			});

			if (error) throw error;

			isSubscribed = true;
			toast.success(`Notifications enabled${selectedTeam ? ` for ${selectedTeam}` : ''}!`);
		} catch (error) {
			console.error('Error subscribing to push notifications:', error);
			toast.error('Failed to enable notifications');
		}
	}

	async function unsubscribeFromPush() {
		if (!user?.id) return;

		try {
			// Remove from database
			const { error } = await supabase
				.from('push_subscriptions')
				.delete()
				.eq('user_id', user.id)
				.eq('selected_team', selectedTeam || '')
				.eq('event_id', eventId || '');

			if (error) throw error;

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
		if (user?.id && isSupported) {
			checkSubscriptionStatus();
		}
	});
</script>

{#if user}
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
				class="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-500"
				title="Push notifications not supported in this browser"
			>
				<BellOff size={16} />
				Notifications Not Supported
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