<script lang="ts">
	import { Hamburger } from 'svelte-hamburgers';
	import { Button } from '$components/ui/button';
	import { fade } from 'svelte/transition';
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';
	import { toggleMode } from 'mode-watcher';
	import {
		ChevronDown,
		ClipboardListIcon,
		LayoutDashboard,
		LogOut,
		UserCircle,
		UserCog
	} from 'lucide-svelte';
	import { onMount } from 'svelte';

	let { isMobile, user, is_admin } = $props();

	let open: boolean = $state(!isMobile);
	let isUserMenuOpen = $state(false);

	let userDropdownRef: HTMLDivElement | null = $state(null);

	onMount(() => {
		const mediaQuery = window.matchMedia('(max-width: 768px)');
		isMobile = mediaQuery.matches;

		mediaQuery.addEventListener('change', (e) => {
			isMobile = e.matches;
		});
	});

	export function clickOutside(node: HTMLElement, callback: () => void) {
		function handleClick(event: MouseEvent) {
			if (!node.contains(event.target as Node)) {
				callback();
			}
		}

		document.addEventListener('click', handleClick, true);

		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
			}
		};
	}

	function toggleMenu() {
		if (isMobile) isUserMenuOpen = !isUserMenuOpen;
	}
</script>

<header class="w-full">
	<div class="bg-blue-500 p-4 dark:bg-slate-900">
		<div class="flex w-[300px]">
			<a href="/" aria-label="Open navigation menu">
				<svg
					class="h-20 w-20 p-2 dark:fill-blue-600"
					fill="#000000"
					height="800px"
					width="800px"
					version="1.1"
					id="Layer_1"
					xmlns="http://www.w3.org/2000/svg"
					xmlns:xlink="http://www.w3.org/1999/xlink"
					viewBox="0 0 512 512"
					xml:space="preserve"
				>
					<g>
						<g>
							<path
								d="M509.568,222.003c-0.051-0.265-0.026-0.538-0.094-0.802C496.58,127.59,432.563,47.044,341.871,14.763    c-4.429-1.587-9.318,0.734-10.897,5.171c-1.579,4.446,0.734,9.318,5.18,10.897c74.411,26.496,129.527,87.834,149.973,161.638    C432.256,134.093,362.01,93.44,284.638,76.049c8.149-19.985,18.253-39.194,30.353-57.293c1.621-2.415,1.894-5.487,0.734-8.149    c-1.152-2.662-3.584-4.548-6.451-5.018C307.866,5.367,274.551,0,256,0C197.291,0,143.164,19.917,99.925,53.291    c-0.282,0.23-0.597,0.401-0.853,0.666C38.852,100.838,0,173.943,0,256c0,16.444,1.579,32.913,4.676,48.939    c0.794,4.079,4.361,6.912,8.371,6.912c0.538,0,1.084-0.051,1.63-0.154c4.634-0.896,7.654-5.376,6.758-10.001    c-2.901-14.959-4.369-30.336-4.369-45.696c0-65.263,26.325-124.476,68.89-167.646c-23.637,75.87-23.748,157.065-0.12,232.806    c-21.385,2.935-43.068,3.797-64.785,2.355c-2.816-0.222-5.547,1.033-7.287,3.26c-1.732,2.219-2.261,5.163-1.408,7.851    C46.191,440.721,144.111,512,256,512c61.372,0,120.738-22.059,167.159-62.106c3.567-3.081,3.968-8.465,0.887-12.041    c-3.081-3.567-8.465-3.959-12.032-0.887c-43.332,37.385-98.739,57.967-156.015,57.967c-20.804,0-41.045-2.782-60.45-7.791    c77.645-17.425,148.122-57.95,201.967-116.361c13.235,17.05,24.815,35.396,34.432,54.929c1.246,2.534,3.661,4.284,6.46,4.676    c0.401,0.06,0.802,0.085,1.195,0.085c2.381,0,4.685-0.998,6.315-2.79C488.533,380.809,512,319.838,512,256    C512,244.506,511.07,233.182,509.568,222.003z M256,17.067c10.317,0,26.359,1.92,37.598,3.465    c-41.882,68.309-58.325,149.879-46.703,231.714c-20.591,16.137-42.607,29.705-65.655,40.55    c-22.63-92.723-9.182-189.099,38.272-272.947C231.415,18.014,243.601,17.067,256,17.067z M112.273,65.271    c25.079-18.944,53.99-33.058,85.35-40.96c-44.373,85.461-55.723,182.298-32.247,275.43c-20.267,8.286-41.199,14.515-62.532,18.611    C76.51,235.819,79.787,146.355,112.273,65.271z M69.444,405.692c-15.292-19.132-27.81-40.789-36.762-64.546    c80.154,2.167,159.386-24.286,224.623-75.383c24.269,9.754,47.027,22.042,67.951,36.574    C256.196,368.367,165.897,404.932,69.444,405.692z M162.287,475.896c-29.423-12.45-55.919-30.652-78.029-53.495    c96.307-4.25,185.95-42.829,254.933-109.807c17.323,13.414,33.178,28.433,47.386,44.86    C328.183,421.623,248.909,463.556,162.287,475.896z M441.395,406.801c-38.187-70.656-100.719-125.884-177.587-156.817    c-3.686-25.899-4.429-51.755-2.295-77.141c91.571,26.761,168.294,86.554,217.182,169.515    C469.726,365.542,457.301,387.345,441.395,406.801z M485.794,321.195c-51.831-81.109-129.997-139.324-222.37-165.564    c2.953-21.692,8.03-42.931,15.147-63.454c84.599,18.449,160.418,65.98,214.391,134.622c1.195,9.617,1.971,19.337,1.971,29.201    C494.933,278.306,491.725,300.186,485.794,321.195z"
							/>
						</g>
					</g>
				</svg>
			</a>

			<h1 class="text-5l flex items-center font-extrabold text-white">
				<span
					class="ml-2 rounded bg-blue-100 px-2.5 py-0.5 text-2xl
				font-semibold text-blue-800 dark:bg-blue-600 dark:text-gray-200">VolleyHub</span
				>
			</h1>

			<div class="absolute end-0">
				<Hamburger bind:open --color="white" />
			</div>
		</div>

		{#if open}
			<nav
				class="relative flex w-full items-center justify-between rounded bg-white py-2 text-neutral-600 shadow-lg hover:text-neutral-700 focus:text-neutral-700 md:flex-wrap md:justify-start dark:bg-gray-800 dark:text-gray-200"
				transition:fade={{ duration: 300 }}
			>
				<div class="flex w-full flex-wrap items-center justify-between px-3">
					<div class="flex flex-row items-center gap-6">
						<a class="transition hover:text-neutral-700 dark:hover:text-white" href="/"> Home </a>
					</div>

					<div class="ml-auto flex flex-row items-center gap-4">
						<Button onclick={toggleMode} variant="outline" size="icon">
							<Sun
								class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
							/>
							<Moon
								class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
							/>
							<span class="sr-only">Toggle theme</span>
						</Button>
						{#if user?.aud === 'authenticated'}
							<div
								bind:this={userDropdownRef}
								class="relative inline-block"
								use:clickOutside={() => (isUserMenuOpen = false)}
								onpointerenter={() => {
									if (!isMobile) isUserMenuOpen = true;
								}}
								onpointerleave={() => {
									if (!isMobile) isUserMenuOpen = false;
								}}
							>
								<Button
									onclick={toggleMenu}
									class="flex items-center gap-2 px-3 py-2 text-sm font-medium"
								>
									<UserCircle class="h-5 w-5" />
									<span class="max-w-[150px] truncate">{user?.email}</span>
									<ChevronDown
										class="h-4 w-4 transition-transform duration-200 {isUserMenuOpen
											? 'rotate-180'
											: ''}"
									/>
								</Button>

								{#if isUserMenuOpen}
									<div
										class="absolute top-full right-0 z-50 w-56 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
										transition:fade={{ duration: 150 }}
									>
										<ul class="py-1">
											<li>
												<a
													href="/protected-routes/account"
													class="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
												>
													<UserCog class="h-5 w-5" />
													Manage Account
												</a>
											</li>
											<li>
												<a
													href="/protected-routes/dashboard"
													class="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
												>
													<LayoutDashboard class="h-5 w-5" />
													Dashboard
												</a>
											</li>

											{#if is_admin}
												<li>
													<a
														href="/protected-routes/approvals"
														class="flex items-center gap-3 px-4 py-3 text-sm text-blue-700 hover:bg-gray-100 dark:text-blue-300 dark:hover:bg-gray-700"
													>
														<ClipboardListIcon class="h-5 w-5" />
														User Approvals
													</a>
												</li>
											{/if}

											<li><div class="my-1 h-px bg-gray-200 dark:bg-gray-700"></div></li>

											<li>
												<form method="POST" action="/auth/signout">
													<Button
														type="submit"
														class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
													>
														<LogOut class="h-5 w-5" />
														Sign Out
													</Button>
												</form>
											</li>
										</ul>
									</div>
								{/if}
							</div>
						{:else}
							<a
								href="/auth"
								class="text-sm text-neutral-600 hover:text-neutral-800 dark:text-gray-200 dark:hover:text-white"
							>
								Login
							</a>
						{/if}
					</div>
				</div>
			</nav>
		{/if}
	</div>
</header>
