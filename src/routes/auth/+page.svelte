<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { Field, Label, Control, Button } from '$components/ui/form';
	import { Input } from '$components/ui/input';
	import * as Card from '$components/ui/card';
	import { Badge } from '$components/ui/badge';
	import toast from 'svelte-5-french-toast';
	import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-svelte';

	let { data } = $props();

	let authMode = $state('signin');
	let showPassword = $state(false);

	$effect(() => {
		const hash = window.location.hash.substring(1);
		const params = new URLSearchParams(hash);
		if (params.get('type') === 'invite') {
			authMode = 'reset';
		}
	});

	let isLoading = $state(false);

	function handleFormResult(e: any, successMessage?: string) {
		if (e.result.status !== 200 && e.result.status !== 303) {
			const errors = e.result?.data?.form?.errors;
			if (errors) {
				const errorMessages = Object.values(errors).flat();
				toast.error(errorMessages.join(', '));
			} else {
				console.error(e.result);
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

	const magicLinkForm = superForm(data?.magicLinkForm || {}, {
		warnings: { duplicateId: false },
		onResult: (e) => handleFormResult(e, 'Magic link email sent successfully')
	});

	function switchAuthMode(mode: string) {
		authMode = mode;
		showPassword = false;
	}

	const signupFormData = signupForm.form;
	const signInFormData = signInForm.form;
	const magicLinkFormData = magicLinkForm.form;

	const authConfig = $derived.by(() => {
		switch (authMode) {
			case 'signup':
				return {
					title: 'Create Account',
					subtitle: 'Join us today and get started',
					badge: 'Sign Up',
					color: 'from-emerald-500 to-teal-500'
				};
			case 'reset':
				return {
					title: 'Reset Password',
					subtitle: 'Enter your email to receive a magic link',
					badge: 'Password Reset',
					color: 'from-purple-500 to-pink-500'
				};
			default:
				return {
					title: 'Welcome Back',
					subtitle: 'Sign in to your account to continue',
					badge: 'Sign In',
					color: 'from-blue-500 to-cyan-500'
				};
		}
	});
</script>

<svelte:head>
	<title>User Auth</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 dark:from-gray-900 dark:to-gray-800"
>
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<div class="relative mb-4 inline-flex items-center justify-center">
				<div
					class="absolute inset-0 bg-gradient-to-r {authConfig.color} scale-110 animate-pulse rounded-full opacity-20"
				></div>
				<div
					class="relative rounded-full border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800"
				>
					{#if authMode === 'signup'}
						<User class="h-8 w-8 text-emerald-500" />
					{:else if authMode === 'reset'}
						<Mail class="h-8 w-8 text-purple-500" />
					{:else}
						<Lock class="h-8 w-8 text-blue-500" />
					{/if}
				</div>
			</div>

			<Badge
				variant="secondary"
				class="mb-3 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
			>
				{authConfig.badge}
			</Badge>

			<h1 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
				{authConfig.title}
			</h1>
			<p class="text-gray-600 dark:text-gray-400">
				{authConfig.subtitle}
			</p>
		</div>

		<Card.Root class="border-0 bg-white/80 shadow-xl backdrop-blur-sm dark:bg-gray-800/80">
			<Card.Content class="p-8">
				{#if authMode === 'signup'}
					<form method="POST" action="?/signup" use:signupForm.enhance class="space-y-6">
						<div class="space-y-4">
							<Field form={signupForm} name="email">
								<Control>
									{#snippet children({ props })}
										<Label class="text-sm font-medium text-gray-700 dark:text-gray-300">
											Email Address
										</Label>
										<div class="relative mt-2">
											<Mail
												class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400"
											/>
											<Input
												{...props}
												disabled={signupSuccess}
												bind:value={$signupFormData.email}
												class="h-12 border-gray-300 pl-10 focus:border-emerald-500 focus:ring-emerald-500 dark:border-gray-600"
												placeholder="Enter your email"
											/>
										</div>
									{/snippet}
								</Control>
							</Field>

							<Field form={signupForm} name="password">
								<Control>
									{#snippet children({ props })}
										<Label class="text-sm font-medium text-gray-700 dark:text-gray-300">
											Password
										</Label>
										<div class="relative mt-2">
											<Lock
												class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400"
											/>
											<Input
												type={showPassword ? 'text' : 'password'}
												disabled={signupSuccess}
												{...props}
												bind:value={$signupFormData.password}
												class="h-12 border-gray-300 pr-10 pl-10 focus:border-emerald-500 focus:ring-emerald-500 dark:border-gray-600"
												placeholder="Create a password"
											/>
											<button
												type="button"
												class="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
												onclick={() => (showPassword = !showPassword)}
											>
												{#if showPassword}
													<EyeOff class="h-5 w-5" />
												{:else}
													<Eye class="h-5 w-5" />
												{/if}
											</button>
										</div>
									{/snippet}
								</Control>
							</Field>
						</div>

						<Button
							disabled={signupSuccess}
							class="group h-12 w-full bg-gradient-to-r from-emerald-500 to-teal-500 font-semibold text-white shadow-lg transition-all duration-200 hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl"
							type="submit"
						>
							<span>Create Account</span>
							<ArrowRight class="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
						</Button>
					</form>
				{:else if authMode === 'signin'}
					<form method="POST" action="?/signin" use:signInForm.enhance class="space-y-6">
						<div class="space-y-4">
							<Field form={signInForm} name="email">
								<Control>
									{#snippet children({ props })}
										<Label class="text-sm font-medium text-gray-700 dark:text-gray-300">
											Email Address
										</Label>
										<div class="relative mt-2">
											<Mail
												class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400"
											/>
											<Input
												{...props}
												bind:value={$signInFormData.email}
												class="h-12 border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600"
												placeholder="Enter your email"
											/>
										</div>
									{/snippet}
								</Control>
							</Field>

							<Field form={signInForm} name="password">
								<Control>
									{#snippet children({ props })}
										<Label class="text-sm font-medium text-gray-700 dark:text-gray-300">
											Password
										</Label>
										<div class="relative mt-2">
											<Lock
												class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400"
											/>
											<Input
												type={showPassword ? 'text' : 'password'}
												{...props}
												bind:value={$signInFormData.password}
												class="h-12 border-gray-300 pr-10 pl-10 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600"
												placeholder="Enter your password"
											/>
											<button
												type="button"
												class="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
												onclick={() => (showPassword = !showPassword)}
											>
												{#if showPassword}
													<EyeOff class="h-5 w-5" />
												{:else}
													<Eye class="h-5 w-5" />
												{/if}
											</button>
										</div>
									{/snippet}
								</Control>
							</Field>
						</div>

						<Button
							class="group h-12 w-full bg-gradient-to-r from-blue-500 to-cyan-500 font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-cyan-600 hover:shadow-xl"
							type="submit"
							disabled={isLoading}
						>
							{#if isLoading}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								<span>Signing In...</span>
							{:else}
								<span>Sign In</span>
								<ArrowRight class="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
							{/if}
						</Button>
					</form>
				{:else if authMode === 'reset'}
					<form method="POST" action="?/magic" use:magicLinkForm.enhance class="space-y-6">
						<Field form={magicLinkForm} name="email">
							<Control>
								{#snippet children({ props })}
									<Label class="text-sm font-medium text-gray-700 dark:text-gray-300">
										Email Address
									</Label>
									<div class="relative mt-2">
										<Mail
											class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400"
										/>
										<Input
											type="email"
											{...props}
											bind:value={$magicLinkFormData.email}
											class="h-12 border-gray-300 pl-10 focus:border-purple-500 focus:ring-purple-500 dark:border-gray-600"
											placeholder="Enter your email"
										/>
									</div>
								{/snippet}
							</Control>
						</Field>

						<Button
							type="submit"
							class="group h-12 w-full bg-gradient-to-r from-purple-500 to-pink-500 font-semibold text-white shadow-lg transition-all duration-200 hover:from-purple-600 hover:to-pink-600 hover:shadow-xl"
						>
							<span>Send Magic Link</span>
							<ArrowRight class="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
						</Button>
					</form>
				{/if}
			</Card.Content>
		</Card.Root>

		<div class="mt-6 space-y-3">
			{#if authMode !== 'signin' && authMode !== 'signup'}
				<Button
					variant="outline"
					class="h-11 w-full border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
					onclick={() => switchAuthMode('signin')}
				>
					Back to Sign In
				</Button>
			{:else}
				<Button
					variant="outline"
					class="h-11 w-full border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
					onclick={() => switchAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
				>
					{authMode === 'signin' ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
				</Button>

				<Button
					variant="ghost"
					class="h-11 w-full text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
					onclick={() => switchAuthMode('reset')}
				>
					Forgot Password?
				</Button>
			{/if}
		</div>

		<div class="mt-8 text-center">
			<p class="text-sm text-gray-500 dark:text-gray-400">
				Need help?
				<a
					href="/support"
					class="font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
				>
					Contact Support
				</a>
			</p>
		</div>
	</div>
</div>
