<script lang="ts">
	import type { PageData } from '$types';
	import { goto } from '$app/navigation';
	import { Label, Input, Button } from 'flowbite-svelte';

	export let data: PageData;
	let { supabase } = data;
	$: ({ supabase } = data);

	let email: string;
	let password: string;
	let errorString = '',
		message = '';

	const handleSignUp = async () => {
		const { error: err } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${location.origin}/auth/callback`
			}
		});
		if (err) errorString = err.message;
		else message = "We've sent you an email to confirm your account";
	};

	const handleSignInOtp = async () => {
		if (!email) {
			return (errorString = 'Please enter your email address.');
		}
		const { error: err } = await supabase.auth.signInWithOtp({
			email: email,
			options: {
				emailRedirectTo: `${data.url}/auth/callback`
			}
		});
		if (err) errorString = err.message;
		else message = 'Check your email for the magic link.';
	};

	const handleForgotPassword = async () => {
		const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${data.url}/auth/recovery`
		});
		if (err) errorString = err.message;
		else message = 'Check your email for the password reset link.';
	};

	const handleSignIn = async () => {
		const { error: err } = await supabase.auth.signInWithPassword({
			email,
			password
		});
		if (err) errorString = err.message;
		else goto('/protected-routes/dashboard');
	};

	const handleSignOut = async () => {
		const { error: err } = await supabase.auth.signOut();
		if (err) errorString = err.message;
		else goto('/');
	};

	let method = 'magic';
	$: method, ((errorString = ''), (message = ''));
</script>

<svelte:head>
	<title>User Auth</title>
</svelte:head>

<div class="row flex-center flex justify-center">
	<div class="col-6 form-widget flex flex-col">
		{#if method == 'magic'}
			<Label for="email" class="block m-2 text-gray-400">Email Address</Label>
			<Input name="email" class="m-2 text-gray-400" bind:value={email} />
			<Button class="m-2 text-gray-400" on:click={handleSignInOtp}>Send a magic link</Button>
		{:else if method == 'password'}
			<Label for="email" class="block mb-2 text-gray-400">Email Address</Label>
			<Input name="email" bind:value={email} />

			<Label for="password" class="block mb-2">Password</Label>
			<Input type="password" bind:value={password} id="password" placeholder="•••••••••" required />

			<Button class="m-2 text-gray-400" on:click={handleSignIn}>Sign in</Button>
			<Button class="m-2 text-gray-400" on:click={() => (method = 'recovery')}
				>Forgot your password?</Button
			>
		{:else if method == 'signup'}
			<form on:submit={handleSignUp}>
				<Label for="email" class="block mb-2 text-gray-400">Email Address</Label>
				<Input name="email" bind:value={email} />
				<Input
					type="password"
					bind:value={password}
					id="password"
					placeholder="•••••••••"
					required
				/>
				<Button class="text-gray-400 m-2" on:click={handleSignUp}>Sign up</Button>
			</form>
		{:else if method == 'recovery'}
			<Label for="email" class="block mb-2 text-gray-400">Email Address</Label>
			<Input name="email" bind:value={email} />

			<Button class="m-2 text-gray-400" on:click={handleForgotPassword}
				>Send reset password instructions</Button
			>
		{/if}

		<Button class="m-2 text-gray-400" on:click={() => (method = 'password')}
			>Already have an account? Sign in</Button
		>
		<Button class="m-2 text-gray-400" on:click={handleSignOut}>Sign out</Button>

		<div class="text-center">
			{#if message}
				<span>{message}</span>
			{/if}

			{#if errorString}
				<span class="danger">
					{errorString}
				</span>
			{/if}
		</div>
	</div>
</div>

<style>
	.danger {
		color: rgba(245, 101, 101);
	}
</style>
