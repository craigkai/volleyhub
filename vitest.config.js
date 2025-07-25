import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST }), tailwindcss()],
	test: {
		includeSource: ['src/**/*.{.js,ts}'],
		globals: true,
		coverage: {
			reporter: ['text', 'lcov']
		},
		server: {
			deps: {
				inline: []
			}
		}
	},
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib'),
			$supabaseTypes: path.resolve('src/types/supabase'),
			$schemas: path.resolve('src/schemas'),
			$components: path.resolve('src/components')
		}
	}
});
