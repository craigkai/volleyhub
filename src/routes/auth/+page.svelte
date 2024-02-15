<script lang="ts">
	import type { PageData } from '$types';
	import { Auth } from '@supabase/auth-ui-svelte';
	import { ThemeSupa } from '@supabase/auth-ui-shared';

	export let data: PageData;

	let email: string = '';
	let password: string = '';
	async function resetPassword() {
		const { error } = await data.supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${data.url}/update-password`
		});

		console.log(error);
	}
</script>

<svelte:head>
	<title>User Management</title>
</svelte:head>

<div class="row flex-center flex justify-center">
	<div class="col-6 form-widget">
		<Auth
			supabaseClient={data.supabase}
			view="magic_link"
			showLinks={true}
			appearance={{ theme: ThemeSupa, style: { input: 'color: black' } }}
		/>
	</div>
</div>
