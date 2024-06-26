<script lang="ts">
	import { error, success } from '$lib/toast';
	import { Input } from '$components/ui/input';
	import { Field, Label, Control, Description, FieldErrors, Button } from '$components/ui/form';
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
	import { superForm, type SuperValidated, type Infer } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { formSchema, type FormSchema } from '$schemas/settingsSchema';
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

	let { data, event_id }: { data: SuperValidated<Infer<FormSchema>>; event_id: number | 'create' } =
		$props();

	const form = superForm(data, {
		validators: zodClient(formSchema),
		onUpdated: async ({ form: f }) => {
			if (f.valid) {
				success(`Tournament settings updated`);
			} else {
				for (let [_, value] of Object.entries(f.errors)) {
					error(value.pop());
				}
			}
		}
	});

	let { form: formData, enhance } = form;

	const df = new DateFormatter('en-US', {
		dateStyle: 'long'
	});

	let dateValue = $state($formData.date ? parseDateTime($formData.date) : undefined);
	$effect(() => {
		$formData.date = dateValue?.toString() ?? '';
	});
	const datePlaceholder: DateValue = today(getLocalTimeZone());

	let selectedRefValue = $state({
		label: $formData.refs,
		value: $formData.refs
	});

	$effect(() => {
		$formData.refs = selectedRefValue.value;
	});

	let scoringValue = $state({
		label: $formData.scoring,
		value: $formData.scoring
	});

	$effect(() => {
		$formData.scoring = scoringValue.value;
	});
</script>

<form
	class="form-container dark:bg-gray-800 dark:text-gray-200"
	method="POST"
	action="?/{event_id === 'create' ? 'createEvent' : 'updateEvent'}"
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
						<SelectItem value="teams" label="Teams" />
						<SelectItem value="provided" label="Provided" />
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
						<SelectItem value="points" label="Points" />
						<SelectItem value="wins" label="Wins" />
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
							'w-[280px] justify-start pl-4 text-left font-normal',
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
							calendarLabel="Date of birth"
							initialFocus
							onValueChange={(v) => {
								if (v) {
									$formData.date = v.toString();
								} else {
									$formData.date = '';
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
		<Button class="m-2 dark:bg-gray-700 dark:text-gray-200">Submit</Button>
	</div>
</form>

{#if event_id !== 'create'}
	<form method="POST" action="?/deleteEvent" use:enhance>
		<div class="flex justify-center">
			<Button class="m-2 bg-red-500 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-900"
				>Delete</Button
			>
		</div>
	</form>
{/if}

<style>
	.form-container {
		max-width: 600px;
		margin: 0 auto;
		padding: 1rem;
		background: #f9f9f9;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.form-field {
		margin-bottom: 1.5rem;
	}

	.form-label {
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.form-description {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.form-errors {
		color: #dc2626;
		font-size: 0.875rem;
		margin-top: 0.5rem;
	}

	/* Dark mode styles */
	.dark .form-container {
		background: #1f2937;
	}

	.dark .form-label {
		color: #d1d5db;
	}

	.dark .form-description {
		color: #9ca3af;
	}

	.dark .form-errors {
		color: #f87171;
	}
</style>
