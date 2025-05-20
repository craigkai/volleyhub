<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { Field, Control, FieldErrors } from 'formsnap';
	import { Label } from '$components/ui/label';
	import { Input } from '$components/ui/input';
	import { Button } from '$components/ui/button';
	import toast from 'svelte-5-french-toast';

	let { data } = $props();

	const editForm = superForm(data.editForm, {
		onResult: (e) => {
			if (e.result.status === 200) {
				toast.success('Account updated successfully');
			} else {
				toast.error('Failed to update account');
			}
		}
	});

	const formData = editForm.form;
</script>

<div class="mx-auto w-full max-w-md p-6">
	<div
		class="rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800"
	>
		<h2
			class="mb-6 border-b border-gray-200 pb-2 text-2xl font-bold text-gray-900 dark:border-gray-700 dark:text-white"
		>
			Edit Account
		</h2>

		<form use:editForm.enhance method="POST" action="?/edit" class="space-y-6">
			<Field form={editForm} name="email">
				<Control>
					{#snippet children({ props })}
						<div class="space-y-2">
							<Label class="text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
							<Input
								type="email"
								{...props}
								bind:value={$formData.email}
								class="focus:ring-primary-500 focus:border-primary-500 w-full rounded-md border border-gray-300 px-3 py-2 transition-colors focus:ring-2 dark:border-gray-600"
							/>
						</div>
					{/snippet}
				</Control>
				<FieldErrors class="mt-1 text-sm text-red-500" />
			</Field>

			<Field form={editForm} name="newPassword">
				<Control>
					{#snippet children({ props })}
						<div class="space-y-2">
							<Label class="text-sm font-medium text-gray-700 dark:text-gray-300"
								>New Password</Label
							>
							<Input
								type="password"
								{...props}
								bind:value={$formData.newPassword}
								class="focus:ring-primary-500 focus:border-primary-500 w-full rounded-md border border-gray-300 px-3 py-2 transition-colors focus:ring-2 dark:border-gray-600"
							/>
						</div>
					{/snippet}
				</Control>
				<FieldErrors class="mt-1 text-sm text-red-500" />
			</Field>

			<div class="pt-2">
				<Button
					type="submit"
					class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 w-full rounded-md px-4 py-2.5 font-medium text-white shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
				>
					Save Changes
				</Button>
			</div>
		</form>
	</div>
</div>

<style>
	:global(.dark) {
		color-scheme: dark;
	}
</style>
