<script lang="ts">
	import * as Alert from '$components/ui/alert/index.js';
	import { Button } from '$components/ui/button';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import Bug from 'lucide-svelte/icons/bug';
	import { onMount, onDestroy } from 'svelte';

	type ErrorLevel = 'error' | 'warning' | 'info';
	type ErrorContext = 'network' | 'validation' | 'permission' | 'unknown';

	interface EnhancedError {
		message: string;
		level: ErrorLevel;
		context: ErrorContext;
		timestamp: Date;
		stack?: string;
		recoverable: boolean;
	}

	let {
		children,
		fallback,
		showDetails = true,
		allowRetry = true,
		context = 'unknown' as ErrorContext
	} = $props();

	let hasError = $state(false);
	let error = $state<EnhancedError | null>(null);
	let retryCount = $state(0);
	const MAX_RETRIES = 3;

	function categorizeError(err: Error): EnhancedError {
		const message = err.message.toLowerCase();

		if (
			message.includes('network') ||
			message.includes('fetch') ||
			message.includes('connection')
		) {
			return {
				message: err.message,
				level: 'error',
				context: 'network',
				timestamp: new Date(),
				stack: err.stack,
				recoverable: true
			};
		}

		if (message.includes('validation') || message.includes('invalid')) {
			return {
				message: err.message,
				level: 'warning',
				context: 'validation',
				timestamp: new Date(),
				stack: err.stack,
				recoverable: true
			};
		}

		if (message.includes('permission') || message.includes('unauthorized')) {
			return {
				message: err.message,
				level: 'error',
				context: 'permission',
				timestamp: new Date(),
				stack: err.stack,
				recoverable: false
			};
		}

		return {
			message: err.message,
			level: 'error',
			context: context,
			timestamp: new Date(),
			stack: err.stack,
			recoverable: true
		};
	}

	function handleError(event: ErrorEvent | PromiseRejectionEvent) {
		const sourceError = 'error' in event ? event.error : event.reason;
		const errorObj = sourceError instanceof Error ? sourceError : new Error(String(sourceError));

		error = categorizeError(errorObj);
		hasError = true;

		console.error('Error caught by boundary:', {
			error: errorObj,
			context,
			timestamp: error.timestamp,
			retryCount
		});

		// Report to error tracking service in production
		if (import.meta.env.PROD) {
			reportError(error, retryCount);
		}
	}

	function handleUnhandledRejection(event: PromiseRejectionEvent) {
		handleError(event);
		event.preventDefault();
	}

	function reportError(err: EnhancedError, attempts: number) {
		// In a real app, send to error tracking service like Sentry
		console.error('Error reported:', { ...err, attempts });
	}

	function retry() {
		if (retryCount >= MAX_RETRIES) {
			console.warn('Max retries reached, forcing page reload');
			window.location.reload();
			return;
		}

		retryCount++;
		hasError = false;
		error = null;

		// For network errors, wait before retrying
		if (error?.context === 'network') {
			setTimeout(
				() => {
					// Component will re-render automatically
				},
				Math.min(1000 * Math.pow(2, retryCount - 1), 5000)
			); // Exponential backoff
		}
	}

	function getErrorIcon() {
		if (!error) return AlertCircle;

		switch (error.context) {
			case 'network':
				return RefreshCw;
			case 'validation':
				return AlertCircle;
			case 'permission':
				return AlertCircle;
			default:
				return Bug;
		}
	}

	function getErrorColor() {
		if (!error)
			return 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200';

		switch (error.level) {
			case 'warning':
				return 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
			case 'info':
				return 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
			default:
				return 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200';
		}
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('error', handleError);
			window.addEventListener('unhandledrejection', handleUnhandledRejection);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('error', handleError);
			window.removeEventListener('unhandledrejection', handleUnhandledRejection);
		}
	});
</script>

{#if hasError}
	{#if fallback}
		{@render fallback(error, retry)}
	{:else}
		{@const ErrorIcon = getErrorIcon()}
		<Alert.Root class={getErrorColor()}>
			<ErrorIcon class="h-4 w-4" />
			<Alert.Title>
				{#if error?.context === 'network'}
					Connection Problem
				{:else if error?.context === 'validation'}
					Invalid Data
				{:else if error?.context === 'permission'}
					Access Denied
				{:else}
					Something went wrong
				{/if}
			</Alert.Title>
			<Alert.Description class="mt-2">
				<p class="mb-3">
					{#if error?.context === 'network'}
						Unable to connect to the server. Please check your internet connection.
					{:else if error?.context === 'validation'}
						The data provided is invalid. Please check your input and try again.
					{:else if error?.context === 'permission'}
						You don't have permission to perform this action. Please contact an administrator.
					{:else}
						An unexpected error occurred. Please try again.
					{/if}
				</p>

				{#if error && showDetails}
					<details class="mb-3">
						<summary class="cursor-pointer text-sm font-medium">Error details</summary>
						<div class="mt-2 space-y-1 text-xs">
							<p><strong>Message:</strong> {error.message}</p>
							<p><strong>Time:</strong> {error.timestamp.toLocaleString()}</p>
							<p><strong>Context:</strong> {error.context}</p>
							{#if retryCount > 0}
								<p><strong>Retry attempts:</strong> {retryCount}/{MAX_RETRIES}</p>
							{/if}
							{#if error.stack}
								<details class="mt-2">
									<summary class="cursor-pointer font-medium">Stack trace</summary>
									<pre class="mt-1 max-h-32 overflow-auto text-xs">{error.stack}</pre>
								</details>
							{/if}
						</div>
					</details>
				{/if}

				<div class="flex gap-2">
					{#if allowRetry && error?.recoverable && retryCount < MAX_RETRIES}
						<Button onclick={retry} variant="outline" size="sm" class="gap-2">
							<RefreshCw class="h-3 w-3" />
							Try again
						</Button>
					{/if}

					{#if retryCount >= MAX_RETRIES}
						<Button
							onclick={() => window.location.reload()}
							variant="outline"
							size="sm"
							class="gap-2"
						>
							<RefreshCw class="h-3 w-3" />
							Reload page
						</Button>
					{/if}

					{#if error?.context === 'permission'}
						<Button onclick={() => (window.location.href = '/auth')} variant="outline" size="sm">
							Sign in
						</Button>
					{/if}
				</div>
			</Alert.Description>
		</Alert.Root>
	{/if}
{:else}
	{@render children()}
{/if}
