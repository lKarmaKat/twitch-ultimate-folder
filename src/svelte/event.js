import { writable } from 'svelte/store';

export const parentFinalizeEvent = writable(false);
export const configChangeEvent = writable(null);