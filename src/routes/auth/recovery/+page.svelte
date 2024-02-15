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

<input type="password" bind:value={newPassword} />
<button on:click={resetPassword}>Update Password for {whoAmI}</button>
