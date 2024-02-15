<script lang="ts">
	import { success, error } from '$lib/toast';

	export let data: PageData;

	let newPassword: string = '';
	async function resetPassword() {
		await data.supabase.auth
			.updateUser({ password: newPassword })
			.then((_) => {
				success('Password updated successfully');
			})
			.catch((err) => {
				error(err.message);
			});
	}
	const whoAmI = data?.session?.user?.email;
</script>

<div class="h-screen flex flex-col items-center place-content-center">
	<input class="text-black dark:text-white" type="password" bind:value={newPassword} />
	<button class="btn" on:click={resetPassword}>Update Password for {whoAmI}</button>
</div>
