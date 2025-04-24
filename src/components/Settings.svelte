<script lang="ts">
	import toast from 'svelte-french-toast';
	import { Input } from '$components/ui/input';
	import { Field, Label, Control, Description, FieldErrors, Button } from '$components/ui/form';
	import { Textarea } from '$components/ui/textarea';
	import {
		Root as SelectRoot,
		Trigger as SelectTrigger,
		Content as SelectContent,
		Item as SelectItem
	} from '$components/ui/select';
	import {
		Root as PopoverRoot,
		Trigger as PopoverTrigger,
		Content as PopoverContent
	} from '$components/ui/popover';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { formSchema } from '$schemas/settingsSchema';
	import {
		type DateValue,
		DateFormatter,
		getLocalTimeZone,
		today,
		parseDateTime
	} from '@internationalized/date';
	import { cn } from '$lib/utils';
	import { buttonVariants } from '$components/ui/button';
	import { Calendar } from '$components/ui/calendar';
	import CalendarIcon from 'lucide-svelte/icons/calendar';
	import TrophyIcon from 'lucide-svelte/icons/trophy';
	import ClipboardListIcon from 'lucide-svelte/icons/clipboard-list';
	import CourtIcon from 'lucide-svelte/icons/layout-grid';
	import UserIcon from 'lucide-svelte/icons/users';
	import ScoreIcon from 'lucide-svelte/icons/bar-chart-2';
	// @ts-ignore
	import type { PageData } from './$types';

	const { data, eventId } = $props<{ eventId: Number | string; data: PageData }>();

	let form = superForm(data.form, {
		validators: zodClient(formSchema),
		onError({ result }) {
			toast.error(result.error.message || 'Unknown error');
		},
		async onUpdated({ form }) {
			if (form.valid) {
				formData = form.data;
				toast.success(`Tournament settings updated`);
			}
		},
		dataType: 'json'
	});

	let { form: formData, enhance, delayed } = form;

	const df = new DateFormatter('en-US', {
		dateStyle: 'long'
	});

	let dateValue = $derived(formData.date ? parseDateTime(formData.date) : undefined);

	let selectedRefValue = $derived({
		label: formData.refs,
		value: formData.refs
	});

	let scoringValue = $derived({
		label: formData.scoring,
		value: formData.scoring
	});

	const datePlaceholder: DateValue = today(getLocalTimeZone());
</script>

