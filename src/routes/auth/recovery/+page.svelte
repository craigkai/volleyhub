<script lang="ts">
	import { goto } from '$app/navigation';
	import toast from 'svelte-french-toast';
	import { Label } from '$components/ui/label/index.js';
	import { Input } from '$components/ui/input/index.js';
	import { Button } from '$components/ui/button/index.js';
	import type { PageData } from '$types';

	export let data: PageData;

	let newPassword: string = '';
	async function resetPassword() {
		await data.supabase.auth
			.updateUser({ password: newPassword })
			.then((_) => {
				toast.success('Password updated successfully');
				goto('/protected-routes/dashboard');
			})
			.catch((err) => {
				toast.error(err.message);
			});
	}
	const whoAmI = data?.user?.email;
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
