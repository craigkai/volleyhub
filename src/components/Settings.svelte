<script lang="ts">
	import toast from 'svelte-french-toast';
	import { Input } from '$components/ui/input';
	import { Field, Label, Control, Description, FieldErrors, Button } from '$components/ui/form';
	import { Textarea } from '$components/ui/textarea/index.js';
	import {
		Value,
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
		parseDateTime,
		CalendarDateTime
	} from '@internationalized/date';
	import { cn } from '$lib/utils';
	import { buttonVariants } from '$components/ui/button';
	import { Calendar } from '$components/ui/calendar';
	import CalendarIcon from 'lucide-svelte/icons/calendar';

	export let data;
	export let eventId;

	let form = superForm(data.form, {
		validators: zodClient(formSchema),
		onError({ result }) {
			toast.error(result.error.message || 'Unknown error');
		},
		async onUpdated({ form }) {
			if (form.valid) {
				toast.success(`Tournament settings updated`);
				data.tournament.load(data.eventId).catch((err: any) => {
					toast.error(`Failed to load tournament: ${err}`);
				});
				$formData = form.data;
			}
		},
		dataType: 'json'
	});

	let { form: formData, enhance } = form;

	const df = new DateFormatter('en-US', {
		dateStyle: 'long'
	});

	let dateValue = $formData.date ? parseDateTime($formData.date) : undefined;
	$: $formData.date = dateValue?.toString() ?? '';

	let selectedRefValue = {
		label: $formData.refs,
		value: $formData.refs
	};
	$: $formData.refs = selectedRefValue.value;

	let scoringValue = {
		label: $formData.scoring,
		value: $formData.scoring
	};
	$: $formData.scoring = scoringValue.value;

	const datePlaceholder: DateValue = today(getLocalTimeZone());
</script>

<form
	class="form-container rounded rounded-2xl p-2 dark:bg-gray-800"
	method="POST"
	action="?/{eventId === 'create' ? 'createEvent' : 'updateEvent'}"
	use:enhance
