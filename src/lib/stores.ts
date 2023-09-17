import { writable } from 'svelte/store';

// We cache our state in a store so we don't refresh on navigation (we do on refresh)
export const state = writable({});
