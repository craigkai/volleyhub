<script lang="ts">
	import { superForm, type SuperForm } from 'sveltekit-superforms';
	import { Control, Field, FieldErrors } from 'formsnap';
	import { Label } from '$components/ui/label';
	import { Input } from '$components/ui/input';
	import toast from 'svelte-french-toast';

	let { data } = $props();

	let authMode: string | null = $state('signin');
	$effect(() => {
		// Get the URL hash (fragment part)
		const hash = window.location.hash.substring(1); // remove the '#' from the start

		// Create a URLSearchParams object to easily access the parameters
		const params = new URLSearchParams(hash);

		// Extract the `type` parameter
		const type = params.get('type');
		if (type && type === 'invite') {
			authMode = 'reset';
		}
	});

	const {
		form: signupForm,
		enhance: signupEnhance,
		errors: signupErrors,
		message: signupMessages
	}: SuperForm<{ email: string; password: string }> = superForm(data.signupForm, {
		warnings: {
			duplicateId: false
		}
	});

	const {
		form: signInForm,
		enhance: signInEnhance,
		errors: signInErrors,
		message: signInMessages
	}: SuperForm<{ email: string; password: string }> = superForm(data.signInForm, {
		warnings: {
			duplicateId: false
		}
	});

	const {
		form: resetPasswordForm,
		enhance: resetPasswordEnhance,
		errors: resetPasswordErrors,
		message: resetPasswordMessages
	}: SuperForm<{ email: string }> = superForm(data.resetPasswordForm, {
		warnings: {
			duplicateId: false
		}
	});

	$effect(() => {
		[$signupErrors, $signInErrors, $resetPasswordErrors].forEach((error) => {
			for (const key in error) {
				if (error[key]) {
					for (const message of $state.snapshot(error[key])) {
						toast.error(message);
					}
				}
			}
		});
	});

	$effect(() => {
		[$signupMessages, $signInMessages, $resetPasswordMessages].forEach((message) => {
			if (message) {
				toast.success(message);
			}
		});
	});
</script>

<svelte:head>
	<title>User Auth</title>
</svelte:head>

<div class="m-4 flex items-center justify-center rounded bg-gray-100 p-2">
	<div class="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
		<h2 class="text-center text-2xl font-bold text-gray-700 dark:text-gray-200">
			{authMode === 'signup' ? 'Sign Up' : 'User Authentication'}
		</h2>

		{#if authMode === 'signup'}
			<form method="POST" action="?/signup" use:signupEnhance>
				<div class="form-field">
					<Field form={signupForm} name="email">
						<Control let:attrs>
							<Label class="form-label dark:text-gray-300">Email</Label>
							<Input
								{...attrs}
								bind:value={signupForm.email}
								class="dark:bg-gray-700 dark:text-gray-200"
							/>
						</Control>

						<FieldErrors class="form-errors dark:text-red-400" />
					</Field>
				</div>
				<div class="form-field">
					<Field form={signupForm} name="password">
						<Control let:attrs>
							<Label class="form-label dark:text-gray-300">Password</Label>
							<Input
								type="password"
								{...attrs}
								bind:value={signupForm.password}
								class="dark:bg-gray-700 dark:text-gray-200"
							/>
						</Control>

						<FieldErrors class="form-errors dark:text-red-400" />
					</Field>
				</div>

				<button
					class="mt-2 w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
					type="submit">Sign Up</button
				>
			</form>
		{:else if authMode === 'signin'}
			<form method="POST" action="?/signin" use:signInEnhance>
				<div class="form-field">
					<Field form={signInForm} name="email">
						<Control let:attrs>
							<Label class="form-label dark:text-gray-300">Email</Label>
							<Input
								{...attrs}
								bind:value={signInForm.email}
								class="dark:bg-gray-700 dark:text-gray-200"
							/>
						</Control>

						<FieldErrors class="form-errors dark:text-red-400" />
					</Field>
				</div>
				<div class="form-field">
					<Field form={signInForm} name="password">
						<Control let:attrs>
							<Label class="form-label dark:text-gray-300">Password</Label>
							<Input
								type="password"
								{...attrs}
								bind:value={signInForm.password}
								class="dark:bg-gray-700 dark:text-gray-200"
							/>
						</Control>

						<FieldErrors class="form-errors dark:text-red-400" />
					</Field>
				</div>
				<button
					class="mt-2 w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
					type="submit">Sign In</button
				>
			</form>
		{:else if authMode === 'reset'}
			<form use:resetPasswordEnhance action="?/resetpassword" method="POST">
				<div class="form-field">
					<Field form={resetPasswordForm} name="email">
						<Control let:attrs>
							<Label class="form-label dark:text-gray-300">Email</Label>
							<Input
								{...attrs}
								bind:value={resetPasswordForm.email}
								class="dark:bg-gray-700 dark:text-gray-200"
							/>
						</Control>

						<FieldErrors class="form-errors dark:text-red-400" />
					</Field>
				</div>
				<button
					class="mt-2 w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
					type="submit">Reset Password</button
				>
			</form>
		{/if}

		<!-- Switch between sign-up, sign-in, and password reset -->
		<button
			class="mt-2 w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
			onclick={() => (authMode = authMode === 'signin' ? 'signup' : 'signin')}
		>
			{authMode === 'signin' ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
		</button>
		<button
			class="mt-2 w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
			onclick={() => (authMode = 'reset')}>Forgot Password?</button
		>
	</div>
</div>
