<script lang="ts">
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger
	} from '$components/ui/accordion';
	import { Card, CardContent, CardHeader, CardTitle } from '$components/ui/card';

	const faqs = $state([
		{
			question: 'Why should I share the player link?',
			answer: `Sharing the link lets your players:
      - View match schedules and team stats
      - Track their own performance over time`
		},
		{
			question: 'Who can access the link?',
			answer: 'Anyone can view the event!'
		},
		{
			question: 'What can players do with the link?',
			answer: `Players can:
      - View pool play schedules and match stats`
		},
		{
			question: 'Do players need to create an account?',
			answer: 'No account is required to view.'
		}
	]);
</script>

<div class="mx-auto max-w-3xl px-4">
	<Card class="border-none shadow-lg dark:bg-slate-800 dark:shadow-md">
		<CardHeader class="rounded-t-lg bg-blue-500 text-white dark:bg-slate-800">
			<CardTitle class="p-4 text-center text-3xl font-bold">Volleyball App FAQ</CardTitle>
		</CardHeader>
		<CardContent class="rounded-b-lg bg-white p-6 dark:bg-slate-900">
			<Accordion type="single" class="space-y-4">
				{#each faqs as faq, index}
					<AccordionItem
						value={`item-${index}`}
						class="rounded-lg border border-slate-200 px-4 shadow-sm dark:border-slate-700 dark:shadow-sm"
					>
						<AccordionTrigger
							class="hover:text-primary dark:hover:text-primary py-4 text-lg font-medium transition-colors dark:text-white"
						>
							{faq.question}
						</AccordionTrigger>
						<AccordionContent class="whitespace-pre-line pb-4 text-slate-700 dark:text-slate-300">
							{faq.answer}
						</AccordionContent>
					</AccordionItem>
				{/each}
			</Accordion>
		</CardContent>
	</Card>

	Demo:
	<div class="mb-6 overflow-hidden rounded-lg shadow">
		<!-- svelte-ignore a11y_media_has_caption -->
		<video controls class="w-full rounded-lg" poster="">
			<source
				src="https://bduwlmhqcuslxxozwnjs.supabase.co/storage/v1/object/public/volleyhub%20videos/demo.mov?t=2024-10-02T12%3A29%3A37.572Z"
				type="video/mp4"
			/>
			Your browser does not support the video tag.
		</video>
	</div>
</div>
