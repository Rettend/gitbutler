<script lang="ts">
	import { getFolderIcon, type Theme } from '$components/file/getFolderIcon';
	import { pxToRem } from '$lib/utils/pxToRem';

	interface Props {
		folderName: string;
		isOpen?: boolean;
		size?: number;
	}

	const { folderName, isOpen = false, size = 16 }: Props = $props();

	function getTheme(): Theme {
		if (typeof document !== 'undefined') {
			return document.documentElement.classList.contains('light') ? 'light' : 'dark';
		}
		return 'dark';
	}

	let theme = $state<Theme>('dark');

	$effect(() => {
		if (typeof document === 'undefined') return;

		theme = getTheme();

		const observer = new MutationObserver(() => {
			theme = getTheme();
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class']
		});

		return () => observer.disconnect();
	});
</script>

<img
	draggable="false"
	src={getFolderIcon(folderName, isOpen, theme)}
	alt=""
	class="folder-icon"
	style:--folder-icon-size="{pxToRem(size)}rem"
/>

<style lang="postcss">
	.folder-icon {
		width: var(--folder-icon-size);
		height: var(--folder-icon-size);
	}
</style>
