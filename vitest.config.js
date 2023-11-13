import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST })],
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
			$lib: path.resolve('./src/lib')
		}
	}
});
