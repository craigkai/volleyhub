<script lang="ts">
	import { isHttpError, type HttpError } from '@sveltejs/kit';
	import { onMount } from 'svelte';
	import * as Table from '$components/ui/table';
	import { Input } from '$components/ui/input/index.js';
	import { Button } from '$components/ui/button';
	import * as Select from '$components/ui/select/index.js';
	import toast from 'svelte-5-french-toast';
	import { Player } from '$lib/player.svelte';
	import UserIcon from 'lucide-svelte/icons/user';
	import PlusIcon from 'lucide-svelte/icons/plus';
	import TrashIcon from 'lucide-svelte/icons/trash-2';
	import EditIcon from 'lucide-svelte/icons/edit-2';
	import SaveIcon from 'lucide-svelte/icons/check';
	import UsersIcon from 'lucide-svelte/icons/users';

	const {
		players = $bindable(),
		playerStats = $bindable(),
		teams = $bindable(),
		tournament
	} = $props();

	interface PlayerRow {
		id?: number | string;
		name: string;
		event_id: number | string;
		gender: 'male' | 'female' | null;
		state: 'active' | 'inactive';
		created_at?: string;
		updated_at?: string;
	}

	let newPlayerName = $state('');
	let newPlayerGender = $state<'male' | 'female'>('male');
	let editingPlayerId = $state<string | number | null>(null);

	// Use derived state that properly tracks changes
	let currentPlayers = $derived(players?.players ?? []);
	let isKingQueen = $derived(tournament?.tournament_type === 'king-and-queen');

	async function createPlayer() {
		if (!newPlayerName.trim()) {
			toast.error('Player name cannot be empty');
			return;
		}

		if (players.players.findIndex((p: { name: string }) => p.name === newPlayerName) !== -1) {
			toast.error('Player already exists');
			return;
		}

		try {
			const newPlayer: Partial<PlayerRow> = {
				name: newPlayerName,
				event_id: tournament.id,
				gender: isKingQueen ? newPlayerGender : null,
				state: 'active',
				skill_level: null
			};

			const newPlayerInstance = await players.create(newPlayer);
			if (newPlayerInstance) {
				players.players = [...players.players, newPlayerInstance];
			}

			toast.success(`Player ${newPlayerName} added`);
			newPlayerName = '';
			newPlayerGender = 'male';
		} catch (err) {
			if (isHttpError(err)) {
				toast.error(err.body.message);
			} else {
				toast.error('Something went wrong');
			}
		}
	}

	async function deletePlayer(player: Player) {
		try {
			await player.delete(player);
			players.players = players.players.filter(
				(p: { id: number | undefined }) => p.id !== player.id
			);

			toast.success(`Player ${player.name} removed`);
		} catch (err: any) {
			toast.error(err?.body?.message ?? `Something went wrong: ${err}`);
		}
	}

	async function updatePlayer(player: Player) {
		if (!player.name.trim()) {
			toast.error('Player name cannot be empty');
			return;
		}

		try {
			const res = await player.update(player);
			if (res) {
				toast.success(`Player ${player.name} updated`);
				editingPlayerId = null;
			}
		} catch (err: any) {
			toast.error((err as HttpError).toString());
		}
	}

	// Load players and player stats when component mounts
	onMount(async () => {
		if (tournament?.id && players?.load && playerStats?.loadByEvent) {
			try {
				// Only load if not already loaded
				if (!players.players || players.players.length === 0) {
					await players.load(tournament.id);
				}
				if (!playerStats.stats || playerStats.stats.length === 0) {
					await playerStats.loadByEvent(tournament.id);
				}
			} catch (err) {
				console.error('Error loading players/stats:', err);
			}
		}
	});
</script>

