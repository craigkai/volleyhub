<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { invalidateAll } from '$app/navigation';
	import toast from 'svelte-5-french-toast';
	import { Field, Label, Control, Button } from '$components/ui/form';

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

	const { enhance, form: formData } = form;

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
	}
</script>

<div class="mx-auto max-w-4xl p-6">
	<div class="mb-8">
		<h1 class="mb-2 text-3xl font-bold text-gray-900">User Approvals</h1>
		<p class="text-gray-600">Review and approve pending user registrations</p>
	</div>

	{#if !data.pendingUsers || data.pendingUsers.length === 0}
		<div class="py-12 text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
			>
				<svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
					></path>
				</svg>
			</div>
			<h3 class="mb-2 text-lg font-medium text-gray-900">All caught up!</h3>
			<p class="text-gray-500">No users awaiting approval at this time.</p>
		</div>
	{:else}
		<div class="mb-6 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span
					class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800"
				>
					{data.pendingUsers.length} pending
				</span>
			</div>
		</div>

		<div class="space-y-4">
			{#each data.pendingUsers as user}
				<div
					class="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
				>
					<div class="p-6">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="mb-3 flex items-center gap-3">
									<div
										class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white"
									>
										{user.name
											.split(' ')
											.map((n: any) => n[0])
											.join('')
											.toUpperCase()}
									</div>
									<div>
										<h3 class="text-lg font-semibold text-gray-900">{user.name}</h3>
										<p class="text-sm text-gray-500">Registered {formatDate(user.created_at)}</p>
									</div>
								</div>

								<div class="flex items-center gap-2 text-sm text-gray-600">
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
										></path>
									</svg>
									<span>User ID: {user.id}</span>
								</div>
							</div>

							<div class="ml-6 flex items-center gap-3">
								<form method="POST" use:enhance>
									<Field {form} name="userId">
										<Control>
											{#snippet children({ props })}
												<input {...props} type="hidden" bind:value={$formData.userId} />
											{/snippet}
										</Control>
									</Field>

									<Field {form} name="action">
										<Control>
											{#snippet children({ props })}
												<input {...props} type="hidden" bind:value={$formData.action} />
											{/snippet}
										</Control>
									</Field>

									<div class="flex gap-2">
										<Button
											type="submit"
											onclick={() => handleAction(user.id, 'approve')}
											disabled={processingUserId === user.id}
											class="bg-green-600 hover:bg-green-700 focus:ring-green-500"
										>
											{#if processingUserId === user.id && $formData.action === 'approve'}
												<svg
													class="mr-2 h-4 w-4 animate-spin"
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
												Approving...
											{:else}
												<svg
													class="mr-2 h-4 w-4"
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
											onclick={() => handleAction(user.id, 'reject')}
											disabled={processingUserId === user.id}
											class="border-red-300 text-red-700 hover:border-red-400 hover:bg-red-50 focus:ring-red-500"
										>
											{#if processingUserId === user.id && $formData.action === 'reject'}
												<svg
													class="mr-2 h-4 w-4 animate-spin"
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
												Rejecting...
											{:else}
												<svg
													class="mr-2 h-4 w-4"
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

		<div class="mt-8 text-center text-sm text-gray-500">
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

	.space-y-4 > * {
		animation: fadeIn 0.3s ease-out;
	}
</style>
