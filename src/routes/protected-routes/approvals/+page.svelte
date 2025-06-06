<script lang="ts">
	import UserApprovalCard from './UserApprovalCard.svelte';
	let { data } = $props();
</script>

<div class="mx-auto max-w-4xl p-4 sm:p-6">
	<div class="mx-auto">
		<div class="text-center text-gray-900 dark:text-gray-200">
			<h1 class="mb-2 text-2xl font-bold sm:text-3xl">User Approvals</h1>
			<p class="text-sm text-gray-600 sm:text-base dark:text-gray-300">
				Review and approve pending user registrations
			</p>
		</div>
	</div>

	{#if !data.pendingUsers || data.pendingUsers.length === 0}
		<div class="py-8 text-center sm:py-12">
			<div
				class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 sm:h-16 sm:w-16"
			>
				<svg
					class="h-6 w-6 text-green-600 sm:h-8 sm:w-8"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
					></path>
				</svg>
			</div>
			<h3 class="mb-2 text-base font-medium text-gray-900 sm:text-lg dark:text-gray-300">
				All caught up!
			</h3>
			<p class="text-sm text-gray-500 dark:text-gray-300">
				No users awaiting approval at this time.
			</p>
		</div>
	{:else}
		<div class="mb-4 flex items-center justify-between sm:mb-6">
			<div class="flex items-center gap-2">
				<span
					class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
				>
					{data.pendingUsers.length} pending
				</span>
			</div>
		</div>

		<div class="space-y-3">
			{#each data.pendingUsers as user}
				<div
					class="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
				>
					<div class="p-4 sm:p-6">
						<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between">
							<div class="flex-1">
								<div class="mb-3 flex items-center gap-3">
									<div
										class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white sm:h-12 sm:w-12"
									>
										{user.name
											.split(' ')
											.map((n: any) => n[0])
											.join('')
											.toUpperCase()}
									</div>
									<div>
										<h3 class="text-base font-semibold text-gray-900 sm:text-lg dark:text-white">
											{user.name}
										</h3>
										<p class="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
											Registered {user.created_at}
										</p>
									</div>
								</div>

								<div
									class="flex items-center gap-2 text-xs text-gray-600 sm:text-sm dark:text-gray-400"
								>
									<svg
										class="h-3 w-3 sm:h-4 sm:w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
										></path>
									</svg>
									<span class="truncate">User ID: {user.id}</span>
								</div>
							</div>

							<div class="mt-4 sm:mt-0 sm:ml-6">
								<UserApprovalCard {user} />
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<div class="mt-6 text-center text-xs text-gray-500 sm:mt-8 sm:text-sm">
			Showing {data.pendingUsers.length} pending user{data.pendingUsers.length !== 1 ? 's' : ''}
		</div>
	{/if}
</div>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.space-y-3 > * {
		animation: fadeIn 0.3s ease-out;
	}
</style>
