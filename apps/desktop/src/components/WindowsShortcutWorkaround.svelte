<script lang="ts">
	/**
	 * On Windows, Tauri menu accelerators don't work. It seems to be a bug in Tauri.
	 * This component provides a frontend workaround by listening for keyboard shortcuts
	 * and emitting the same events that the ShortcutService expects.
	 * @see https://github.com/tauri-apps/wry/issues/451
	 */
	import { BACKEND } from '$lib/backend';
	import { SHORTCUT_SERVICE } from '$lib/shortcuts/shortcutService';
	import { createKeybind } from '$lib/utils/hotkeys';
	import { inject } from '@gitbutler/core/context';
	import { onMount } from 'svelte';

	const backend = inject(BACKEND);
	const shortcutService = inject(SHORTCUT_SERVICE);

	const isWindows = $derived(backend.platformName === 'windows');

	const shortcuts: Record<string, string> = {
		'$mod+Shift+KeyH': 'history',
		'$mod+Shift+KeyA': 'open-in-vscode',
		'$mod+Shift+KeyF': 'show-in-finder',
		'$mod+Shift+KeyG': 'open-on-github',
		'$mod+Period': 'project-settings',
		'$mod+KeyT': 'switch-theme',
		'$mod+Backslash': 'toggle-sidebar',
		'$mod+Equal': 'zoom-in',
		'$mod+Minus': 'zoom-out',
		'$mod+Digit0': 'zoom-reset',
		'$mod+KeyB': 'create-branch',
		'$mod+Shift+KeyB': 'create-dependent-branch',
		'$mod+KeyO': 'add-local-repo',
		'$mod+Shift+KeyO': 'clone-repo',
		// Sidebar
		'$mod+Digit1': 'navigate-workspace',
		'$mod+Digit2': 'navigate-branches',
		'$mod+Digit3': 'navigate-history',
		'$mod+Comma': 'global-settings'
	};

	function emitShortcut(name: string) {
		shortcutService.emit(name);
	}

	const keybindHandlers: Record<string, (e: KeyboardEvent) => void> = {};
	for (const [combo, shortcutName] of Object.entries(shortcuts)) {
		keybindHandlers[combo] = (e: KeyboardEvent) => {
			e.preventDefault();
			emitShortcut(shortcutName);
		};
	}

	const handleKeyDown = createKeybind(keybindHandlers);

	onMount(() => {
		if (!isWindows) return;

		function handler(e: KeyboardEvent) {
			handleKeyDown(e);
		}

		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	});
</script>
