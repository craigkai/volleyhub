<script lang="ts">
	import type { PageData } from '$types';
	import { Hamburger } from 'svelte-hamburgers';

	export let data: PageData;

	let open: boolean = true;

	async function getCurrentUser() {
		return await data.supabase.auth.getUser();
	}
	let currentUserPromise = getCurrentUser();
</script>

<div class="absolute end-0 lg:hidden">
	<Hamburger bind:open --color="white" />
</div>

<header class="w-full">
	<!-- Navigation bar -->
	<div class="bg-blue-500 p-4">
		<a href="/" class="flex">
			<img class="h-20 w-20 p-2" src="/vball.svg" alt="volleyman" />
			<h1 class="flex justify-center items-center text-5l text-white front-extrabold">
				Volleyman(ager)<span
					class="bg-blue-100 text-blue-800 text-2xl front-semibold px-2.5 py-0.5
				rounded ml-2">Beta</span
				>
			</h1>
		</a>

		{#if open}
			<nav
				class="relative flex w-full items-center justify-between bg-white py-2 text-neutral-600 shadow-lg hover:text-neutral-700 focus:text-neutral-700 dark:bg-blue-400 dark:text-neutral-200 md:flex-wrap md:justify-start"
			>
				<div class="flex w-full flex-wrap items-center justify-between px-3">
					<div class="flex items-center">
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

								{#await currentUserPromise then currentuser}
									{#if currentuser?.data?.user?.aud === 'authenticated'}
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

										<li class="mb-4 lg:mb-0 lg:pr-2" data-te-nav-item-ref>
											<a
												class="block transition duration-150 ease-in-out hover:text-neutral-700 focus:text-neutral-700 disabled:text-black/30 dark:hover:text-white dark:focus:text-white lg:p-2 [&.active]:text-black/90"
												href="/protected-routes/profile"
												data-te-nav-link-ref
												data-te-ripple-init
												data-te-ripple-color="light"
												>{currentuser?.data?.user?.email}'s Profile
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
								{/await}
							</ul>
						</div>
					</div>
				</div>
			</nav>
		{/if}
	</div>
</header>
