import { writable } from 'svelte/store';

export const parentFinalizeEvent = writable(null);
export const configChangeEvent = writable(null);