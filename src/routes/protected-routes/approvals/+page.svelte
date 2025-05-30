<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { invalidateAll } from '$app/navigation';
	import toast from 'svelte-5-french-toast';
	import { Field, Control, Button } from '$components/ui/form';

	const { data } = $props();

	const form = superForm(data.form, {
		onResult: ({ result }) => {
			if (result.type === 'success' && result.data?.success) {
				toast.success(result.data.message);
				invalidateAll();
			} else if (result.type === 'failure' && result.data?.message) {
				toast.error(result.data.message);
			}
			// Clear processing state after any result
			processingUserId = null;
		}
	});

	const { enhance, form: formData, submit } = form;

	let processingUserId: string | null = $state(null);

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function handleAction(userId: string, action: 'approve' | 'reject') {
		processingUserId = userId;
		// Set form data for submission
		$formData.userId = userId;
		$formData.action = action;
		// Actually submit the form
		submit();
	}
</script>

<div class="x-4 mx-auto max-w-4xl sm:p-6">
	<div class="mb-6 sm:mb-8">
		<h1 class="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">User Approvals</h1>
		<p class="text-sm text-gray-600 sm:text-base">Review and approve pending user registrations</p>
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
			<h3 class="mb-2 text-base font-medium text-gray-900 sm:text-lg">All caught up!</h3>
			<p class="text-sm text-gray-500">No users awaiting approval at this time.</p>
		</div>
	{:else}
		<div class="mb-4 flex items-center justify-between sm:mb-6">
			<div class="flex items-center gap-2">
				<span
					class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800"
				>
					{data.pendingUsers.length} pending
				</span>
			</div>
		</div>

		<div class="space-y-3">
			{#each data.pendingUsers as user}
				<div
					class="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
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
										<h3 class="text-base font-semibold text-gray-900 sm:text-lg">{user.name}</h3>
										<p class="text-xs text-gray-500 sm:text-sm">
											Registered {formatDate(user.created_at)}
										</p>
									</div>
								</div>

								<div class="flex items-center gap-2 text-xs text-gray-600 sm:text-sm">
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
								<form method="POST" use:enhance>
									<Field {form} name="userId">
										<Control>
											<input type="hidden" bind:value={$formData.userId} />
										</Control>
									</Field>

									<Field {form} name="action">
										<Control>
											<input type="hidden" bind:value={$formData.action} />
										</Control>
									</Field>

									<div class="flex w-full gap-2 sm:w-auto">
										<Button
											type="submit"
											onclick={(event: { preventDefault: () => void }) => {
												event.preventDefault();
												handleAction(user.id, 'approve');
											}}
											disabled={$processingUserId === user.id}
											class="flex-1 bg-green-600 text-xs hover:bg-green-700 focus:ring-green-500 sm:flex-initial sm:text-sm"
										>
											{#if $processingUserId === user.id && $formData.action === 'approve'}
												<svg
													class="mr-1 h-3 w-3 animate-spin sm:mr-2 sm:h-4 sm:w-4"
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
												>
													<circle
														class="opacity-25"
														cx="12"
														cy="12"
														r="10"
														stroke="currentColor"
														stroke-width="4"
													></circle>
													<path
														class="opacity-75"
														fill="currentColor"
														d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
													></path>
												</svg>
												<span class="sm:hidden">Approve</span>
												<span class="hidden sm:inline">Approving...</span>
											{:else}
												<svg
													class="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M5 13l4 4L19 7"
													></path>
												</svg>
												Approve
											{/if}
										</Button>

										<Button
											variant="outline"
											type="submit"
											onclick={(event: { preventDefault: () => void }) => {
												event.preventDefault();
												handleAction(user.id, 'reject');
											}}
											disabled={$processingUserId === user.id}
											class="flex-1 border-red-300 text-xs text-red-700 hover:border-red-400 hover:bg-red-50 focus:ring-red-500 sm:flex-initial sm:text-sm"
										>
											{#if $processingUserId === user.id && $formData.action === 'reject'}
												<svg
													class="mr-1 h-3 w-3 animate-spin sm:mr-2 sm:h-4 sm:w-4"
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
												>
													<circle
														class="opacity-25"
														cx="12"
														cy="12"
														r="10"
														stroke="currentColor"
														stroke-width="4"
													></circle>
													<path
														class="opacity-75"
														fill="currentColor"
														d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
													></path>
												</svg>
												<span class="sm:hidden">Reject</span>
												<span class="hidden sm:inline">Rejecting...</span>
											{:else}
												<svg
													class="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M6 18L18 6M6 6l12 12"
													></path>
												</svg>
												Reject
											{/if}
										</Button>
									</div>
								</form>
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
