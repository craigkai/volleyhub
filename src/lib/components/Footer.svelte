<script lang="ts">
	import type { LayoutServerData } from '$types';

	export const data: LayoutServerData = undefined;
</script>

<footer
	class="whitepsace-nowrap
    p-8 relative inset-x-0 bottom-0
    w-full bg-blue-500 dark:bg-nord-1
"
>
	Copyright? Yeah right
	<div>
		<p>This staging environment was deployed from {import.meta.env.VITE_COMMIT_REF}.</p>
	</div>
</footer>
