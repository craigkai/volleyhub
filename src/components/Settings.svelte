<script lang="ts">
	import dayjs from 'dayjs';
	import type { SvelteToastOptions } from '@zerodevx/svelte-toast/stores';
	import { goto } from '$app/navigation';
	import { error, success } from '$lib/toast';
	import type { HttpError } from '@sveltejs/kit';
	import { Event } from '$lib/event';
	import * as Form from '$components/ui/form';
	import { Input } from '$components/ui/input';
	import * as Select from '$components/ui/select';
	import SuperDebug, { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { formSchema, type FormSchema } from '$schemas/settingsSchema';

	export let data: SuperValidated<Infer<FormSchema>>;
	export let tournament: Event;
	export let event_id: number | 'create';

	const form = superForm(data, {
		validators: zodClient(formSchema),
		onUpdated: async ({ form: f }) => {
			if (f.valid) {
				success(`Tournament settings updated`);
			} else {
				error(f.message);
			}
		}
	});

	const { form: formData, enhance } = form;

	async function createNewEvent(): Promise<void> {
		tournament.courts = Number(tournament.courts);
		tournament.pools = Number(tournament.pools);

		tournament
			.create(tournament)
			.then(async () => {
				success(`Tournament created`);
				// Navigate to the page with the [slug] value set to our tournament Id
				goto(`/protected-routes/events/${tournament.id}`, {
					state: { eventCreated: tournament.id }
				});
			})
			.catch((err: HttpError) => {
				error(err.toString());
			});
	}

	async function deleteEvent(): Promise<void> {
		tournament
			.delete()
			.then(() => {
				goto('/protected-routes/dashboard');
				success(`Deleted ${tournament.name}`);
			})
			.catch((err: { body: { message: string | SvelteToastOptions } }) =>
				error(err?.body?.message)
			);
	}

	$: tournament?.date, (tournament.date = dayjs(tournament?.date).format('YYYY-MM-DD'));
</script>

<form method="POST" action="?/settings" use:enhance>
	<Form.Field {form} name="name">
		<Form.Control let:attrs>
			<Form.Label>Name</Form.Label>
			<Input {...attrs} bind:value={$formData.name} />
		</Form.Control>
		<Form.Description>This is your public display name for your event.</Form.Description>
		<Form.FieldErrors />
	</Form.Field>

	<!-- <Form.Field {form} name="courts">
		<Form.Control>
			<Form.Label>Number of Courts.</Form.Label>
			<Input type="number" value={$formData.courts} />
		</Form.Control>
		<Form.Description>Number of Courts available for pool play</Form.Description>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="pools">
		<Form.Control>
			<Form.Label>Number of pool play games</Form.Label>
			<Input type="number" value={$formData.pools} />
		</Form.Control>
		<Form.Description
			>Number of pool play games before the next stage (single/double elim)</Form.Description
		>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="ref">
		<Form.Control let:attrs>
			<Form.Label>Ref's</Form.Label>
			<Select.Root
				selected={$formData.ref}
				onSelectedChange={(v) => {
					v && ($formData.ref = v.value);
				}}
			>
				<Select.Trigger {...attrs}>
					<Select.Value placeholder="Select who will be ref'ing" />
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="teams" label="Teams" />
					<Select.Item value="provided" label="Provided" />
				</Select.Content>
			</Select.Root>
			<input hidden value={$formData.ref} name={attrs.name} />
		</Form.Control>
		<Form.Description>
			Source of refs, either provided by pulling from participants or provided externally.
		</Form.Description>
		<Form.FieldErrors />
	</Form.Field> -->

	<Form.Button>Submit</Form.Button>
</form>

<!-- <div class="dark:bg-nord-2 m-2 shadow-md rounded flex flex-col items-center lg:w-1/2 sm:w-full">
	<div class="m-2">
		<Label for="eventName" class="mb-2">Event Name:</Label>
		<Input type="text" id="eventName" bind:value={tournament.name} required />
	</div>

	<div class="m-2">
		<Label for="eventCourts" class="mb-2">Number of Courts:</Label>
		<Input type="number" id="eventCourts" bind:value={tournament.courts} required />
	</div>

	<div class="m-2">
		<Label for="eventCourts" class="mb-2">Number of Pool Play Games:</Label>
		<Input type="number" id="eventCourts" bind:value={tournament.pools} required />
	</div>

	<div class="m-2">
		<Label>
			Ref'ing:
			<Select
				class="mt-2"
				items={[
					{ value: 'provided', name: 'Provided' },
					{ value: 'teams', name: 'Teams' }
				]}
				bind:value={tournament.refs}
			/>
		</Label>
	</div>

	<div class="m-2">
		<Label class="mb-2">Date:</Label>
		<input id="date" class="bg-gray-200 p-2 rounded" type="date" bind:value={tournament.date} />
	</div>

	<div class="m-2">
		<Label>
			Pool Play Scoring:
			<Select
				class="mt-2"
				items={[
					{ value: 'points', name: 'Points' },
					{ value: 'wins', name: 'Wins' }
				]}
				bind:value={tournament.scoring}
			/>
		</Label>
	</div>

	<div class="m-2">
		{#if event_id === 'create'}
			<Button
				class="bg-nord-10 hover:bg-nord-9 dark:text-nord-1 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
				type="button"
				on:click={() => createNewEvent()}
			>
				Create Tournament</Button
			>{:else}
			<Button
				class="bg-nord-10 hover:bg-nord-9 dark:text-nord-1 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
				type="button"
				on:click={() => updateTournament()}
			>
				Update Tournament Settings</Button
			>
		{/if}
	</div>

	{#if event_id !== 'create'}
		<button
			class="bg-nord-12 m-2 hover:bg-nord-9 dark:text-nord-1 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
			type="button"
			on:click={deleteEvent}>Delete event</button
		>
	{/if}
</div> -->
