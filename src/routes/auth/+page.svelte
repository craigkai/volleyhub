<script lang="ts">
	import type { PageData } from '$types';
	import { goto } from '$app/navigation';
	import { Label, Input, Button } from 'flowbite-svelte';

	export let data: PageData;
	let { supabase } = data;

	let email = '';
	let password = '';
	let errorString = '';
	let message = '';
	let method = 'magic';

	const handleSignUp = async () => {
		try {
			const { error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					emailRedirectTo: `${data.url}/auth/callback`
				}
			});
			if (error) throw error;
			message = "We've sent you an email to confirm your account";
		} catch (err) {
			errorString = err.message;
		}
	};

	const handleSignInOtp = async () => {
		if (!email) {
			errorString = 'Please enter your email address.';
			return;
		}
		try {
			const { error } = await supabase.auth.signInWithOtp({
				email,
				options: {
					emailRedirectTo: `${data.url}/auth/callback`
				}
			});
			if (error) throw error;
			message = 'Check your email for the magic link.';
		} catch (err) {
			errorString = err.message;
		}
	};

	const handleForgotPassword = async () => {
		try {
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: `${data.url}/auth/recovery`
			});
			if (error) throw error;
			message = 'Check your email for the password reset link.';
		} catch (err) {
			errorString = err.message;
		}
	};

	const handleSignIn = async () => {
		try {
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password
			});
			if (error) throw error;
			goto('/protected-routes/dashboard');
		} catch (err) {
			errorString = err.message;
		}
	};

	const handleSignOut = async () => {
		try {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
			goto('/');
		} catch (err) {
			errorString = err.message;
		}
	};

	$: method, ((errorString = ''), (message = ''));
</script>

<svelte:head>
	<title>User Auth</title>
</svelte:head>

<div class="flex justify-center items-center min-h-screen">
	<div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
		{#if method === 'magic'}
			<Label for="email" class="text-gray-400">Email Address</Label>
			<Input name="email" class="mb-4 bg-gray-200 border border-2 p-4" bind:value={email} />
			<Button class="w-full p-3 text-white bg-blue-400 hover:bg-blue-600" on:click={handleSignInOtp}
				>Send a magic link</Button
			>
		{:else if method === 'password'}
			<Label for="email" class="text-gray-400">Email Address</Label>
			<Input name="email" id="email" class="mb-4 p-4 bg-gray-200" bind:value={email} />
			<Label for="password" class="text-gray-400">Password</Label>
			<Input
				type="password"
				id="password"
				class="mb-4"
				bind:value={password}
				placeholder="•••••••••"
				required
			/>
			<Button class="w-full text-white bg-blue-400 hover:bg-blue-600 mb-2" on:click={handleSignIn}
				>Sign in</Button
			>
			<Button
				class="w-full text-white bg-blue-400 hover:bg-blue-600"
				on:click={() => (method = 'recovery')}>Forgot your password?</Button
			>
		{:else if method === 'signup'}
			<form on:submit|preventDefault={handleSignUp}>
				<Label for="email" class="text-gray-400">Email Address</Label>
				<Input name="email" id="email" class="mb-4" bind:value={email} />
				<Label for="password" class="text-gray-400">Password</Label>
				<Input
					type="password"
					id="password"
					class="mb-4"
					bind:value={password}
					placeholder="•••••••••"
					required
				/>
				<Button type="submit" class="w-full text-white bg-blue-400 hover:bg-blue-600"
					>Sign up</Button
				>
			</form>
		{:else if method === 'recovery'}
			<Label for="email" class="text-gray-400">Email Address</Label>
			<Input name="email" class="mb-4" bind:value={email} />
			<Button
				class="w-full text-white bg-blue-400 hover:bg-blue-600"
				on:click={handleForgotPassword}>Send reset password instructions</Button
			>
		{/if}
		<Button
			class="w-full text-white bg-blue-400 hover:bg-blue-600 mt-4"
			on:click={() => (method = 'password')}>Already have an account? Sign in</Button
		>
		<Button class="w-full text-white bg-blue-400 hover:bg-blue-600 mt-4" on:click={handleSignOut}
			>Sign out</Button
		>
		{#if message}
			<div class="text-center text-green-500 mt-4">{message}</div>
		{/if}
		{#if errorString}
			<div class="text-center text-red-500 mt-4">{errorString}</div>
		{/if}
	</div>
</div>

<style>
	.text-center {
		text-align: center;
	}
</style>
