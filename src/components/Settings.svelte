<script lang="ts">
	import { error, success } from '$lib/toast';
	import * as Form from '$components/ui/form';
	import { Input } from '$components/ui/input';
	import * as Select from '$components/ui/select';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { formSchema, type FormSchema } from '$schemas/settingsSchema';
	import {
		type DateValue,
		DateFormatter,
		getLocalTimeZone,
		today,
		parseDateTime
	} from '@internationalized/date';
	import { cn } from '$lib/utils.js';
	import { buttonVariants } from '$components/ui/button';
	import { Calendar } from '$components/ui/calendar';
	import * as Popover from '$components/ui/popover';
	import CalendarIcon from 'lucide-svelte/icons/calendar';

	export let data: SuperValidated<Infer<FormSchema>>;
	export let event_id: number | 'create';

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

	$: selectedRefValue = $formData.ref
		? {
				label: $formData.ref,
				value: $formData.ref
			}
		: undefined;

	const df = new DateFormatter('en-US', {
		dateStyle: 'long'
	});
	$: dateValue = $formData.date ? parseDateTime($formData.date) : undefined;
	let datePlaceholder: DateValue = today(getLocalTimeZone());

	$: scoringValue = $formData.scoring
		? {
				label: $formData.scoring,
				value: $formData.scoring
			}
		: undefined;
</script>

<form
	class="form-container dark:bg-gray-800 dark:text-gray-200"
	method="POST"
	action="?/{event_id === 'create' ? 'createEvent' : 'updateEvent'}"
	use:enhance
>
	<div class="form-field">
		<Form.Field {form} name="name">
			<Form.Control let:attrs>
				<Form.Label class="form-label dark:text-gray-300">Name</Form.Label>
				<Input {...attrs} bind:value={$formData.name} class="dark:bg-gray-700 dark:text-gray-200" />
			</Form.Control>
			<Form.Description class="form-description dark:text-gray-400">
				This is your public display name for your event.
			</Form.Description>
			<Form.FieldErrors class="form-errors dark:text-red-400" />
		</Form.Field>
	</div>

	<div class="form-field">
		<Form.Field {form} name="courts">
			<Form.Control let:attrs>
				<Form.Label class="form-label dark:text-gray-300">Number of Courts</Form.Label>
				<Input
					{...attrs}
					type="number"
					bind:value={$formData.courts}
					class="dark:bg-gray-700 dark:text-gray-200"
				/>
			</Form.Control>
			<Form.Description class="form-description dark:text-gray-400">
				Number of Courts available for pool play
			</Form.Description>
			<Form.FieldErrors class="form-errors dark:text-red-400" />
		</Form.Field>
	</div>

	<div class="form-field">
		<Form.Field {form} name="pools">
			<Form.Control let:attrs>
				<Form.Label class="form-label dark:text-gray-300">Number of pool play games</Form.Label>
				<Input
					{...attrs}
					type="number"
					bind:value={$formData.pools}
					class="dark:bg-gray-700 dark:text-gray-200"
				/>
			</Form.Control>
			<Form.Description class="form-description dark:text-gray-400">
				Number of pool play games before the next stage (single/double elim)
			</Form.Description>
			<Form.FieldErrors class="form-errors dark:text-red-400" />
		</Form.Field>
	</div>

	<div class="form-field">
		<Form.Field {form} name="ref">
			<Form.Control let:attrs>
				<Form.Label class="form-label dark:text-gray-300">Ref's</Form.Label>
				<Select.Root
					selected={selectedRefValue}
					onSelectedChange={(v) => {
						v && ($formData.ref = v.value);
					}}
				>
					<Select.Trigger {...attrs} class="dark:bg-gray-700 dark:text-gray-200">
						<Select.Value placeholder="Select who will be ref'ing" />
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="teams" label="Teams" />
						<Select.Item value="provided" label="Provided" />
					</Select.Content>
				</Select.Root>
				<input hidden value={$formData.ref} name={attrs.name} />
			</Form.Control>
			<Form.Description class="form-description dark:text-gray-400">
				Source of refs, either provided by pulling from participants or provided externally.
			</Form.Description>
			<Form.FieldErrors class="form-errors dark:text-red-400" />
		</Form.Field>
	</div>

	<div class="form-field">
		<Form.Field {form} name="scoring">
			<Form.Control let:attrs>
				<Form.Label class="form-label dark:text-gray-300">Scoring Method</Form.Label>
				<Select.Root
					selected={scoringValue}
					onSelectedChange={(v) => {
						v && ($formData.scoring = v.value);
					}}
				>
					<Select.Trigger {...attrs} class="dark:bg-gray-700 dark:text-gray-200">
						<Select.Value placeholder="Seeding for playoffs based on score of just wins?" />
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="points" label="Points" />
						<Select.Item value="wins" label="Wins" />
					</Select.Content>
				</Select.Root>
				<input hidden value={$formData.scoring} name={attrs.name} />
			</Form.Control>
			<Form.Description class="form-description dark:text-gray-400">
				Seeding for playoffs based on score of just wins.
			</Form.Description>
			<Form.FieldErrors class="form-errors dark:text-red-400" />
		</Form.Field>
	</div>

	<div class="form-field flex flex-col">
		<Form.Field {form} name="date">
			<Form.Control let:attrs>
				<Form.Label class="form-label dark:text-gray-300">Date</Form.Label>
				<Popover.Root>
					<Popover.Trigger
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
					</Popover.Trigger>
					<Popover.Content class="w-auto p-0" side="top">
						<Calendar
							value={dateValue}
							bind:placeholder={datePlaceholder}
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
					</Popover.Content>
				</Popover.Root>
				<Form.Description class="form-description dark:text-gray-400"
					>Date of tournament</Form.Description
				>
				<Form.FieldErrors class="form-errors dark:text-red-400" />
				<input hidden value={$formData.date} name={attrs.name} />
			</Form.Control>
		</Form.Field>
	</div>

	<div class="flex justify-center">
		<Form.Button class="m-2 dark:bg-gray-700 dark:text-gray-200">Submit</Form.Button>

		{#if event_id !== 'create'}
			<form method="POST" action="?/deleteEvent" use:enhance>
				<Form.Button class="m-2 bg-red-500 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-900"
					>Delete</Form.Button
				>
			</form>
		{/if}
	</div>
</form>

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
