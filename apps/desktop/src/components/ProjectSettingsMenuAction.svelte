<script lang="ts">
	import { goto } from '$app/navigation';
	import { BASE_BRANCH_SERVICE } from '$lib/baseBranch/baseBranchService.svelte';
	import { FILE_SERVICE } from '$lib/files/fileService';
	import { DEFAULT_FORGE_FACTORY } from '$lib/forge/forgeFactory.svelte';
	import { vscodePath } from '$lib/project/project';
	import { PROJECTS_SERVICE } from '$lib/project/projectsService';
	import { historyPath } from '$lib/routes/routes.svelte';
	import { useSettingsModal } from '$lib/settings/settingsModal.svelte';
	import { SETTINGS } from '$lib/settings/userSettings';
	import { SHORTCUT_SERVICE } from '$lib/shortcuts/shortcutService';
	import { getEditorUri, URL_SERVICE } from '$lib/utils/url';
	import { inject } from '@gitbutler/core/context';
	import { mergeUnlisten } from '@gitbutler/ui/utils/mergeUnlisten';

	const { projectId }: { projectId: string } = $props();

	const projectsService = inject(PROJECTS_SERVICE);
	const urlService = inject(URL_SERVICE);
	const { openProjectSettings } = useSettingsModal();

	const userSettings = inject(SETTINGS);
	const shortcutService = inject(SHORTCUT_SERVICE);
	const fileService = inject(FILE_SERVICE);
	const baseBranchService = inject(BASE_BRANCH_SERVICE);
	const forge = inject(DEFAULT_FORGE_FACTORY);

	const repoInfoQuery = $derived(baseBranchService.repo(projectId));
	const pushRepoInfoQuery = $derived(baseBranchService.pushRepo(projectId));
	const repoInfo = $derived(repoInfoQuery.response);
	const pushRepoInfo = $derived(pushRepoInfoQuery.response);

	const repoDetailsQuery = $derived(forge.current.repoService?.getInfo());
	const forkInfo = $derived(repoDetailsQuery?.response?.forkInfo);

	const projectQuery = $derived(projectsService.getProject(projectId));
	const project = $derived(
		projectQuery.result.status === 'fulfilled' ? projectQuery.result.data : undefined
	);

	$effect(() =>
		mergeUnlisten(
			shortcutService.on('project-settings', () => {
				openProjectSettings(projectId);
			}),
			shortcutService.on('history', () => {
				goto(historyPath(projectId));
			}),
			shortcutService.on('open-in-vscode', async () => {
				const project = await projectsService.fetchProject(projectId);
				if (!project) {
					throw new Error(`Project not found: ${projectId}`);
				}
				urlService.openExternalUrl(
					getEditorUri({
						schemeId: $userSettings.defaultCodeEditor.schemeIdentifer,
						path: [vscodePath(project.path)],
						searchParams: { windowId: '_blank' }
					})
				);
			}),
			shortcutService.on('show-in-finder', async () => {
				const project = await projectsService.fetchProject(projectId);
				if (!project) {
					throw new Error(`Project not found: ${projectId}`);
				}
				// Show the project directory in the default file manager (cross-platform)
				await fileService.showFileInFolder(project.path);
			}),
			shortcutService.on('open-on-github', () => {
				// Determine which repo to open based on fork mode and fork detection
				const forkMode = project?.fork_mode ?? 'contribute_to_parent';

				let targetOwner: string | undefined;
				let targetName: string | undefined;
				let targetDomain: string | undefined;

				if (forkMode === 'own_purposes') {
					// work on fork - use origin/push repo
					targetOwner = pushRepoInfo?.owner ?? repoInfo?.owner;
					targetName = pushRepoInfo?.name ?? repoInfo?.name;
					targetDomain = pushRepoInfo?.domain ?? repoInfo?.domain;
				} else {
					// contribute to parent
					// If this is a fork detected via API, use the parent repo
					if (forkInfo?.isFork && forkInfo.parent) {
						targetOwner = forkInfo.parent.owner;
						targetName = forkInfo.parent.name;
						targetDomain = repoInfo?.domain ?? 'github.com';
					} else {
						// Traditional setup or not a fork - use origin repo
						targetOwner = repoInfo?.owner;
						targetName = repoInfo?.name;
						targetDomain = repoInfo?.domain;
					}
				}

				if (!targetOwner || !targetName || !targetDomain) {
					console.error('Repo info not found for project:', projectId);
					return;
				}
				const url = `https://${targetDomain}/${targetOwner}/${targetName}`;
				urlService.openExternalUrl(url);
			})
		)
	);
</script>
