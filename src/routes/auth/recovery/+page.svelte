<script lang="ts">
	import { goto } from '$app/navigation';
	import toast from 'svelte-5-french-toast';
	import { Label } from '$components/ui/label/index.js';
	import { Input } from '$components/ui/input/index.js';
	import { Button } from '$components/ui/button/index.js';
	import { onMount } from 'svelte';

	let { data } = $props();
	interface User {
		email?: string;
		// Add other properties if needed
	}

	let user: User = {};
	let whoAmI = $state('');

	onMount(async () => {
		const hash = window.location.hash.substring(1); // Remove the '#'
		const params = new URLSearchParams(hash);
		const type = params.get('type');
		const accessToken = params.get('access_token');

		if (accessToken && type === 'recovery') {
			// Authenticate the user with Supabase using the access token
			const response = await data.supabase.auth.setSession({
				access_token: accessToken,
				refresh_token: params.get('refresh_token') || '' // Optional, if available
			});

			if (response.data.user) {
				user = response.data.user;

				whoAmI = user.email || 'your account';
			}
		}
	});

	let newPassword: string = $state('');
	async function resetPassword() {
		try {
			const { data: userData, error } = await data.supabase.auth.updateUser({
				password: newPassword
			});

			if (error) {
				throw error;
			}

			toast.success('Password updated successfully');
			goto('/protected-routes/dashboard');
		} catch (err) {
			toast.error(err.message || 'Failed to update password');
		}
	}
</script>

<div class="row flex-center flex justify-center">
	<div class="col-6 form-widget flex flex-col">
		<Label for="password" class="mb-2 block">New Password</Label>
		<Input
			type="password"
			bind:value={newPassword}
			id="password"
			placeholder="•••••••••"
			required
		/>

		<Button class="m-2 text-gray-400" on:click={resetPassword}>Update Password for {whoAmI}</Button>
	</div>
</div>
