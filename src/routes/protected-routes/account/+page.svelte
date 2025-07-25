<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { Field, Label, Control, FieldErrors, Button } from '$components/ui/form';
	import { Input } from '$components/ui/input';
	import toast from 'svelte-5-french-toast';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	let { data } = $props();

	const schema = z.object({
		email: z.string().email(),
		newPassword: z.string().min(6).optional()
	});

	const editForm = superForm(data.form, {
		validators: zod4Client(schema),
		onResult: (e) => {
			if (e.result.status === 200) {
				toast.success('Account updated successfully');
			} else {
				toast.error('Failed to update account');
			}
		}
	});

	const { form: formData, enhance, delayed } = editForm;
</script>

<div class="mx-auto w-full max-w-md">
	<div
		class="rounded-lg border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900"
	>
		<h1 class="mb-6 text-3xl font-semibold text-gray-900 dark:text-white">Edit Account</h1>

		<div class="mb-8 h-px w-full bg-gray-200 dark:bg-gray-700"></div>

		{#if $delayed}
			<div
				class="flex items-center justify-center rounded-lg bg-white py-12 shadow-md dark:bg-gray-800"
			>
				<div
					class="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"
					role="status"
				>
					<span class="sr-only">Loading...</span>
				</div>
			</div>
		{:else}
			<form use:enhance method="POST" action="?/edit" class="space-y-8">
				<Field form={editForm} name="email">
					<Control>
						{#snippet children({ props })}
							<div class="space-y-2">
								<Label class="text-base font-medium text-gray-700 dark:text-gray-300">Email</Label>
								<Input
									type="email"
									{...props}
									bind:value={$formData.email}
									class="h-12 w-full rounded-lg border border-gray-200 px-4 py-3 text-base focus:border-gray-300 focus:ring-0 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-gray-600"
								/>
							</div>
						{/snippet}
					</Control>
				</Field>

				<Field form={editForm} name="newPassword">
					<Control>
						{#snippet children({ props })}
							<div class="space-y-2">
								<Label class="text-base font-medium text-gray-700 dark:text-gray-300"
									>New Password</Label
								>
								<Input
									type="password"
									{...props}
									bind:value={$formData.newPassword}
									class="h-12 w-full rounded-lg border border-gray-200 px-4 py-3 text-base focus:border-gray-300 focus:ring-0 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-gray-600"
								/>
							</div>
						{/snippet}
					</Control>
				</Field>

				<div class="pt-2">
					<Button
						type="submit"
						class="h-12 w-full rounded-lg bg-gray-900 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none dark:bg-gray-700 dark:hover:bg-gray-600"
					>
						Save Changes
					</Button>
				</div>
			</form>
		{/if}
	</div>
</div>

<style>
	:global(.dark) {
		color-scheme: dark;
	}
</style>
