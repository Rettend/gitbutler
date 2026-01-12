import type { ReactiveQuery } from '$lib/state/butlerModule';

/**
 * Information about a repository's fork relationship.
 */
export interface ForkInfo {
	/**
	 * Whether this repository is a fork of another repository.
	 */
	isFork: boolean;
	/**
	 * The parent repository this was forked from (immediate upstream).
	 * Only present if isFork is true.
	 */
	parent?: {
		owner: string;
		name: string;
		fullName: string;
		cloneUrl: string;
		defaultBranch: string;
	};
}

export interface RepoDetailedInfo {
	/**
	 * Whether the repository will delete the branch after merging the PR.
	 *
	 * `undefined` if unknown.
	 */
	deleteBranchAfterMerge: boolean | undefined;
	/**
	 * Fork information for this repository.
	 * Includes parent repo details if this is a fork.
	 */
	forkInfo?: ForkInfo;
}

export type ForgeRepoService = {
	getInfo(): ReactiveQuery<RepoDetailedInfo>;
};
