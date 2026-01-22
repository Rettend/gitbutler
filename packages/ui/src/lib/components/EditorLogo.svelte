<script lang="ts">
	import antigravityLogoSvg from '$lib/assets/antigravity.svg?raw';
	import claudeLogoSvg from '$lib/assets/claude.svg?raw';
	import cursorLogoSvg from '$lib/assets/cursor.svg?raw';
	import opencodeDarkLogoSvg from '$lib/assets/opencode-dark.svg?raw';
	import opencodeLightLogoSvg from '$lib/assets/opencode-light.svg?raw';
	import vsCodeInsidersLogoSvg from '$lib/assets/vscode-insiders.svg?raw';
	import vsCodeLogoSvg from '$lib/assets/vscode.svg?raw';

	type Props = {
		name: 'antigravity' | 'vscode' | 'cursor' | 'claude' | 'opencode' | (string & {});
		size?: 'default' | 'large';
		theme?: 'light' | 'dark';
	};

	const { name, size = 'default', theme = 'dark' }: Props = $props();
	const isAntigravity = $derived(name.toLowerCase().includes('antigravity'));
	const isCursor = $derived(name.toLowerCase().includes('cursor'));
	const isOpenCode = $derived(name.toLowerCase().includes('opencode'));
	const vsCodeKeywords = ['vscode', 'visual studio code'];
	const isVsCode = $derived(vsCodeKeywords.some((keyword) => name.toLowerCase().includes(keyword)));
	const isVsCodeInsiders = $derived(isVsCode && name.toLowerCase().includes('insiders'));
	const isClaude = $derived(name.toLowerCase().includes('claude'));
</script>

<div class="editor-logo" class:large={size === 'large'}>
	{#if isAntigravity}
		{@html antigravityLogoSvg}
	{:else if isOpenCode}
		{@html theme === 'light' ? opencodeLightLogoSvg : opencodeDarkLogoSvg}
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