<!-- Simplified player management for mix-and-match tournaments -->
<div class="mx-auto max-w-5xl space-y-6 p-4">
	<!-- Player Management Section -->
	<div
		class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
	>
		<div
			class="border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900"
		>
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-md"
				>
					<UsersIcon class="h-5 w-5 text-white" />
				</div>
				<div>
					<h2 class="text-lg font-bold text-slate-900 dark:text-white">Player Roster</h2>
					<p class="text-sm text-slate-600 dark:text-slate-400">Manage tournament participants</p>
				</div>
			</div>
		</div>

		<div class="p-6">
			<!-- Add Player Form -->
			<div class="mb-6 flex flex-col gap-3 sm:flex-row">
				<Input
					type="text"
					id="newPlayer"
					class="h-11 flex-1 rounded-xl border-slate-300 bg-white text-sm shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-500"
					placeholder="Enter player name..."
					onkeydown={(e) => {
						if (e?.key === 'Enter') {
							createPlayer();
						} else if (e?.key === 'Escape') {
							newPlayerName = '';
							if (e.target) (e.target as HTMLElement).blur();
						}
					}}
					bind:value={newPlayerName}
				/>

				{#if isKingQueen}
					<Select.Root
						type="single"
						bind:value={newPlayerGender}
						onValueChange={(value) => {
							if (value) {
								newPlayerGender = value;
							}
						}}
					>
						<Select.Trigger
							class="h-11 w-full rounded-xl border-slate-300 bg-white text-sm font-medium shadow-sm transition-all hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:w-36 dark:border-slate-600 dark:bg-slate-900 dark:hover:border-slate-500"
						>
							{newPlayerGender === 'male' ? '♂ Male' : '♀ Female'}
						</Select.Trigger>
						<Select.Content
							class="rounded-xl border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
						>
							<Select.Item
								value="male"
								label="♂ Male"
								class="cursor-pointer rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
							/>
							<Select.Item
								value="female"
								label="♀ Female"
								class="cursor-pointer rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
							/>
						</Select.Content>
					</Select.Root>
				{/if}

				<Button
					onclick={createPlayer}
					class="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg focus:ring-4 focus:ring-slate-500/30 focus:outline-none dark:bg-slate-700 dark:hover:bg-slate-600"
				>
					<PlusIcon class="h-4 w-4" />
					<span>Add Player</span>
				</Button>
			</div>

			<!-- Player List -->
			{#if currentPlayers.length === 0}
				<div
					class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-12 text-center dark:border-slate-600 dark:bg-slate-900/50"
				>
					<div
						class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700"
					>
						<UserIcon class="h-8 w-8 text-slate-400 dark:text-slate-500" />
					</div>
					<h3 class="mb-2 text-base font-bold text-slate-700 dark:text-slate-300">
						No players yet
					</h3>
					<p class="text-sm text-slate-500 dark:text-slate-400">
						Add your first player to get started
					</p>
				</div>
			{:else}
				<div
					class="overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-700"
				>
					<Table.Root class="w-full">
						<Table.Header>
							<Table.Row
								class="border-b border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900"
							>
								<Table.Head
									class="py-3.5 text-left text-xs font-bold tracking-wide text-slate-700 uppercase dark:text-slate-300"
								>
									Player Name
								</Table.Head>
								{#if isKingQueen}
									<Table.Head
										class="w-32 py-3.5 text-left text-xs font-bold tracking-wide text-slate-700 uppercase dark:text-slate-300"
									>
										Gender
									</Table.Head>
								{/if}
								<Table.Head
									class="w-28 py-3.5 text-right text-xs font-bold tracking-wide text-slate-700 uppercase dark:text-slate-300"
								>
									Actions
								</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each currentPlayers as player (player.id)}
								<Table.Row
									class="border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
								>
									<Table.Cell class="py-4">
										{#if editingPlayerId === player.id}
											<div class="flex items-center gap-2">
												<Input
													class="h-9 rounded-lg border-slate-300 bg-white text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
													type="text"
													bind:value={player.name}
													onkeydown={(e) => {
														if (e?.key === 'Enter') {
															updatePlayer(player);
														} else if (e?.key === 'Escape') {
															editingPlayerId = null;
															if (e.target) (e.target as HTMLElement).blur();
															toast.success('Edit canceled');
														}
													}}
												/>
												<Button
													onclick={() => updatePlayer(player)}
													class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white p-0 text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
													title="Save"
												>
													<SaveIcon class="h-4 w-4" />
												</Button>
											</div>
										{:else}
											<span class="text-sm font-semibold text-slate-900 dark:text-slate-100">
												{player.name}
											</span>
										{/if}
									</Table.Cell>

									{#if isKingQueen}
										<Table.Cell class="py-4">
											<span
												class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-300"
											>
												{player.gender === 'male' ? '♂ Male' : '♀ Female'}
											</span>
										</Table.Cell>
									{/if}

									<Table.Cell class="py-4 text-right">
										<div class="inline-flex gap-1.5">
											{#if editingPlayerId !== player.id}
												<Button
													onclick={() => (editingPlayerId = player.id)}
													class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white p-0 text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 focus:ring-2 focus:ring-slate-500/20 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
													title="Edit player"
												>
													<EditIcon class="h-4 w-4" />
												</Button>
											{/if}
											<Button
												onclick={() => deletePlayer(player)}
												class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 bg-white p-0 text-red-600 shadow-sm transition-all hover:bg-red-50 hover:text-red-700 focus:ring-2 focus:ring-red-500/20 focus:outline-none dark:border-red-800 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
												title="Delete player"
											>
												<TrashIcon class="h-4 w-4" />
											</Button>
										</div>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>

				<!-- Player Stats Footer -->
				<div
					class="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-900/50"
				>
					<div class="flex items-center gap-2">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700"
						>
							<UsersIcon class="h-4 w-4 text-slate-600 dark:text-slate-400" />
						</div>
						<span class="text-sm font-semibold text-slate-700 dark:text-slate-300">
							{currentPlayers.length} player{currentPlayers.length !== 1 ? 's' : ''} total
						</span>
					</div>
					{#if isKingQueen}
						<div
							class="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400"
						>
							<span class="flex items-center gap-1.5">
								<span class="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
								{currentPlayers.filter((p) => p.gender === 'male').length} male
							</span>
							<span class="flex items-center gap-1.5">
								<span class="inline-block h-2 w-2 rounded-full bg-pink-500"></span>
								{currentPlayers.filter((p) => p.gender === 'female').length} female
							</span>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
