<script lang="ts">
	import ErrorBoundary from './ErrorBoundary.svelte';
	import * as Alert from '$components/ui/alert/index.js';
	import { Button } from '$components/ui/button';
	import Trophy from 'lucide-svelte/icons/trophy';
	import Users from 'lucide-svelte/icons/users';
	import Calendar from 'lucide-svelte/icons/calendar';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';

	let { children, tournamentId, eventName } = $props();

	function handleTournamentError(error: any, retry: () => void) {
		const errorMessage = error?.message?.toLowerCase() || '';

		if (errorMessage.includes('tournament not found') || errorMessage.includes('event not found')) {
			return {
				title: 'Tournament Not Found',
				description: `The tournament "${eventName || 'Unknown'}" could not be found. It may have been deleted or you may not have permission to view it.`,
				actions: [
					{ label: 'Back to Dashboard', action: () => (window.location.href = '/') },
					{ label: 'Refresh', action: retry }
				]
			};
		}

		if (errorMessage.includes('teams')) {
			return {
				title: 'Team Data Error',
				description:
					'There was a problem loading team information. This might be due to incomplete team setup.',
				actions: [
					{
						label: 'Manage Teams',
						action: () => (window.location.href = `/events/${tournamentId}#teams`)
					},
					{ label: 'Retry', action: retry }
				]
			};
		}

		if (errorMessage.includes('matches') || errorMessage.includes('schedule')) {
			return {
				title: 'Match Schedule Error',
				description:
					'Unable to load the tournament schedule. The matches may not have been generated yet.',
				actions: [
					{
						label: 'Generate Matches',
						action: () => (window.location.href = `/events/${tournamentId}#matches`)
					},
					{ label: 'Retry', action: retry }
				]
			};
		}

		return {
			title: 'Tournament Error',
			description: 'An error occurred while loading the tournament data. Please try again.',
			actions: [
				{ label: 'Back to Dashboard', action: () => (window.location.href = '/') },
				{ label: 'Retry', action: retry }
			]
		};
	}
</script>

<ErrorBoundary context="unknown">
	{@render children()}

	{#snippet fallback(error: any, retry: () => void)}
		{@const errorInfo = handleTournamentError(error, retry)}
		<Alert.Root
			class="border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-200"
		>
			<Trophy class="h-5 w-5" />
			<Alert.Title class="text-lg font-semibold">{errorInfo.title}</Alert.Title>
			<Alert.Description class="mt-3">
				<p class="mb-4">{errorInfo.description}</p>

				{#if tournamentId}
					<div class="mb-4 rounded-md bg-orange-100 p-3 dark:bg-orange-900/20">
						<p class="text-sm"><strong>Tournament ID:</strong> {tournamentId}</p>
						{#if eventName}
							<p class="text-sm"><strong>Event:</strong> {eventName}</p>
						{/if}
					</div>
				{/if}

				<div class="flex flex-wrap gap-2">
					{#each errorInfo.actions as action}
						<Button onclick={action.action} variant="outline" size="sm" class="gap-2">
							{#if action.label.includes('Retry') || action.label.includes('Refresh')}
								<RefreshCw class="h-3 w-3" />
							{:else if action.label.includes('Teams')}
								<Users class="h-3 w-3" />
							{:else if action.label.includes('Matches')}
								<Calendar class="h-3 w-3" />
							{/if}
							{action.label}
						</Button>
					{/each}
				</div>
			</Alert.Description>
		</Alert.Root>
	{/snippet}
</ErrorBoundary>
