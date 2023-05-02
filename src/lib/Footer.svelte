<script lang="ts">
	import type { LayoutServerData } from '$types';

	export let data: LayoutServerData;
</script>

<footer
	class="whitepsace-nowrap
    p-8 absolute inset-x-0 bottom-0
    w-full bg-blue-500
"
>
	Copy right? Yeah right
	<div>
		<p>This staging environment was deployed from {data.deploymentGitBranch}.</p>
	</div>
</footer>
