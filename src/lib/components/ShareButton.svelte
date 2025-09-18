<script lang="ts">
	import { Share } from 'lucide-svelte';
	import toast from 'svelte-5-french-toast';

	interface ShareData {
		title: string;
		text?: string;
		url: string;
	}

	let {
		title,
		text,
		url,
		variant = 'default',
		size = 'default'
	} = $props<{
		title: string;
		text?: string;
		url: string;
		variant?: 'default' | 'outline' | 'ghost';
		size?: 'default' | 'sm' | 'lg';
	}>();

	const shareData: ShareData = {
		title,
		text,
		url
	};

	async function handleShare() {
		try {
			if (navigator.share && navigator.canShare?.(shareData)) {
				await navigator.share(shareData);
			} else {
				// Fallback: copy to clipboard
				await navigator.clipboard.writeText(url);
				toast.success('Link copied to clipboard!');
			}
		} catch (error: any) {
			if (error.name !== 'AbortError') {
				// User didn't cancel, try clipboard fallback
				try {
					await navigator.clipboard.writeText(url);
					toast.success('Link copied to clipboard!');
				} catch {
					toast.error('Unable to share. Please copy the URL manually.');
				}
			}
		}
	}

	const baseClasses =
		'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';

	const variantClasses = {
		default: 'bg-blue-600 text-white hover:bg-blue-700',
		outline:
			'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
		ghost:
			'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
	};

	const sizeClasses = {
		default: 'h-10 px-4 py-2',
		sm: 'h-8 px-3 text-sm',
		lg: 'h-12 px-6 text-lg'
	};

	const iconSizes = {
		default: 16,
		sm: 14,
		lg: 18
	};
</script>

<button
	onclick={handleShare}
	class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]} gap-2"
	title="Share {title}"
>
	<Share size={iconSizes[size]} />
	Share
</button>
