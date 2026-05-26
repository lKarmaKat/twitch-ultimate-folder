import { writable } from 'svelte/store';

export const parentFinalizeEvent = writable(false);
export const configChangeEvent = writable(null);
export const alignmentLeft = writable(true);
export const portConnected = writable(false);