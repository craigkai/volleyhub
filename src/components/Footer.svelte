<script lang="ts">
	// You can add TypeScript logic here if needed
</script>

<footer class="relative bottom-0 w-full bg-blue-500 dark:bg-nord-1">
	<div class="wrap mx-auto flex max-w-7xl items-center justify-between p-4">
		<p class="text-white">
			This staging environment was deployed from {import.meta.env.VITE_COMMIT_REF.slice(0, 6)}
		</p>
	</div>
</footer>
