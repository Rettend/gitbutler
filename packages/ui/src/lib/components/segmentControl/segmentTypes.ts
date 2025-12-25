import type { Writable } from 'svelte/store';

export interface SegmentContext {
	selectedSegmentId: Writable<string | undefined>;
	disabled: Writable<boolean>;
	registerSegment(id: string): void;
	selectSegment(id: string): void;
}
