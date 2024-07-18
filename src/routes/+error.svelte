<script>
	import { page } from '$app/stores';
</script>

<div class="error-container">
	<h1 class="status">
		{$page.status}
	</h1>
	<p class="message">
		{$page?.error?.message}
	</p>
</div>

<style>
	.error-container {
		margin: 20px auto;
		padding: 20px;
		border: 1px solid #ff6b6b;
		border-radius: 8px;
		background-color: #ffe6e6;
		max-width: 600px;
		text-align: center;
	}

	.status {
		font-size: 2rem;
		color: #ff6b6b;
		margin-bottom: 10px;
	}

	.message {
		font-size: 1.2rem;
		color: #333;
	}
</style>
