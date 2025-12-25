<script lang="ts">
	import CommitSigningForm from '$components/CommitSigningForm.svelte';
	import KeysForm from '$components/KeysForm.svelte';
	import ReduxResult from '$components/ReduxResult.svelte';
	import SettingsSection from '$components/SettingsSection.svelte';
	import { BACKEND } from '$lib/backend';
	import { BASE_BRANCH_SERVICE } from '$lib/baseBranch/baseBranchService.svelte';
	import { PROJECTS_SERVICE } from '$lib/project/projectsService';
	import { inject } from '@gitbutler/core/context';
	import { CardGroup, SegmentControl, Spacer, Toggle } from '@gitbutler/ui';
	import type { ForkMode, Project } from '$lib/project/project';

	const { projectId }: { projectId: string } = $props();
	const projectsService = inject(PROJECTS_SERVICE);
	const projectQuery = $derived(projectsService.getProject(projectId));
	const backend = inject(BACKEND);
	const baseBranchService = inject(BASE_BRANCH_SERVICE);

	const repoQuery = $derived(baseBranchService.repo(projectId));
	const pushRepoQuery = $derived(baseBranchService.pushRepo(projectId));
	const repo = $derived(repoQuery.response);
	const pushRepo = $derived(pushRepoQuery.response);

	// Determine if a fork is configured (push remote differs from fetch remote)
	const hasForkConfigured = $derived(repo && pushRepo && repo.hash !== pushRepo.hash);

	// Get display names for the repos
	const upstreamName = $derived(repo ? `${repo.owner}/${repo.name}` : undefined);
	const forkName = $derived(pushRepo ? `${pushRepo.owner}/${pushRepo.name}` : undefined);

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
							Choose how to use your fork. This affects where pull requests are created and which
							repository "Open on GitHub" opens.
						{/snippet}
						{#snippet actions()}
							<div class="fork-mode-control">
								<SegmentControl
									fullWidth
									selected={project.fork_mode}
									onselect={(id) => onForkModeChange(project, id as ForkMode)}
								>
									<SegmentControl.Item id="contribute_to_parent">
										Contribute to parent
									</SegmentControl.Item>
									<SegmentControl.Item id="own_purposes">For my own purposes</SegmentControl.Item>
								</SegmentControl>
								<div class="fork-mode-hint text-12 text-body">
									{#if project.fork_mode === 'contribute_to_parent'}
										PRs will target <strong>{upstreamName}</strong>
									{:else}
										PRs will target <strong>{forkName}</strong>
									{/if}
								</div>
							</div>
						{/snippet}
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
