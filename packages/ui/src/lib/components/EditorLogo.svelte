<script lang="ts">
	import antigravityLogoSvg from '$lib/assets/antigravity.svg?raw';
	import claudeLogoSvg from '$lib/assets/claude.svg?raw';
	import cursorLogoSvg from '$lib/assets/cursor.svg?raw';
	import vsCodeInsidersLogoSvg from '$lib/assets/vscode-insiders.svg?raw';
	import vsCodeLogoSvg from '$lib/assets/vscode.svg?raw';

	type Props = {
		name: 'antigravity' | 'vscode' | 'cursor' | 'claude' | (string & {});
		size?: 'default' | 'large';
	};

	const { name, size = 'default' }: Props = $props();
	const isAntigravity = $derived(name.toLowerCase().includes('antigravity'));
	const isCursor = $derived(name.toLowerCase().includes('cursor'));
	const vsCodeKeywords = ['vscode', 'visual studio code'];
	const isVsCode = $derived(vsCodeKeywords.some((keyword) => name.toLowerCase().includes(keyword)));
	const isVsCodeInsiders = $derived(isVsCode && name.toLowerCase().includes('insiders'));
	const isClaude = $derived(name.toLowerCase().includes('claude'));
</script>

<div class="editor-logo" class:large={size === 'large'}>
	{#if isAntigravity}
		{@html antigravityLogoSvg}
	{:else if isCursor}
		{@html cursorLogoSvg}
	{:else if isVsCodeInsiders}
		{@html vsCodeInsidersLogoSvg}
	{:else if isVsCode}
		{@html vsCodeLogoSvg}
	{:else if isClaude}
		{@html claudeLogoSvg}
	{/if}
</div>

<style lang="postcss">
	.editor-logo {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		padding: 4px;
		border: 1px solid var(--clr-border-2);
		border-radius: 8px;
		background-color: var(--clr-core-gray-10);

		& :global(svg) {
			width: 100%;
			height: 100%;
		}
	}

	.editor-logo.large {
		width: 56px;
		height: 56px;
		padding: 8px;
		border-radius: 12px;
	}
</style>
