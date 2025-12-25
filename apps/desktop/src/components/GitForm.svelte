<script lang="ts">
	import CommitSigningForm from '$components/CommitSigningForm.svelte';
	import KeysForm from '$components/KeysForm.svelte';
	import ReduxResult from '$components/ReduxResult.svelte';
	import SettingsSection from '$components/SettingsSection.svelte';
	import { BACKEND } from '$lib/backend';
	import { BASE_BRANCH_SERVICE } from '$lib/baseBranch/baseBranchService.svelte';
	import { DEFAULT_FORGE_FACTORY } from '$lib/forge/forgeFactory.svelte';
	import { PROJECTS_SERVICE } from '$lib/project/projectsService';
	import { STACK_SERVICE } from '$lib/stacks/stackService.svelte';
	import { inject } from '@gitbutler/core/context';
	import { CardGroup, InfoMessage, SegmentControl, Spacer, Toggle } from '@gitbutler/ui';
	import type { ForkMode, Project } from '$lib/project/project';

	const { projectId }: { projectId: string } = $props();
	const projectsService = inject(PROJECTS_SERVICE);
	const projectQuery = $derived(projectsService.getProject(projectId));
	const backend = inject(BACKEND);
	const baseBranchService = inject(BASE_BRANCH_SERVICE);
	const forge = inject(DEFAULT_FORGE_FACTORY);
	const stackService = inject(STACK_SERVICE);

	// Check if workspace has active stacks - fork mode can only be changed when empty
	const stacksQuery = $derived(stackService.stacks(projectId));
	const stackCount = $derived(stacksQuery.response?.length ?? 0);
	const forkModeChangeDisabled = $derived(stackCount > 0);

	const repoQuery = $derived(baseBranchService.repo(projectId));
	const pushRepoQuery = $derived(baseBranchService.pushRepo(projectId));
	const repo = $derived(repoQuery.response);
	const pushRepo = $derived(pushRepoQuery.response);

	// The layout populates this cache when fork info is detected from the GitHub API
	const cachedParentRepo = $derived(forge.cachedParentRepo);

	// Determine if a fork setup exists:
	// 1. Cached parent repo exists (detected via GitHub API), OR
	// 2. Push remote differs from fetch remote
	const hasForkViaApi = $derived(cachedParentRepo !== undefined);
	const hasForkViaRemotes = $derived(repo && pushRepo && repo.hash !== pushRepo.hash);
	const hasForkConfigured = $derived(hasForkViaApi || hasForkViaRemotes);

	const upstreamName = $derived.by(() => {
		if (cachedParentRepo) {
			return `${cachedParentRepo.owner}/${cachedParentRepo.name}`;
		}
		if (repo) {
			return `${repo.owner}/${repo.name}`;
		}
		return undefined;
	});

	const forkName = $derived.by(() => {
		if (hasForkViaApi && repo) {
			return `${repo.owner}/${repo.name}`;
		}
		if (pushRepo) {
			return `${pushRepo.owner}/${pushRepo.name}`;
		}
		return undefined;
	});

	async function onForcePushClick(project: Project, value: boolean) {
		await projectsService.updateProject({ ...project, ok_with_force_push: value });
	}

	async function onForcePushProtectionClick(project: Project, value: boolean) {
		await projectsService.updateProject({ ...project, force_push_protection: value });
	}

	async function onForkModeChange(project: Project, mode: ForkMode) {
		await projectsService.updateProject({ ...project, fork_mode: mode });
	}
</script>

<SettingsSection>
	<CommitSigningForm {projectId} />
	{#if backend.platformName !== 'windows'}
		<Spacer />
		<KeysForm {projectId} showProjectName={false} />
	{/if}

	<Spacer />
	<ReduxResult {projectId} result={projectQuery.result}>
		{#snippet children(project)}
			<CardGroup>
				{#if hasForkConfigured}
					<CardGroup.Item labelFor="forkMode">
						{#snippet title()}
							Fork behavior
						{/snippet}
						{#snippet caption()}
							Choose how to use your fork. This affects where pull requests are created.
						{/snippet}
						{#snippet actions()}
							<div class="fork-mode-control">
								<SegmentControl
									fullWidth
									selected={project.fork_mode}
									onselect={(id) => onForkModeChange(project, id as ForkMode)}
									disabled={forkModeChangeDisabled}
								>
									<SegmentControl.Item id="contribute_to_parent">
										Contribute to parent
									</SegmentControl.Item>
									<SegmentControl.Item id="own_purposes">For my own purposes</SegmentControl.Item>
								</SegmentControl>
								{#if !forkModeChangeDisabled}
									<div class="fork-mode-hint text-12 text-body">
										{#if project.fork_mode === 'contribute_to_parent'}
											PRs will target <strong>{upstreamName}</strong>
										{:else}
											PRs will target <strong>{forkName}</strong>
										{/if}
									</div>
								{/if}
							</div>
						{/snippet}
            {#if forkModeChangeDisabled}
              <InfoMessage filled outlined={false} icon="info">
                {#snippet content()}
                  You have {stackCount === 1
                    ? '1 active branch'
                    : `${stackCount} active branches`} in your workspace. Please clear the workspace
                  before changing fork behavior.
                {/snippet}
              </InfoMessage>
            {/if}
					</CardGroup.Item>
				{/if}
				<CardGroup.Item labelFor="allowForcePush">
					{#snippet title()}
						Allow force pushing
					{/snippet}
					{#snippet caption()}
						Force pushing allows GitButler to override branches even if they were pushed to remote.
						GitButler will never force push to the target branch.
					{/snippet}
					{#snippet actions()}
						<Toggle
							id="allowForcePush"
							checked={project.ok_with_force_push}
							onchange={(checked) => onForcePushClick(project, checked)}
						/>
					{/snippet}
				</CardGroup.Item>
				<CardGroup.Item labelFor="forcePushProtection">
					{#snippet title()}
						Force push protection
					{/snippet}
					{#snippet caption()}
						Protect remote commits during force pushes. This will use Git's safer force push flags
						to avoid overwriting remote commit history.
					{/snippet}
					{#snippet actions()}
						<Toggle
							id="forcePushProtection"
							checked={project.force_push_protection}
							onchange={(checked) => onForcePushProtectionClick(project, checked)}
						/>
					{/snippet}
				</CardGroup.Item>
			</CardGroup>
		{/snippet}
	</ReduxResult>
</SettingsSection>

<style lang="postcss">
	.fork-mode-control {
		display: flex;
		flex-direction: column;
		width: 100%;
		gap: 8px;
	}

	.fork-mode-hint {
		color: var(--clr-text-2);
	}
</style>
