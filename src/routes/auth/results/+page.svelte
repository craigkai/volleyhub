<script>
	import { CheckCircle, Mail, Shield, UserCheck, ArrowRight, Settings } from 'lucide-svelte';
	import { Button } from '$components/ui/button';
	import * as Card from '$components/ui/card';
	import { Badge } from '$components/ui/badge';
	import { onMount } from 'svelte';

	const { data } = $props();
	const { type, next } = data;

	onMount(async () => {
		// Only attempt session exchange if code is present
		const url = new URL(window.location.href);
		const code = url.searchParams.get('code');

		if (code) {
			const { error } = await data.supabase.auth.exchangeCodeForSession(code);
			if (error) {
				console.error('Session exchange failed:', error.message);
				// Optionally show an error UI or toast here
			}
			// Optional: auto-redirect
			// goto(next || '/protected-routes/application');
		}
	});

	const authConfig = $derived.by(() => {
		switch (type) {
			case 'magic':
				return {
					icon: Mail,
					title: 'Check Your Email',
					message: "We've sent a magic link to your email. Click it to sign in.",
					badge: 'Magic Link Sent',
					color: 'from-purple-500 to-pink-500'
				};
			case 'oauth':
				return {
					icon: Shield,
					title: 'OAuth Success!',
					message: "You've successfully signed in using your provider.",
					badge: 'OAuth Provider',
					color: 'from-blue-500 to-cyan-500'
				};
			case 'signup':
				return {
					icon: UserCheck,
					title: 'Almost There!',
					message: 'Your account is almost ready — check your email to confirm your address.',
					badge: 'Email Verification',
					color: 'from-orange-500 to-red-500'
				};
			case 'verify':
				return {
					icon: Shield,
					title: 'Account Not Verified',
					message: 'Your account is pending approval by an admin.',
					badge: 'Verification Required',
					color: 'from-yellow-500 to-orange-500'
				};
			default:
				return {
					icon: CheckCircle,
					title: 'Welcome!',
					message: "You've successfully signed in to your account.",
					badge: 'Sign In',
					color: 'from-emerald-500 to-teal-500'
				};
		}
	});
</script>

<div
	class="flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 dark:from-gray-900 dark:to-gray-800"
>
	<div class="w-full max-w-md">
		<!-- Success Animation Container -->
		<div class="mb-8 text-center">
			<div class="relative inline-flex items-center justify-center">
				<!-- Animated Background Circle -->
				<div
					class="absolute inset-0 bg-gradient-to-r {authConfig.color} scale-110 animate-pulse rounded-full opacity-20"
				></div>

				<!-- Icon Container -->
				<div
					class="relative rounded-full border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800"
				>
					<authConfig.icon class="h-12 w-12 text-emerald-500" />
				</div>
			</div>
		</div>

		<!-- Main Card -->
		<Card.Root
			class="animate-fade-in-up border-0 bg-white/80 shadow-xl backdrop-blur-sm dark:bg-gray-800/80"
		>
			<Card.Header class="pb-4 text-center">
				<div class="mb-3 flex justify-center">
					<Badge
						variant="secondary"
						class="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
					>
						{authConfig.badge}
					</Badge>
				</div>

				<Card.Title class="text-2xl font-bold text-gray-900 dark:text-white">
					{authConfig.title}
				</Card.Title>

				<Card.Description class="mt-2 text-base text-gray-600 dark:text-gray-300">
					{authConfig.message}
				</Card.Description>
			</Card.Header>

			{#if type === 'magic' || type === 'signup' || type === 'reset' || type === 'verify'}
				<Card.Content class="space-y-4">
					<Button
						href="/auth"
						variant="outline"
						class="group h-12 w-full border-gray-300 transition-colors duration-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
					>
						<span>Back to Login</span>
					</Button>
				</Card.Content>
			{:else}
				<Card.Content class="space-y-4">
					<Button
						href={next || '/protected-routes/application'}
						class="group h-12 w-full bg-gradient-to-r from-emerald-500 to-teal-500 font-semibold text-white shadow-lg transition-all duration-200 hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl"
					>
						<span>Continue to Application</span>
						<ArrowRight class="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
					</Button>

					<Button
						href="/protected-routes/account"
						variant="outline"
						class="group h-12 w-full border-gray-300 transition-colors duration-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
					>
						<Settings class="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
						<span>Manage Your Account</span>
					</Button>
				</Card.Content>
			{/if}
		</Card.Root>

		<div class="mt-6 text-center">
			<p class="text-sm text-gray-500 dark:text-gray-400">
				Need help?
				<a
					href="/support"
					class="font-medium text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
				>
					Contact Support
				</a>
			</p>
		</div>
	</div>
</div>

<style>
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	:global(.animate-fade-in-up) {
		animation: fadeInUp 0.6s ease-out;
	}
</style>
