import { ghQuery } from '$lib/forge/github/ghQuery';
import { providesList, ReduxTag } from '$lib/state/tags';
import type { RepoResult } from '$lib/forge/github/types';
import type { ForgeRepoService, RepoDetailedInfo, ForkInfo } from '$lib/forge/interface/forgeRepoService';
import type { ReactiveQuery } from '$lib/state/butlerModule';
import type { GitHubApi } from '$lib/state/clientState.svelte';

export class GitHubRepoService implements ForgeRepoService {
	private api: ReturnType<typeof injectEndpoints>;

	constructor(gitHubApi: GitHubApi) {
		this.api = injectEndpoints(gitHubApi);
	}

	getInfo(): ReactiveQuery<RepoDetailedInfo> {
		return this.api.endpoints.getRepos.useQuery(undefined, {
			transform: (result): RepoDetailedInfo => {
				const forkInfo: ForkInfo = {
					isFork: result.fork ?? false,
					parent: result.parent
						? {
								owner: result.parent.owner.login,
								name: result.parent.name,
								fullName: result.parent.full_name,
								cloneUrl: result.parent.clone_url,
								defaultBranch: result.parent.default_branch
							}
						: undefined
				};

				return {
					deleteBranchAfterMerge: result.delete_branch_on_merge,
					forkInfo
				};
			}
		});
	}
}

function injectEndpoints(api: GitHubApi) {
	return api.injectEndpoints({
		endpoints: (build) => ({
			getRepos: build.query<RepoResult, void>({
				queryFn: async (_, api) =>
					await ghQuery({
						domain: 'repos',
						action: 'get',
						extra: api.extra
					}),
				providesTags: [providesList(ReduxTag.PullRequests)]
			})
		})
	});
}
