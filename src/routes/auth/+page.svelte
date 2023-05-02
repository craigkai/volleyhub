<script lang="ts">
	import { Auth } from '@supabase/auth-ui-svelte';
	import { ThemeSupa } from '@supabase/auth-ui-shared';
	import { dev } from '$app/environment';

	export let data: PageData;
</script>

<svelte:head>
	<title>User Management</title>
</svelte:head>

Using {data.url}

<div class="row flex-center flex justify-center">
	<div class="col-6 form-widget">
		<Auth
			supabaseClient={data.supabase}
			view="magic_link"
			redirectTo={`${data.url}/logging-in?redirect=/`}
			showLinks={false}
			appearance={{ theme: ThemeSupa, style: { input: 'color: black' } }}
		/>
	</div>
</div>
