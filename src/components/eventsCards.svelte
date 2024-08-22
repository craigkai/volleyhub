<script lang="ts">
	import * as Card from '$components/ui/card/index.js';
	import { getLocalTimeZone, parseDateTime } from '@internationalized/date';

	export let events: Partial<EventRow>[];
</script>

<div class="flex flex-col items-center">
	{#if events && events.length > 0}
		<div class="m-2">
			{#each events as event}
				<a href="/events/{event.id}">
					<Card.Root class="dark:bg-slate-700 m-2 w-[350px]">
						<Card.Header>
							<Card.Title>{event.name}</Card.Title>
							<Card.Description class="truncate">{event.description}</Card.Description>
						</Card.Header>
						<Card.Content>
							<form>
								<div class="grid w-full items-center gap-4">
									<div class="flex flex-col space-y-1.5">
										<span
											>{parseDateTime(event.date ?? '')
												.toDate(getLocalTimeZone())
												.toDateString()}</span
										>
									</div>
								</div>
							</form>
						</Card.Content>
					</Card.Root>
				</a>
			{/each}
		</div>
	{/if}
</div>
