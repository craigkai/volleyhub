import { writable } from 'svelte/store';
import { Tournament } from './tournament';

// We store our loaded event as a writable store so that we can centrally subscribe to supabase
// and update when the database emits events.
export const event = writable<Tournament>();
