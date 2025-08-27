<script lang="ts">
	import ErrorBoundary from './ErrorBoundary.svelte';
	import * as Alert from '$components/ui/alert/index.js';
	import { Button } from '$components/ui/button';
	import Wifi from 'lucide-svelte/icons/wifi';
	import WifiOff from 'lucide-svelte/icons/wifi-off';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import { onMount } from 'svelte';

	let { children, showOfflineIndicator = true } = $props();

	let isOnline = $state(typeof navigator !== 'undefined' ? navigator.onLine : true);
	let retryAttempts = $state(0);
	const MAX_RETRY_ATTEMPTS = 3;

	onMount(() => {
		const handleOnline = () => (isOnline = true);
		const handleOffline = () => (isOnline = false);

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});

	function handleNetworkError(error: any, retry: () => void) {
		const errorMessage = error?.message?.toLowerCase() || '';

		if (!isOnline) {
			return {
				title: 'No Internet Connection',
				description:
					'You appear to be offline. Please check your internet connection and try again.',
				icon: WifiOff,
				retryable: false,
				actions: [
					{
						label: 'Check Connection',
						action: () => {
							// Test connection by trying to fetch a small resource
							fetch('/ping', { method: 'HEAD' })
								.then(() => retry())
								.catch(() => alert('Still offline. Please check your connection.'));
						}
					}
				]
			};
		}

		if (errorMessage.includes('timeout') || errorMessage.includes('network timeout')) {
			return {
				title: 'Request Timeout',
				description:
					'The request took too long to complete. This might be due to a slow connection or server issues.',
				icon: AlertTriangle,
				retryable: true,
				actions: [{ label: 'Retry Now', action: retry }]
			};
		}

		if (errorMessage.includes('503') || errorMessage.includes('service unavailable')) {
			return {
				title: 'Service Temporarily Unavailable',
				description:
					'The server is currently unavailable. This is usually temporary - please try again in a few moments.',
				icon: AlertTriangle,
				retryable: true,
				actions: [{ label: 'Retry', action: retry }]
			};
		}

		if (errorMessage.includes('500') || errorMessage.includes('internal server error')) {
			return {
				title: 'Server Error',
				description:
					'Something went wrong on our end. Our team has been notified and is working to fix this.',
				icon: AlertTriangle,
				retryable: true,
				actions: [
					{ label: 'Retry', action: retry },
					{
						label: 'Report Issue',
						action: () => window.open('mailto:support@volleyhub.com?subject=Server Error Report')
					}
				]
			};
		}

		if (errorMessage.includes('fetch')) {
			return {
				title: 'Connection Failed',
				description: 'Unable to connect to the server. Please check your internet connection.',
				icon: WifiOff,
				retryable: true,
				actions: [{ label: 'Retry', action: retry }]
			};
		}

		return {
			title: 'Network Error',
			description: 'A network error occurred. Please check your connection and try again.',
			icon: WifiOff,
			retryable: true,
			actions: [{ label: 'Retry', action: retry }]
		};
	}

	function handleRetry(originalRetry: () => void) {
		retryAttempts++;

		if (retryAttempts >= MAX_RETRY_ATTEMPTS) {
			// Exponential backoff for final retry
			setTimeout(originalRetry, 2000 * retryAttempts);
		} else {
			originalRetry();
		}
	}
</script>

{#if showOfflineIndicator && !isOnline}
	<div class="fixed top-0 right-0 left-0 z-50 bg-red-600 px-4 py-2 text-center text-sm text-white">
		<div class="flex items-center justify-center gap-2">
			<WifiOff class="h-4 w-4" />
			<span>You are offline. Some features may not work properly.</span>
		</div>
	</div>
{/if}

<ErrorBoundary context="network">
	{@render children()}

	{#snippet fallback(error: any, retry: () => void)}
		{@const errorInfo = handleNetworkError(error, retry)}
		{@const IconComponent = errorInfo.icon}

		<Alert.Root
			class="border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200"
		>
			<IconComponent class="h-5 w-5" />
			<Alert.Title class="text-lg font-semibold">{errorInfo.title}</Alert.Title>
			<Alert.Description class="mt-3">
				<p class="mb-4">{errorInfo.description}</p>

				{#if !isOnline}
					<div class="mb-4 rounded-md bg-red-100 p-3 dark:bg-red-900/20">
						<div class="flex items-center gap-2">
							<WifiOff class="h-4 w-4" />
							<span class="text-sm font-medium">Currently offline</span>
						</div>
					</div>
				{:else if retryAttempts > 0}
					<div class="mb-4 rounded-md bg-yellow-100 p-3 dark:bg-yellow-900/20">
						<p class="text-sm">
							<strong>Retry attempts:</strong>
							{retryAttempts}/{MAX_RETRY_ATTEMPTS}
						</p>
					</div>
				{/if}

				<div class="flex flex-wrap gap-2">
					{#each errorInfo.actions as action}
						<Button
							onclick={() => {
								if (action.label.includes('Retry')) {
									handleRetry(retry);
								} else {
									action.action();
								}
							}}
							variant="outline"
							size="sm"
							class="gap-2"
							disabled={action.label.includes('Retry') && (!errorInfo.retryable || !isOnline)}
						>
							{#if action.label.includes('Retry')}
								<RefreshCw class="h-3 w-3" />
							{:else if action.label.includes('Connection')}
								<Wifi class="h-3 w-3" />
							{/if}
							{action.label}
						</Button>
					{/each}

					{#if retryAttempts >= MAX_RETRY_ATTEMPTS}
						<Button
							onclick={() => window.location.reload()}
							variant="destructive"
							size="sm"
							class="gap-2"
						>
							<RefreshCw class="h-3 w-3" />
							Force Reload
						</Button>
					{/if}
				</div>
			</Alert.Description>
		</Alert.Root>
	{/snippet}
</ErrorBoundary>
