import { writable } from 'svelte/store';
import { Event } from './event';
import { Teams } from './teams';
import { Matches } from './matches';

// We store our loaded event as a writable store so that we can centrally subscribe to supabase
// and update when the database emits events.
export const event = writable<Event>();

export const matches = writable<Matches>();

export const teams = writable<Teams>();
