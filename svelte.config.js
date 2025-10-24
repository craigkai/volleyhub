import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { execSync } from 'child_process';
import path from 'path';

// Get commit ref from Vercel environment variable or git command
// Vercel provides VERCEL_GIT_COMMIT_SHA during builds
try {
	process.env.VITE_COMMIT_REF =
		process.env.VERCEL_GIT_COMMIT_SHA || execSync('git rev-parse HEAD').toString().trim();
} catch (error) {
	// Fallback for environments without git (e.g., some CI/CD systems)
	process.env.VITE_COMMIT_REF = 'unknown';
	console.warn('Could not determine git commit ref:', error.message);
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: [vitePreprocess({ sourceMap: true })],
	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter(),
		alias: {
			$lib: path.resolve('src/lib'),
			$components: path.resolve('src/components'),
			$supabaseTypes: path.resolve('src/types/supabase'),
			$schemas: path.resolve('src/schemas')
		}
	}
};

export default config;
