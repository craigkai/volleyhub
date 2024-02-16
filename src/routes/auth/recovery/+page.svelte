<script lang="ts">
	import { goto } from '$app/navigation';
	import { success, error } from '$lib/toast';
	import { Label, Input, Button } from 'flowbite-svelte';

	export let data: PageData;

	let newPassword: string = '';
	async function resetPassword() {
		await data.supabase.auth
			.updateUser({ password: newPassword })
			.then((_) => {
				success('Password updated successfully');
				goto('/protected-routes/dashboard');
			})
			.catch((err) => {
				error(err.message);
			});
	}
	const whoAmI = data?.session?.user?.email;
</script>

<div class="row flex-center flex justify-center">
	<div class="col-6 form-widget flex flex-col">
		<Label for="password" class="block mb-2">New Password</Label>
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