<div class="mx-auto max-w-4xl">
	<div class="mb-6 flex items-center gap-3">
		<TrophyIcon class="h-7 w-7 text-emerald-600" />
		<h1 class="text-2xl font-bold text-gray-800 dark:text-white">
			{eventId === 'create' ? 'Create New Tournament' : 'Edit Tournament Settings'}
		</h1>
	</div>

	{#if $delayed}
		<div
			class="flex items-center justify-center rounded-lg bg-white py-12 shadow-md dark:bg-gray-800"
		>
			<div
				class="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"
				role="status"
			>
				<span class="sr-only">Loading...</span>
			</div>
		</div>
	{:else}
		<form
			class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
			method="POST"
			action="?/{eventId === 'create' ? 'createEvent' : 'updateEvent'}"
			use:enhance
		>
			<!-- Header -->
			<div
				class="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900"
			>
				<h2 class="text-lg font-medium text-gray-800 dark:text-white">Tournament Information</h2>
				<p class="text-sm text-gray-500 dark:text-gray-400">
					Configure the details for your tournament
				</p>
			</div>

			<!-- Form Content -->
			<div class="p-6">
				<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
					<!-- Name -->
					<div class="space-y-1.5">
						<Field {form} name="name">
							<Control>
								{#snippet children({ props })}
									<div class="flex items-center gap-2">
										<TrophyIcon class="h-4 w-4 text-gray-500" />
										<Label class="font-medium">Tournament Name</Label>
									</div>
									<Input
										{...props}
										bind:value={$formData.name}
										class="mt-1.5 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 dark:border-gray-600"
									/>
								{/snippet}
							</Control>
							<Description class="text-xs text-gray-500">
								This is your public display name for your event.
							</Description>
							<FieldErrors class="text-xs text-red-500" />
						</Field>
					</div>

					<!-- Date -->
					<div class="space-y-1.5">
						<Field {form} name="date">
							<Control>
								{#snippet children({ props })}
									<div class="flex items-center gap-2">
										<CalendarIcon class="h-4 w-4 text-gray-500" />
										<Label class="font-medium">Tournament Date</Label>
									</div>
									<PopoverRoot>
										<PopoverTrigger
											{...props}
											class={cn(
												buttonVariants({ variant: 'outline' }),
												'mt-1.5 w-full justify-start border-gray-300 pl-4 text-left font-normal focus:border-emerald-500 focus:ring-emerald-500 dark:border-gray-600',
												!dateValue && 'text-gray-500'
											)}
										>
											{dateValue
												? df.format(dateValue.toDate(getLocalTimeZone()))
												: 'Select a date'}
											<CalendarIcon class="ml-auto h-4 w-4 opacity-50" />
										</PopoverTrigger>
										<PopoverContent class="w-auto p-0" side="bottom">
											<Calendar
												value={dateValue}
												placeholder={datePlaceholder}
												minValue={today(getLocalTimeZone())}
												calendarLabel="Date of event"
												initialFocus
												onValueChange={(v) => (dateValue = v)}
											/>
										</PopoverContent>
									</PopoverRoot>
								{/snippet}
							</Control>
							<Description class="text-xs text-gray-500">Date of tournament</Description>
							<FieldErrors class="text-xs text-red-500" />
						</Field>
					</div>

					<!-- Description -->
					<div class="space-y-1.5 md:col-span-2">
						<Field {form} name="description">
							<Control>
								{#snippet children({ props })}
									<div class="flex items-center gap-2">
										<ClipboardListIcon class="h-4 w-4 text-gray-500" />
										<Label class="font-medium">Description</Label>
									</div>
									<Textarea
										{...props}
										bind:value={$formData.description}
										rows={3}
										class="mt-1.5 resize-none border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 dark:border-gray-600"
									/>
								{/snippet}</Control
							>
							<Description class="text-xs text-gray-500">
								Provide details about your tournament for participants
							</Description>
							<FieldErrors class="text-xs text-red-500" />
						</Field>
					</div>
				</div>

				<!-- Divider -->
				<div class="my-8 border-t border-gray-200 dark:border-gray-700"></div>

				<!-- Tournament Structure Section -->
				<div class="mb-6">
					<h3 class="mb-4 text-lg font-medium text-gray-800 dark:text-white">
						Tournament Structure
					</h3>
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<!-- Courts -->
						<div class="space-y-1.5">
							<Field {form} name="courts">
								<Control>
									{#snippet children({ props })}
										<div class="flex items-center gap-2">
											<CourtIcon class="h-4 w-4 text-gray-500" />
											<Label class="font-medium">Number of Courts</Label>
										</div>
										<Input
											type="number"
											{...props}
											bind:value={$formData.courts}
											class="mt-1.5 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 dark:border-gray-600"
										/>
									{/snippet}
								</Control>
								<Description class="text-xs text-gray-500">
									Courts available for pool play
								</Description>
								<FieldErrors class="text-xs text-red-500" />
							</Field>
						</div>

						<!-- Pools -->
						<div class="space-y-1.5">
							<Field {form} name="pools">
								<Control>
									{#snippet children({ props })}
										<div class="flex items-center gap-2">
											<CourtIcon class="h-4 w-4 text-gray-500" />
											<Label class="font-medium">Number of Pool Play Games</Label>
										</div>
										<Input
											type="number"
											{...props}
											bind:value={$formData.pools}
											class="mt-1.5 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 dark:border-gray-600"
										/>
									{/snippet}
								</Control>
								<Description class="text-xs text-gray-500">Games before playoffs</Description>
								<FieldErrors class="text-xs text-red-500" />
							</Field>
						</div>

						<!-- Refs -->
						<div class="space-y-1.5">
							<Field {form} name="refs">
								<Control>
									{#snippet children({ props })}
										<div class="flex items-center gap-2">
											<UserIcon class="h-4 w-4 text-gray-500" />
											<Label class="font-medium">Referees</Label>
										</div>
										<SelectRoot
											value={selectedRefValue}
											onValueChange={(v) => v && (formData.refs = v.value)}
										>
											<SelectTrigger
												{...props}
												class="mt-1.5 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 dark:border-gray-600"
											>
												Select who will be ref'ing
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="teams" label="Teams" />
												<SelectItem value="provided" label="Provided" />
											</SelectContent>
										</SelectRoot>
										<input type="hidden" value={$formData.refs} name={props.name} />
									{/snippet}
								</Control>
								<Description class="text-xs text-gray-500">Source of referees</Description>
								<FieldErrors class="text-xs text-red-500" />
							</Field>
						</div>

						<!-- Scoring -->
						<div class="space-y-1.5">
							<Field {form} name="scoring">
								<Control>
									{#snippet children({ props })}
										<div class="flex items-center gap-2">
											<ScoreIcon class="h-4 w-4 text-gray-500" />
											<Label class="font-medium">Scoring Method</Label>
										</div>
										<SelectRoot
											value={scoringValue}
											onValueChange={(v) => v && (formData.scoring = v.value)}
										>
											<SelectTrigger
												{...props}
												class="mt-1.5 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 dark:border-gray-600"
											>
												Seeding based on?
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="points" label="Points" />
												<SelectItem value="wins" label="Wins" />
											</SelectContent>
										</SelectRoot>
										<input type="hidden" value={$formData.scoring} name={props.name} />
									{/snippet}
								</Control>
								<Description class="text-xs text-gray-500">
									Seeding criteria for playoffs
								</Description>
								<FieldErrors class="text-xs text-red-500" />
							</Field>
						</div>
					</div>
				</div>

				<!-- Submit Buttons -->
				<div
					class="mt-8 flex flex-col gap-4 border-t border-gray-200 pt-6 sm:flex-row sm:justify-between dark:border-gray-700"
				>
					{#if eventId !== 'create'}
						<form method="POST" action="?/deleteEvent" use:enhance>
							<Button
								type="submit"
								class="w-full rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 focus:ring-4 focus:ring-red-100 focus:outline-none sm:w-auto dark:border-red-800 dark:bg-transparent dark:text-red-500 dark:hover:bg-red-900"
							>
								Delete Tournament
							</Button>
						</form>
					{:else}
						<div></div>
					{/if}
					<Button
						type="submit"
						class="w-full rounded-lg bg-emerald-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-300 focus:outline-none sm:w-auto dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:focus:ring-emerald-800"
					>
						{eventId === 'create' ? 'Create Tournament' : 'Save Changes'}
					</Button>
				</div>
			</div>
		</form>
	{/if}
</div>

<style>
	:global(.dark) {
		color-scheme: dark;
	}
</style>