>
	<div class="form-field">
		<Field {form} name="name">
			<Control let:attrs>
				<Label class="form-label dark:text-gray-300">Name</Label>
				<Input {...attrs} bind:value={$formData.name} class="dark:bg-gray-700 dark:text-gray-200" />
			</Control>
			<Description class="form-description dark:text-gray-400">
				This is your public display name for your event.
			</Description>
			<FieldErrors class="form-errors dark:text-red-400" />
		</Field>
	</div>

	<div class="form-field">
		<Field {form} name="description">
			<Control let:attrs>
				<Label class="form-label dark:text-gray-300">Description</Label>
				<Textarea
					{...attrs}
					bind:value={$formData.description}
					class="dark:bg-gray-700 dark:text-gray-200"
				/>
			</Control>
			<Description class="form-description dark:text-gray-400">Describe your event!</Description>
			<FieldErrors class="form-errors dark:text-red-400" />
		</Field>
	</div>

	<div class="form-field">
		<Field {form} name="courts">
			<Control let:attrs>
				<Label class="form-label dark:text-gray-300">Number of Courts</Label>
				<Input
					{...attrs}
					type="number"
					bind:value={$formData.courts}
					class="dark:bg-gray-700 dark:text-gray-200"
				/>
			</Control>
			<Description class="form-description dark:text-gray-400">
				Number of Courts available for pool play
			</Description>
			<FieldErrors class="form-errors dark:text-red-400" />
		</Field>
	</div>

	<div class="form-field">
		<Field {form} name="pools">
			<Control let:attrs>
				<Label class="form-label dark:text-gray-300">Number of pool play games</Label>
				<Input
					{...attrs}
					type="number"
					bind:value={$formData.pools}
					class="dark:bg-gray-700 dark:text-gray-200"
				/>
			</Control>
			<Description class="form-description dark:text-gray-400">
				Number of pool play games before the next stage (single/double elim)
			</Description>
			<FieldErrors class="form-errors dark:text-red-400" />
		</Field>
	</div>

	<div class="form-field">
		<Field {form} name="refs">
			<Control let:attrs>
				<Label class="form-label dark:text-gray-300">Ref's</Label>
				<SelectRoot
					bind:selected={selectedRefValue}
					onSelectedChange={(v) => {
						v && ($formData.refs = v.value);
					}}
				>
					<SelectTrigger {...attrs} class="dark:bg-gray-700 dark:text-gray-200">
						<Value placeholder="Select who will be ref'ing" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="teams" label="teams" />
						<SelectItem value="provided" label="provided" />
					</SelectContent>
				</SelectRoot>
				<input hidden value={$formData.refs} name={attrs.name} />
			</Control>
			<Description class="form-description dark:text-gray-400">
				Source of refs, either provided by pulling from participants or provided externally.
			</Description>
			<FieldErrors class="form-errors dark:text-red-400" />
		</Field>
	</div>

	<div class="form-field">
		<Field {form} name="scoring">
			<Control let:attrs>
				<Label class="form-label dark:text-gray-300">Scoring Method</Label>
				<SelectRoot
					bind:selected={scoringValue}
					onSelectedChange={(v) => {
						v && ($formData.scoring = v.value);
					}}
				>
					<SelectTrigger {...attrs} class="dark:bg-gray-700 dark:text-gray-200">
						<Value placeholder="Seeding for playoffs based on score of just wins?" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="points" label="points" />
						<SelectItem value="wins" label="wins" />
					</SelectContent>
				</SelectRoot>
				<input hidden value={$formData.scoring} name={attrs.name} />
			</Control>
			<Description class="form-description dark:text-gray-400">
				Seeding for playoffs based on score of just wins.
			</Description>
			<FieldErrors class="form-errors dark:text-red-400" />
		</Field>
	</div>

	<div class="form-field flex flex-col">
		<Field {form} name="date">
			<Control let:attrs>
				<Label class="form-label dark:text-gray-300">Date</Label>
				<PopoverRoot>
					<PopoverTrigger
						{...attrs}
						class={cn(
							buttonVariants({ variant: 'outline' }),
							'w-full justify-start pl-4 text-left font-normal',
							!dateValue && 'text-muted-foreground',
							'dark:bg-gray-700 dark:text-gray-200'
						)}
					>
						{dateValue ? df.format(dateValue.toDate(getLocalTimeZone())) : 'Pick a date'}
						<CalendarIcon class="ml-auto h-4 w-4 opacity-50" />
					</PopoverTrigger>
					<PopoverContent class="w-auto p-0" side="top">
						<Calendar
							bind:value={dateValue}
							placeholder={datePlaceholder}
							minValue={today(getLocalTimeZone())}
							calendarLabel="Date of event"
							initialFocus
							onValueChange={(v) => {
								if (v) {
									$formData.date = v.toString();
									dateValue = v as CalendarDateTime; // Ensure dateValue is updated
								} else {
									$formData.date = '';
									dateValue = undefined;
								}
							}}
						/>
					</PopoverContent>
				</PopoverRoot>
				<Description class="form-description dark:text-gray-400">Date of tournament</Description>
				<FieldErrors class="form-errors dark:text-red-400" />
				<input hidden value={$formData.date} name={attrs.name} />
			</Control>
		</Field>
	</div>
	<div class="flex justify-center">
		<Button
			class="rounded-xl border border-emerald-900 bg-emerald-950 px-4 py-2 text-sm font-medium text-emerald-500"
			>Submit</Button
		>
	</div>
</form>

{#if eventId !== 'create'}
	<form method="POST" action="?/deleteEvent" use:enhance>
		<div class="flex justify-center">
			<Button
				class="rounded-xl border border-red-900 bg-red-950 px-4 py-2 text-sm font-medium text-red-500"
				>Delete</Button
			>
		</div>
	</form>
{/if}
