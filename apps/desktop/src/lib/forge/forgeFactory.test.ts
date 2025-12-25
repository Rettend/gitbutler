import { EventContext } from '$lib/analytics/eventContext';
import { PostHogWrapper } from '$lib/analytics/posthog';
import { DefaultForgeFactory } from '$lib/forge/forgeFactory.svelte';
import { GitHub } from '$lib/forge/github/github';
import { GitLab } from '$lib/forge/gitlab/gitlab';
import { type BackendApi, type GitHubApi } from '$lib/state/clientState.svelte';
import { mockCreateBackend } from '$lib/testing/mockBackend';
import { getSettingsdServiceMock } from '$lib/testing/mockSettingsdService';
import { expect, test, describe, vi } from 'vitest';
import type { GitHubClient } from '$lib/forge/github/githubClient';
import type { GitLabClient } from '$lib/forge/gitlab/gitlabClient.svelte';
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

const MockSettingsService = getSettingsdServiceMock();
const backend = mockCreateBackend();
const settingsService = new MockSettingsService();
const eventContext = new EventContext();
const posthog = new PostHogWrapper(settingsService, backend, eventContext);
const gitHubApi: GitHubApi = {
	endpoints: {},
	reducerPath: 'github',
	internalActions: undefined as any,
	util: undefined as any,
	reducer: undefined as any,
	middleware: undefined as any,
	injectEndpoints: vi.fn(),
	enhanceEndpoints: undefined as any
};
const MockBackendApi = vi.fn();
MockBackendApi.prototype.injectEndpoints = vi.fn();
const backendApi: BackendApi = new MockBackendApi();
const gitHubClient = { onReset: () => {} } as any as GitHubClient;
const gitLabClient = { onReset: () => {} } as any as GitLabClient;
// TODO: Replace with a better mock.
const dispatch = (() => {}) as ThunkDispatch<any, any, UnknownAction>;
const gitLabApi: any = {
	injectEndpoints: vi.fn()
};

function createFactory() {
	return new DefaultForgeFactory({
		gitHubClient,
		gitHubApi,
		backendApi,
		gitLabClient,
		gitLabApi,
		posthog,
		dispatch
	});
}

describe.concurrent('DefaultforgeFactory', () => {
	test('Create GitHub service', async () => {
		const factory = createFactory();
		expect(
			factory.build({
				repo: {
					domain: 'github.com',
					name: 'test-repo',
					owner: 'test-owner'
				},
				baseBranch: 'some-base',
				detectedForgeProvider: undefined,
				forgeOverride: undefined
			})
		).instanceOf(GitHub);
	});

	test('Create self hosted Gitlab service', async () => {
		const factory = createFactory();
		expect(
			factory.build({
				repo: {
					domain: 'gitlab.domain.com',
					name: 'test-repo',
					owner: 'test-owner'
				},
				baseBranch: 'some-base',
				detectedForgeProvider: undefined,
				forgeOverride: undefined
			})
		).instanceOf(GitLab);
	});

	test('Create Gitlab service', async () => {
		const factory = createFactory();
		expect(
			factory.build({
				repo: {
					domain: 'gitlab.com',
					name: 'test-repo',
					owner: 'test-owner'
				},
				baseBranch: 'some-base',
				detectedForgeProvider: undefined,
				forgeOverride: undefined
			})
		).instanceOf(GitLab);
	});

	test('Respects detectedForgeProvider: GitHub', async () => {
		const factory = createFactory();
		const result = factory.build({
			repo: {
				domain: 'gitlab.com',
				name: 'test-repo',
				owner: 'test-owner'
			},
			baseBranch: 'main',
			detectedForgeProvider: 'github',
			forgeOverride: undefined
		});
		expect(result).instanceOf(GitHub);
	});

	test('Respects detectedForgeProvider: GitLab', async () => {
		const factory = createFactory();
		const result = factory.build({
			repo: {
				domain: 'github.com',
				name: 'test-repo',
				owner: 'test-owner'
			},
			baseBranch: 'main',
			detectedForgeProvider: 'gitlab',
			forgeOverride: undefined
		});
		expect(result).instanceOf(GitLab);
	});
});

describe.concurrent('DefaultForgeFactory - Fork Mode', () => {
	const forkRepo = {
		domain: 'github.com',
		name: 'forked-repo',
		owner: 'fork-owner',
		hash: 'fork-owner|forked-repo'
	};

	const parentRepo = {
		domain: 'github.com',
		name: 'original-repo',
		owner: 'upstream-owner',
		hash: 'upstream-owner|original-repo'
	};

	test('setCachedParentRepo caches parent info', () => {
		const factory = createFactory();

		expect(factory.cachedParentRepo).toBeUndefined();

		factory.setCachedParentRepo(parentRepo, 'project-1');

		expect(factory.cachedParentRepo).toEqual(parentRepo);
	});

	test('setCachedParentRepo does not clear cache when called with undefined', () => {
		const factory = createFactory();

		factory.setCachedParentRepo(parentRepo, 'project-1');
		expect(factory.cachedParentRepo).toEqual(parentRepo);

		factory.setCachedParentRepo(undefined, 'project-1');
		expect(factory.cachedParentRepo).toEqual(parentRepo);
	});

	test('setCachedParentRepo clears cache when project changes', () => {
		const factory = createFactory();

		factory.setCachedParentRepo(parentRepo, 'project-1');
		expect(factory.cachedParentRepo).toEqual(parentRepo);

		factory.setCachedParentRepo(undefined, 'project-2');
		expect(factory.cachedParentRepo).toBeUndefined();
	});

	test('setConfig with forkMode=own_purposes uses fork repo as target', () => {
		const factory = createFactory();

		factory.setConfig({
			repo: forkRepo,
			pushRepo: forkRepo,
			parentRepo: parentRepo,
			baseBranch: 'main',
			githubAuthenticated: true,
			detectedForgeProvider: undefined,
			forkMode: 'own_purposes'
		});

		const forge = factory.current;
		expect(forge).instanceOf(GitHub);
		// The forge name indicates it was created (not the default)
		expect(forge.name).toBe('github');
	});

	test('setConfig with forkMode=contribute_to_parent uses parent repo as target', () => {
		const factory = createFactory();

		factory.setConfig({
			repo: forkRepo,
			pushRepo: forkRepo,
			parentRepo: parentRepo,
			baseBranch: 'main',
			githubAuthenticated: true,
			detectedForgeProvider: undefined,
			forkMode: 'contribute_to_parent'
		});

		const forge = factory.current;
		expect(forge).instanceOf(GitHub);
		expect(forge.name).toBe('github');
	});

	test('setConfig without parentRepo falls back to fork repo for contribute_to_parent', () => {
		const factory = createFactory();

		factory.setConfig({
			repo: forkRepo,
			pushRepo: forkRepo,
			parentRepo: undefined, // No parent detected
			baseBranch: 'main',
			githubAuthenticated: true,
			detectedForgeProvider: undefined,
			forkMode: 'contribute_to_parent'
		});

		const forge = factory.current;
		expect(forge).instanceOf(GitHub);
		expect(forge.name).toBe('github');
	});

	test('setConfig defaults to contribute_to_parent when forkMode is undefined', () => {
		const factory = createFactory();

		factory.setConfig({
			repo: forkRepo,
			pushRepo: forkRepo,
			parentRepo: parentRepo,
			baseBranch: 'main',
			githubAuthenticated: true,
			detectedForgeProvider: undefined,
			forkMode: undefined // No fork mode set
		});

		const forge = factory.current;
		expect(forge).instanceOf(GitHub);
		expect(forge.name).toBe('github');
	});
});
