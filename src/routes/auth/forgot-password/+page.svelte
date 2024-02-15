<script lang="ts">
	import { enhance } from '$app/forms';
	export let form;
</script>

<div class="w-[512px] p-2 flex flex-col gap-2">
	<h5 class="font-bold text-2xl">Forgot password?</h5>
	<p>Enter your email to reset your password.</p>
	<form method="POST" action="?/forgot_password" class="flex flex-col gap-2" use:enhance>
		<label for="email">Email:<input type="email" name="email" id="email" required /></label>
		{#if form?.errors?.email}
			<span class="text-red-500">{form?.errors?.email[0]}</span>
		{/if}

		<button
			type="submit"
			class="bg-blue-300 text-black font-semibold text-lg border border-solid border-black p-1 w-44 mt-4"
			>Send</button
		>
	</form>
	{#if form && form.success === true}
		<div class="bg-green-300 p-2">
			<p>Check your email for the reset-password email from supabase</p>
		</div>
	{/if}
	{#if form && form.success === false}
		<div class="bg-red-300 p-2">
			<p>Could not find a user with this email.</p>
		</div>
	{/if}
</div>
