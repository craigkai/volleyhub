<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	let events: any;
	async function loadEvents() {
		data.supabase
			.from('events')
			.select('*')
			.eq('owner', data?.session?.user?.id)
			.then((data: any) => {
				events = data?.data;
			});
	}
	let loadingEventPromise = loadEvents();
</script>

{#await loadingEventPromise}
	loading your events...
{:then}
	A place to see your tournaments you manage
	{JSON.stringify(events)}
{/await}
