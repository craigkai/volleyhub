<script lang="ts">
	import type { PageData } from '$types';
	import { goto } from '$app/navigation';
	import { Label } from '$components/ui/label/index.js';
	import { Input } from '$components/ui/input/index.js';
	import { Button } from '$components/ui/button/index.js';

	export let data: PageData;
	let { supabase } = data;

	let email = '';
	let password = '';
	let errorString = '';
	let message = '';
	let method = 'magic';

	const handleSignInOtp = async () => {
		if (!email) {
			errorString = 'Please enter your email address.';
			return;
		}
		try {
			const { error } = await supabase.auth.signInWithOtp({
				email,
				options: {
					emailRedirectTo: `${data.url}/auth/confirm`
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

	$: method, ((errorString = ''), (message = ''));
</script>

<svelte:head>
	<title>User Auth</title>
</svelte:head>

<div class="flex items-center justify-center bg-gray-100">
	<div class="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
		<h2 class="text-center text-2xl font-bold text-gray-700 dark:text-gray-200">
			User Authentication
		</h2>
		{#if method === 'magic'}
			<div class="space-y-4">
				<Label for="email" class="text-gray-700 dark:text-gray-400">Email Address</Label>
				<Input
					name="email"
					class="w-full rounded-md border border-gray-300 bg-gray-200 px-4 py-2 text-gray-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
					bind:value={email}
				/>
				<Button
					class="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
					on:click={handleSignInOtp}>Send Magic Link</Button
				>
			</div>
		{:else if method === 'password'}
			<div class="space-y-4">
				<Label for="email" class="text-gray-700 dark:text-gray-400">Email Address</Label>
				<Input
					name="email"
					id="email"
					class="w-full rounded-md border border-gray-300 bg-gray-200 px-4 py-2 text-gray-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
					bind:value={email}
				/>
				<Label for="password" class="text-gray-700 dark:text-gray-400">Password</Label>
				<Input
					type="password"
					id="password"
					class="w-full rounded-md border border-gray-300 bg-gray-200 px-4 py-2 text-gray-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
					bind:value={password}
					placeholder="•••••••••"
					required
				/>
				<Button
					class="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
					on:click={handleSignIn}>Sign In</Button
				>
				<Button
					class="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
					on:click={() => (method = 'recovery')}>Forgot your password?</Button
				>
			</div>
		{:else if method === 'recovery'}
			<div class="space-y-4">
				<Label for="email" class="text-gray-700 dark:text-gray-400">Email Address</Label>
				<Input
					name="email"
					class="w-full rounded-md border border-gray-300 bg-gray-200 px-4 py-2 text-gray-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
					bind:value={email}
				/>
				<Button
					class="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
					on:click={handleForgotPassword}>Send Reset Password Instructions</Button
				>
			</div>
		{/if}
		<div class="space-y-4">
			<Button
				class="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
				on:click={() => (method = 'password')}>Already have an account? Sign In With Email</Button
			>
		</div>
		{#if message}
			<div class="mt-4 text-center text-green-500">{message}</div>
		{/if}
		{#if errorString}
			<div class="mt-4 text-center text-red-500">{errorString}</div>
		{/if}
	</div>
</div>

<style>
	.text-center {
		text-align: center;
	}
</style>
