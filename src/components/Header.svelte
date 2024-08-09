<script lang="ts">
	import { Hamburger } from 'svelte-hamburgers';
	import { Button } from '$components/ui/button';
	import { fade } from 'svelte/transition';
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';
	import { toggleMode } from 'mode-watcher';
	import { cn } from '$lib/utils';
	import OrbitingCircles from '$components/magic-ui/OribitingCircles.svelte';

	let { supabase, isMobile }: { supabase: any; isMobile: boolean } = $props();

	let open: boolean = $state(!isMobile);

	let currentUser: { data: { user: { aud: string } } } | undefined = $state();

	async function getCurrentUser() {
		currentUser = await supabase.auth.getUser();
	}

	supabase.auth.onAuthStateChange(() => {
		getCurrentUser();
	});
</script>

<header class="w-full">
	<!-- Navigation bar -->
	<div class="bg-blue-500 p-4 dark:bg-slate-900">
		<a href="/" class="flex">
			<div
				class={cn(
					'dark:text-gray-20 relative ml-8 flex h-[100px] w-full max-w-[8rem] items-center justify-center font-semibold text-blue-800'
				)}
			>
				<span
					class="whitespace-pre-wrap bg-gradient-to-b from-white to-blue-300/80 bg-clip-text text-center text-3xl font-semibold leading-none text-transparent dark:from-white dark:to-slate-900/10"
				>
					VolleyHub
				</span>

				<!--  Inner Circles  -->
				<OrbitingCircles
					class="h-[30px] w-[30px] border-none bg-transparent"
					duration={20}
					radius={80}
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"
						><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path
							d="M511.8 267.4c-26.1 8.7-53.4 13.8-81 15.1c9.2-105.3-31.5-204.2-103.2-272.4C434.1 41.1 512 139.5 512 256c0 3.8-.1 7.6-.2 11.4zm-3.9 34.7c-5.8 32-17.6 62-34.2 88.7c-97.5 48.5-217.7 42.6-311.9-24.5c23.7-36.2 55.4-67.7 94.5-91.8c79.9 43.2 170.1 50.8 251.6 27.6zm-236-55.5c-2.5-90.9-41.1-172.7-101.9-231.7C196.8 5.2 225.8 0 256 0c2.7 0 5.3 0 7.9 .1c90.8 60.2 145.7 167.2 134.7 282.3c-43.1-2.4-86.4-14.1-126.8-35.9zM138 28.8c20.6 18.3 38.7 39.4 53.7 62.6C95.9 136.1 30.6 220.8 7.3 316.9C2.5 297.4 0 277 0 256C0 157.2 56 71.5 138 28.8zm69.6 90.5c19.5 38.6 31 81.9 32.3 127.7C162.5 294.6 110.9 368.9 90.2 451C66 430.4 45.6 405.4 30.4 377.2c6.7-108.7 71.9-209.9 177.1-257.9zM256 512c-50.7 0-98-14.7-137.8-40.2c5.6-27 14.8-53.1 27.4-77.7C232.2 454.6 338.1 468.8 433 441c-46 44-108.3 71-177 71z"
						/></svg
					>
				</OrbitingCircles>
				<OrbitingCircles
					class="h-[30px] w-[30px] border-none bg-transparent"
					duration={20}
					radius={80}
					delay={-10}
				>
					<!-- Supabase -->
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"
						><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path
							d="M511.8 267.4c-26.1 8.7-53.4 13.8-81 15.1c9.2-105.3-31.5-204.2-103.2-272.4C434.1 41.1 512 139.5 512 256c0 3.8-.1 7.6-.2 11.4zm-3.9 34.7c-5.8 32-17.6 62-34.2 88.7c-97.5 48.5-217.7 42.6-311.9-24.5c23.7-36.2 55.4-67.7 94.5-91.8c79.9 43.2 170.1 50.8 251.6 27.6zm-236-55.5c-2.5-90.9-41.1-172.7-101.9-231.7C196.8 5.2 225.8 0 256 0c2.7 0 5.3 0 7.9 .1c90.8 60.2 145.7 167.2 134.7 282.3c-43.1-2.4-86.4-14.1-126.8-35.9zM138 28.8c20.6 18.3 38.7 39.4 53.7 62.6C95.9 136.1 30.6 220.8 7.3 316.9C2.5 297.4 0 277 0 256C0 157.2 56 71.5 138 28.8zm69.6 90.5c19.5 38.6 31 81.9 32.3 127.7C162.5 294.6 110.9 368.9 90.2 451C66 430.4 45.6 405.4 30.4 377.2c6.7-108.7 71.9-209.9 177.1-257.9zM256 512c-50.7 0-98-14.7-137.8-40.2c5.6-27 14.8-53.1 27.4-77.7C232.2 454.6 338.1 468.8 433 441c-46 44-108.3 71-177 71z"
						/></svg
					>
				</OrbitingCircles>

				<!-- Outer Circles (reverse)  -->
				<OrbitingCircles
					class="h-[45px] w-[45px] border-none bg-transparent"
					radius={160}
					duration={20}
					reverse
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"
						><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path
							d="M511.8 267.4c-26.1 8.7-53.4 13.8-81 15.1c9.2-105.3-31.5-204.2-103.2-272.4C434.1 41.1 512 139.5 512 256c0 3.8-.1 7.6-.2 11.4zm-3.9 34.7c-5.8 32-17.6 62-34.2 88.7c-97.5 48.5-217.7 42.6-311.9-24.5c23.7-36.2 55.4-67.7 94.5-91.8c79.9 43.2 170.1 50.8 251.6 27.6zm-236-55.5c-2.5-90.9-41.1-172.7-101.9-231.7C196.8 5.2 225.8 0 256 0c2.7 0 5.3 0 7.9 .1c90.8 60.2 145.7 167.2 134.7 282.3c-43.1-2.4-86.4-14.1-126.8-35.9zM138 28.8c20.6 18.3 38.7 39.4 53.7 62.6C95.9 136.1 30.6 220.8 7.3 316.9C2.5 297.4 0 277 0 256C0 157.2 56 71.5 138 28.8zm69.6 90.5c19.5 38.6 31 81.9 32.3 127.7C162.5 294.6 110.9 368.9 90.2 451C66 430.4 45.6 405.4 30.4 377.2c6.7-108.7 71.9-209.9 177.1-257.9zM256 512c-50.7 0-98-14.7-137.8-40.2c5.6-27 14.8-53.1 27.4-77.7C232.2 454.6 338.1 468.8 433 441c-46 44-108.3 71-177 71z"
						/></svg
					>
				</OrbitingCircles>
				<OrbitingCircles
					class="h-[45px] w-[45px] border-none bg-transparent"
					radius={160}
					duration={20}
					delay={-10}
					reverse
				>
					<!-- Github -->
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"
						><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path
							d="M511.8 267.4c-26.1 8.7-53.4 13.8-81 15.1c9.2-105.3-31.5-204.2-103.2-272.4C434.1 41.1 512 139.5 512 256c0 3.8-.1 7.6-.2 11.4zm-3.9 34.7c-5.8 32-17.6 62-34.2 88.7c-97.5 48.5-217.7 42.6-311.9-24.5c23.7-36.2 55.4-67.7 94.5-91.8c79.9 43.2 170.1 50.8 251.6 27.6zm-236-55.5c-2.5-90.9-41.1-172.7-101.9-231.7C196.8 5.2 225.8 0 256 0c2.7 0 5.3 0 7.9 .1c90.8 60.2 145.7 167.2 134.7 282.3c-43.1-2.4-86.4-14.1-126.8-35.9zM138 28.8c20.6 18.3 38.7 39.4 53.7 62.6C95.9 136.1 30.6 220.8 7.3 316.9C2.5 297.4 0 277 0 256C0 157.2 56 71.5 138 28.8zm69.6 90.5c19.5 38.6 31 81.9 32.3 127.7C162.5 294.6 110.9 368.9 90.2 451C66 430.4 45.6 405.4 30.4 377.2c6.7-108.7 71.9-209.9 177.1-257.9zM256 512c-50.7 0-98-14.7-137.8-40.2c5.6-27 14.8-53.1 27.4-77.7C232.2 454.6 338.1 468.8 433 441c-46 44-108.3 71-177 71z"
						/></svg
					>
				</OrbitingCircles>
			</div>
			<div class="absolute end-0">
				<Hamburger bind:open --color="white" />
			</div>
		</a>

		{#if open}
			<nav
				class="relative flex w-full items-center justify-between rounded bg-white py-2 text-neutral-600 shadow-lg hover:text-neutral-700 focus:text-neutral-700 dark:bg-gray-800 dark:text-gray-200 md:flex-wrap md:justify-start"
				transition:fade={{ duration: 300 }}
			>
				<div class="flex w-full flex-wrap items-center justify-between px-3">
					<div class="flex-row">
						<!-- Navigation links -->
						<div class="grow basis-[100%] items-center lg:!flex lg:basis-auto">
							<ul class="mr-auto flex flex-col lg:flex-row" data-te-navbar-nav-ref>
								<li class="mb-4 lg:mb-0 lg:pr-2" data-te-nav-item-ref>
									<a
										class="block transition duration-150 ease-in-out hover:text-neutral-700 focus:text-neutral-700 disabled:text-black/30 dark:hover:text-white dark:focus:text-white lg:p-2 [&.active]:text-black/90"
										href="/"
										data-te-nav-link-ref
										data-te-ripple-init
										data-te-ripple-color="light">Home</a
									>
								</li>

								{#if currentUser?.data?.user?.aud === 'authenticated'}
									<li class="mb-4 lg:mb-0 lg:pr-2" data-te-nav-item-ref>
										<a
											class="block transition duration-150 ease-in-out hover:text-neutral-700 focus:text-neutral-700 disabled:text-black/30 dark:hover:text-white dark:focus:text-white lg:p-2 [&.active]:text-black/90"
											href="/protected-routes/dashboard"
											data-te-nav-link-ref
											data-te-ripple-init
											data-te-ripple-color="light"
											>My Dashboard
										</a>
									</li>
								{:else}
									<li class="mb-4 lg:mb-0 lg:pr-2" data-te-nav-item-ref>
										<a
											class="block transition duration-150 ease-in-out hover:text-neutral-700 focus:text-neutral-700 disabled:text-black/30 dark:hover:text-white dark:focus:text-white lg:p-2 [&.active]:text-black/90"
											href="/auth"
											data-te-nav-link-ref
											data-te-ripple-init
											data-te-ripple-color="light"
											>Login
										</a>
									</li>
								{/if}
								<li data-te-nav-item-ref>
									<Button on:click={toggleMode} variant="outline" size="icon">
										<Sun
											class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
										/>
										<Moon
											class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
										/>
										<span class="sr-only">Toggle theme</span>
									</Button>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</nav>
		{/if}
	</div>
</header>
