/** @type {import('tailwindcss').Config} */
export default {
	plugins: [require('flowbite/plugin')],
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}'
	],
	theme: {
		extend: {}
	}
};
