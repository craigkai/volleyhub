<script lang="ts">
	import type { PageData } from '$types';
	import { goto } from '$app/navigation';

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
</script>

<svelte:head>
	<title>User Management</title>
</svelte:head>

<div class="row flex-center flex justify-center">
	<div class="col-6 form-widget">
		{#if method == 'magic'}
			<input name="email" bind:value={email} />
			<button on:click={handleSignInOtp}>Send a magic link</button>
		{:else if method == 'password'}
			<input name="email" bind:value={email} />
			<input type="password" name="password" bind:value={password} />
			<button on:click={handleSignIn}>Sign in</button>
			<button on:click={() => (method = 'recovery')}>Forgot your password?</button>
		{:else if method == 'signup'}
			<form on:submit={handleSignUp}>
				<input name="email" bind:value={email} />
				<input type="password" name="password" bind:value={password} />
				<button>Sign up</button>
			</form>
		{:else if method == 'recovery'}
			<input name="email" bind:value={email} />
			<button on:click={handleForgotPassword}>Send reset password instructions</button>
		{/if}

		<button on:click={() => (method = 'password')}>Already have an account? Sign in</button>
		<button on:click={handleSignOut}>Sign out</button>
	</div>
</div>

{#if message}
	<span>{message}</span>
{/if}

{#if errorString}
	<span class="danger">
		{errorString}
	</span>
{/if}

<style>
	.danger {
		color: rgba(245, 101, 101);
	}
</style>
