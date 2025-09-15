<script lang="ts">
	import SettingsIcon from 'lucide-svelte/icons/settings';
	import UsersIcon from 'lucide-svelte/icons/users';
	import ListIcon from 'lucide-svelte/icons/list';
	import BarChartIcon from 'lucide-svelte/icons/bar-chart-2';

	let { currentTab, onTabChange, readOnly = false, isCreate = false } = $props();

	const tabs = $derived([
		...(!readOnly
			? [
					{ id: 'settings', label: 'Settings', icon: SettingsIcon, disabled: false },
					{ id: 'teams', label: 'Teams', icon: UsersIcon, disabled: isCreate }
				]
			: []),
		{ id: 'matches', label: 'Matches', icon: ListIcon, disabled: isCreate },
		{ id: 'standings', label: 'Standings', icon: BarChartIcon, disabled: isCreate }
	]);

	function handleTabClick(tabId: string, disabled: boolean) {
		if (!disabled) {
			onTabChange?.(tabId);
		}
	}
</script>

<div
	class="mobile-tab-bar fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur-sm md:hidden dark:border-gray-700 dark:bg-gray-900/95"
>
	<div class="flex justify-around px-2 py-2">
		{#each tabs as tab}
			{@const isActive = currentTab === tab.id && !tab.disabled}
			{@const iconClass = `h-5 w-5 transition-colors duration-200 ${
				tab.disabled
					? 'text-gray-300'
					: isActive
						? 'text-emerald-600'
						: 'text-gray-500'
			}`}
			{@const textClass = `text-xs font-medium transition-colors duration-200 ${
				tab.disabled
					? 'text-gray-300'
					: isActive
						? 'text-emerald-600'
						: 'text-gray-600'
			}`}
			<button
				onclick={() => handleTabClick(tab.id, tab.disabled)}
				disabled={tab.disabled}
				class="tab-button flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
				class:active={isActive}
				class:inactive={currentTab !== tab.id && !tab.disabled}
			>
				<svelte:component this={tab.icon} class={iconClass} />
				<span class={textClass}>
					{tab.label}
				</span>
			</button>
		{/each}
	</div>
	<!-- Safe area for devices with home indicators -->
	<div class="h-safe-bottom bg-white dark:bg-gray-900"></div>
</div>

<style>
	.tab-button.active {
		background-color: rgba(16, 185, 129, 0.1);
	}

	.tab-button.inactive:hover {
		background-color: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .tab-button.inactive:hover {
		background-color: rgba(255, 255, 255, 0.05);
	}

	.tab-button:active {
		transform: scale(0.95);
	}

	/* Handle safe area for devices with home indicators */
	.h-safe-bottom {
		height: env(safe-area-inset-bottom, 0px);
		min-height: 8px; /* Fallback for older browsers */
	}

	/* Adjust viewport to account for safe area */
	@supports (padding: max(0px)) {
		.h-safe-bottom {
			height: max(8px, env(safe-area-inset-bottom));
		}
	}
</style>
