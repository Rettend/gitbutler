import { writable, type Writable, type Readable } from 'svelte/store';
import type { IBackend } from '$lib/backend';
import type { Settings } from '$lib/settings/userSettings';

let systemTheme: string | null;
let selectedTheme: string | undefined;

const effectiveThemeStore = writable<'light' | 'dark'>('dark');

export const effectiveTheme: Readable<'light' | 'dark'> = {
	subscribe: effectiveThemeStore.subscribe
};

export function initTheme(userSettings: Writable<Settings>, backend: IBackend) {
	backend.systemTheme.subscribe((theme) => {
		systemTheme = theme;
		updateDom();
	});
	userSettings.subscribe((s) => {
		selectedTheme = s.theme;
		updateDom();
	});
}

function updateDom() {
	const docEl = document.documentElement;
	if (
		selectedTheme === 'dark' ||
		(selectedTheme === 'system' && systemTheme === 'dark') ||
		(selectedTheme === undefined && systemTheme === 'dark')
	) {
		docEl.classList.remove('light');
		docEl.classList.add('dark');
		docEl.style.colorScheme = 'dark';
		effectiveThemeStore.set('dark');
	} else if (
		selectedTheme === 'light' ||
		(selectedTheme === 'system' && systemTheme === 'light') ||
		(selectedTheme === undefined && systemTheme === 'light')
	) {
		docEl.classList.remove('dark');
		docEl.classList.add('light');
		docEl.style.colorScheme = 'light';
		effectiveThemeStore.set('light');
	}
}
