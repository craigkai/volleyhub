<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { invalidateAll } from '$app/navigation';
	import toast from 'svelte-5-french-toast';
	import { Field, Control, Button } from '$components/ui/form';

	let { user } = $props();

	const approveForm = superForm(
		{ userId: user.id, action: 'approve' },
		{
			id: `${user.id}-approve`,
			onResult: ({ result }) => {
				if (result.type === 'success' && result.data?.success) {
					toast.success(result.data.message);
					invalidateAll();
				}
			}
		}
	);

	const rejectForm = superForm(
		{ userId: user.id, action: 'reject' },
		{
			id: `${user.id}-reject`,
			onResult: ({ result }) => {
				if (result.type === 'success' && result.data?.success) {
					toast.success(result.data.message);
					invalidateAll();
				} else {
					toast.error(result.data?.message || 'An error occurred while rejecting the user.');
				}
			}
		}
	);

	const { enhance: approveEnhance } = approveForm;
	const { enhance: rejectEnhance } = rejectForm;
</script>

<div class="flex flex-col gap-2 sm:flex-row">
	<form method="POST" use:approveEnhance action="?/approve" class="w-full sm:w-auto">
		<Field form={approveForm} name="userId">
			<Control>
				{#snippet children({ props })}
					<input {...props} value={user.id} type="hidden" />
				{/snippet}
			</Control>
		</Field>
		<Button
			type="submit"
			class="w-full bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
		>
			<svg class="mr-1.5 h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
				></path>
			</svg>
			Approve
		</Button>
	</form>

	<form method="POST" use:rejectEnhance class="w-full sm:w-auto" action="?/reject">
		<Field form={rejectForm} name="userId">
			<Control>
				{#snippet children({ props })}
					<input {...props} value={user.id} type="hidden" />
				{/snippet}
			</Control>
		</Field>
		<Button
			type="submit"
			variant="outline"
			class="w-full border-red-300 px-4 py-2 text-sm text-red-700 hover:border-red-400 hover:bg-red-50"
		>
			<svg class="mr-1.5 h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				></path>
			</svg>
			Reject
		</Button>
	</form>
</div>
