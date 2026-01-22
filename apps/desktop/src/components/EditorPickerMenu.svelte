<script lang="ts">
	import { getEnabledEditors, type EnabledCodeEditor, SETTINGS } from '$lib/settings/userSettings';
	import { effectiveTheme } from '$lib/utils/theme';
	import { inject } from '@gitbutler/core/context';
	import { ContextMenu, ContextMenuSection, EditorLogo } from '@gitbutler/ui';

	type Props = {
		onselect: (editor: EnabledCodeEditor) => void;
	};

	const { onselect }: Props = $props();

	const userSettings = inject(SETTINGS);
	const enabledEditors = $derived(getEnabledEditors($userSettings));

	let contextMenu: ReturnType<typeof ContextMenu> | undefined = $state();

	export function open(e?: MouseEvent | HTMLElement) {
		const firstEditor = enabledEditors[0];

		// If only one editor, select it directly
		if (enabledEditors.length === 1 && firstEditor) {
			onselect(firstEditor);
			return;
		}

		// If no editors enabled, do nothing
		if (!firstEditor) {
			return;
		}

		// Open the picker menu
		contextMenu?.open(e);
	}

	export function close() {
		contextMenu?.close();
	}

	function handleKeyDown(e: KeyboardEvent) {
		const num = parseInt(e.key);
		if (!isNaN(num) && num >= 1 && num <= enabledEditors.length) {
			const editor = enabledEditors[num - 1];
			if (editor) {
				e.preventDefault();
				onselect(editor);
				close();
			}
		}
	}

	function handleSelect(editor: EnabledCodeEditor) {
		onselect(editor);
		close();
	}
</script>

<svelte:window onkeydown={contextMenu?.isOpen() ? handleKeyDown : undefined} />

<ContextMenu bind:this={contextMenu} side="bottom" align="start">
	<ContextMenuSection>
		{#each enabledEditors as editor, idx}
			<button type="button" class="editor-picker-item" onclick={() => handleSelect(editor)}>
				<span class="editor-picker-key">{idx + 1}</span>
				<EditorLogo name={editor.schemeIdentifer} theme={$effectiveTheme} />
				<span class="editor-picker-label">{editor.displayName}</span>
			</button>
		{/each}
	</ContextMenuSection>
</ContextMenu>

<style lang="postcss">
	.editor-picker-item {
		display: flex;
		align-items: center;
		width: 100%;
		padding: 6px 8px;
		gap: 10px;
		border: none;
		border-radius: var(--radius-s);
		background: transparent;
		color: var(--clr-text-1);
		text-align: left;
		cursor: pointer;
		transition: background-color var(--transition-fast);

		&:hover {
			background-color: var(--hover-bg-2);
		}
	}

	.editor-picker-key {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: var(--radius-s);
		background-color: var(--clr-bg-3);
		color: var(--clr-text-2);
		font-weight: 600;
		font-size: 11px;
	}

	.editor-picker-label {
		flex: 1;
		font-size: 12px;
	}
</style>
