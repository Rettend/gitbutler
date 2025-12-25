<script lang="ts">
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import type { SegmentContext } from '$components/segmentControl/segmentTypes';
	import type { Snippet } from 'svelte';

	interface SegmentProps {
		selected?: string;
		fullWidth?: boolean;
		shrinkable?: boolean;
		size?: 'default' | 'small';
		disabled?: boolean;
		onselect?: (id: string) => void;
		children: Snippet;
	}

	const {
		selected,
		fullWidth = false,
		shrinkable = false,
		size = 'default',
		disabled = false,
		onselect,
		children
	}: SegmentProps = $props();

	const registeredSegments: string[] = [];
	const selectedSegmentId = writable<string | undefined>(selected);
	const disabledStore = writable<boolean>(disabled);

	// Sync external selected prop to internal store
	$effect(() => {
		if (selected !== undefined) {
			selectedSegmentId.set(selected);
		}
	});

	// Sync external disabled prop to internal store
	$effect(() => {
		disabledStore.set(disabled);
	});

	const context: SegmentContext = {
		selectedSegmentId,
		disabled: disabledStore,
		registerSegment: (id: string) => {
			if (!registeredSegments.includes(id)) {
				registeredSegments.push(id);
				// If no segment is selected, select the first one (silent initialization, do not call onselect)
				if ($selectedSegmentId === undefined) {
					selectedSegmentId.set(id);
					// Do not call onselect here to avoid side effects before user interaction
				}
			}
		},
		selectSegment: (id: string) => {
			selectedSegmentId.set(id);
			onselect?.(id);
		}
	};

	setContext<SegmentContext>('SegmentControl', context);
</script>

<div
	class="segment-control-container"
	class:shrinkable
	class:small={size === 'small'}
	class:full-width={fullWidth}
>
	{@render children()}
</div>
