<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { Control, Field, FieldErrors } from 'formsnap';
	import { Label } from '$components/ui/label';
	import { Input } from '$components/ui/input';
	import toast from 'svelte-5-french-toast';
	import { Button } from '$components/ui/button';

	let { data } = $props();

	let authMode = $state('signin');
	$effect(() => {
		const hash = window.location.hash.substring(1);
		const params = new URLSearchParams(hash);
		if (params.get('type') === 'invite') {
			authMode = 'reset';
		}
	});

	let isLoading = $state(false);

	function handleFormResult(e: any, successMessage?: string) {
		if (e.result.status !== 200) {
			const errors = e.result?.data?.form?.errors;
			if (errors) {
				const errorMessages = Object.values(errors).flat();
				toast.error(errorMessages.join(', '));
			} else {
				toast.error('Something went wrong');
			}
		} else if (successMessage) {
			toast.success(successMessage);
		}
	}

	let signupSuccess = $state(false);
	const signupForm = superForm(data?.signupForm || {}, {
		warnings: { duplicateId: false },
		onResult: (e) => handleFormResult(e, 'Sign-up successful. Please check your email.'),
		onUpdated: ({ form }) => {
			if (form.valid) {
				signupSuccess = true;
			}
		}
	});

	const signInForm = superForm(data?.signInForm || {}, {
		warnings: { duplicateId: false },
		onSubmit: () => (isLoading = true),
		onResult: (e) => {
			isLoading = false;
			handleFormResult(e);
		}
	});

	const resetPasswordForm = superForm(data?.resetPasswordForm || {}, {
		warnings: { duplicateId: false },
		onResult: (e) => handleFormResult(e, 'Password reset email sent successfully')
	});

	function switchAuthMode(mode: string) {
		authMode = mode;
	}

	const signupFormData = signupForm.form;
	const signInFormData = signInForm.form;
	const resetPasswordFormData = resetPasswordForm.form;
</script>

<svelte:head>
	<title>User Auth</title>
</svelte:head>

<div class="m-4 flex items-center justify-center rounded bg-gray-100 p-4">
	<div class="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
		<h2 class="text-center text-2xl font-bold text-gray-700 dark:text-gray-200">
			{authMode === 'signup' ? 'Sign Up' : authMode === 'signin' ? 'Sign In' : 'Reset Password'}
		</h2>

		{#if authMode === 'signup'}
			<form method="POST" action="?/signup" use:signupForm.enhance class="space-y-4">
				<div class="space-y-2">
					<Field form={signupForm} name="email">
						<Control>
							{#snippet children({ props })}
								<Label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
									>Email</Label
								>
								<Input
									{...props}
									disabled={signupSuccess}
									bind:value={$signupFormData.email}
									class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
								/>
							{/snippet}
						</Control>

						<FieldErrors class="text-sm text-red-600 dark:text-red-400" />
					</Field>
				</div>
				<div class="space-y-2">
					<Field form={signupForm} name="password">
						<Control>
							{#snippet children({ props })}
								<Label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
									>Password</Label
								>
								<Input
									type="password"
									disabled={signupSuccess}
									{...props}
									bind:value={$signupFormData.password}
									class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
								/>
							{/snippet}
						</Control>

						<FieldErrors class="text-sm text-red-600 dark:text-red-400" />
					</Field>
				</div>

				<Button
					disabled={signupSuccess}
					class="w-full rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
					type="submit">Sign Up</Button
				>
			</form>
		{:else if authMode === 'signin'}
			<form method="POST" action="?/signin" use:signInForm.enhance class="space-y-4">
				<div class="space-y-2">
					<Field form={signInForm} name="email">
						<Control>
							{#snippet children({ props })}
								<Label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
									>Email</Label
								>
								<Input
									{...props}
									bind:value={$signInFormData.email}
									class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
								/>
							{/snippet}
						</Control>

						<FieldErrors class="text-sm text-red-600 dark:text-red-400" />
					</Field>
				</div>
				<div class="space-y-2">
					<Field form={signInForm} name="password">
						<Control>
							{#snippet children({ props })}
								<Label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
									>Password</Label
								>
								<Input
									type="password"
									{...props}
									bind:value={$signInFormData.password}
									class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
								/>
							{/snippet}
						</Control>

						<FieldErrors class="text-sm text-red-600 dark:text-red-400" />
					</Field>
				</div>

				<Button
					class="w-full rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
					type="submit"
					disabled={isLoading}
				>
					{isLoading ? 'Signing In...' : 'Sign In'}
				</Button>
			</form>
		{:else if authMode === 'reset'}
			<form use:resetPasswordForm.enhance action="?/resetpassword" method="POST" class="space-y-4">
				<div class="space-y-2">
					<Field form={resetPasswordForm} name="email">
						<Control>
							{#snippet children({ props })}
								<Label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
									>Email</Label
								>
								<Input
									{...props}
									bind:value={$resetPasswordFormData.email}
									class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
								/>
							{/snippet}
						</Control>

						<FieldErrors class="text-sm text-red-600 dark:text-red-400" />
					</Field>
				</div>
				<Button
					class="w-full rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
					type="submit">Reset Password</Button
				>
			</form>
		{/if}

		<!-- Auth mode navigation Buttons -->
		<div class="mt-6 space-y-3">
			{#if authMode !== 'signin' && authMode !== 'signup'}
				<Button
					class="w-full rounded-md bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
					onclick={() => switchAuthMode('signin')}>Back to Sign In</Button
				>
			{:else}
				<Button
					class="w-full rounded-md bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
					onclick={() => switchAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
				>
					{authMode === 'signin' ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
				</Button>
				<Button
					class="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
					onclick={() => switchAuthMode('reset')}>Forgot Password?</Button
				>
			{/if}
		</div>
	</div>
</div>
