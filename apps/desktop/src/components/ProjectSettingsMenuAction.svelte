<script lang="ts">
	import { goto } from '$app/navigation';
	import { BASE_BRANCH_SERVICE } from '$lib/baseBranch/baseBranchService.svelte';
	import { FILE_SERVICE } from '$lib/files/fileService';
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

	// Get both upstream and fork repo info
	const repoInfoQuery = $derived(baseBranchService.repo(projectId));
	const pushRepoInfoQuery = $derived(baseBranchService.pushRepo(projectId));
	const repoInfo = $derived(repoInfoQuery.response);
	const pushRepoInfo = $derived(pushRepoInfoQuery.response);

	// Get project to access fork_mode
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
				// Determine which repo to open based on fork mode
				// If fork mode is "own_purposes" and we have a push repo, use the push repo (fork)
				// Otherwise, use the upstream repo
				const useOwnRepo = project?.fork_mode === 'own_purposes' && pushRepoInfo;
				const targetRepo = useOwnRepo ? pushRepoInfo : repoInfo;

				if (!targetRepo) {
					console.error('Repo info not found for project:', projectId);
					return;
				}
				const url = `https://${targetRepo.domain}/${targetRepo.owner}/${targetRepo.name}`;
				urlService.openExternalUrl(url);
			})
		)
	);
</script>
