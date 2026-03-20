/**
 * codacy_repositories — Repository management & analysis (2q + 1m)
 */

import { f } from '../index.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { CodacyScopeModel } from '../models/CodacyScopeModel.js';
import { RepositoryPresenter } from '../views/repository.presenter.js';

const repositories = f.router('codacy_repositories')
  .describe('Repository management — get analysis metrics, list branches, setup repositories.')
  .use(requireAuth);

export const getRepository = repositories.query('get')
  .describe('Get repository details with analysis metrics (grade, coverage, complexity, issues).')
  .instructions(`Returns the overall repository health: Grade (A-F scale), coverage %, complexity, issue count.
Common mistake: assuming Grade=A means zero issues — the grade is a composite score. Use codacy_issues.list for the actual issue breakdown.`)
  .fromModel(CodacyScopeModel, 'repo')
  .returns(RepositoryPresenter)
  .proxy('analysis/organizations/:provider/:organization/repositories/:repository');

export const listBranches = repositories.query('list_branches')
  .describe('List branches of a repository.')
  .instructions(`Lists all branches tracked by Codacy analysis. The default branch is the one being analyzed — other branches may have limited or no analysis data.`)
  .fromModel(CodacyScopeModel, 'repo')
  .proxy('analysis/organizations/:provider/:organization/repositories/:repository/branches');

export const setupRepository = repositories.mutation('setup')
  .describe('Add or follow a repository in Codacy. This sets up analysis tracking.')
  .instructions(`Use ONLY when the user explicitly wants to add a new repository for analysis.
This is a multi-step action: it will (1) find the organization, (2) join it if needed, (3) find the repository, and (4) add or follow it.
Common mistake: calling setup on an already-tracked repository — it will return a success message without re-adding.
This action invalidates organization and repository caches.`)
  .fromModel(CodacyScopeModel, 'repo')
  .invalidates('codacy_organizations*', 'codacy_repositories*')
  .handle(async (input, ctx) => {
    const { provider, organization, repository } = input;

    // Step 1: Find organization in user's org list
    let org: Record<string, unknown> | undefined;
    let cursor: string | undefined;
    for (let i = 0; i < 5 && !org; i++) {
      const result = await ctx.client.get<{ data: Record<string, unknown>[]; pagination?: { cursor?: string } }>(
        'user/organizations',
        { provider, cursor, limit: 100 },
      );
      org = result.data.find((o: Record<string, unknown>) => o.name === organization && o.provider === provider);
      cursor = result.pagination?.cursor as string | undefined;
      if (!cursor) break;
    }

    if (!org) {
      return { success: false, message: `Organization '${organization}' not found for provider '${provider}'.` };
    }

    // Step 2: Join organization if not a member
    const joinStatus = org.joinStatus as string;
    if (joinStatus === 'pendingMember') {
      return { success: false, message: 'Waiting for join request to be approved.' };
    }
    if (joinStatus === 'remoteMember') {
      if (org.identifier) {
        await ctx.client.post(`organizations/${provider}/${organization}/join`);
      } else {
        await ctx.client.post('organizations', {
          provider,
          remoteIdentifier: org.remoteIdentifier,
          name: organization,
          type: org.type,
        });
      }
    }

    // Step 3: Find the repository
    const repos = await ctx.client.get<{ data: Record<string, unknown>[] }>(
      `analysis/organizations/${provider}/${organization}/repositories`,
      { search: repository, limit: 10, addedState: 'NotSynced' },
    );
    const repoFullPath = `${organization}/${repository}`;
    const remoteRepo = repos.data.find((r: Record<string, unknown>) => r.fullPath === repoFullPath);

    if (!remoteRepo) {
      return { success: false, message: `Repository '${repository}' not found in organization '${organization}'.` };
    }

    // Step 4: Add or follow the repository
    const addedState = remoteRepo.addedState as string;
    if (addedState === 'Added') {
      // Already added — try to follow for non-admin users
      try {
        await ctx.client.post(
          `analysis/organizations/${provider}/${organization}/repositories/${repository}/follow`,
        );
        return { success: true, message: 'Repository followed.' };
      } catch {
        return { success: true, message: 'Repository is already added to Codacy.' };
      }
    }
    if (addedState === 'Following') {
      return { success: true, message: 'Repository is already being followed.' };
    }

    // Not added — add it
    await ctx.client.post('analysis/organizations/repositories', {
      provider,
      repositoryFullPath: repoFullPath,
    });

    return { success: true, message: 'Repository added to Codacy.' };
  });
