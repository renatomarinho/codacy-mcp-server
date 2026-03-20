/**
 * codacy_organizations — Organization management (2 queries)
 */

import { f } from '../index.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { CodacyScopeModel } from '../models/CodacyScopeModel.js';
import { PROVIDERS } from '../utils/constants.js';
import { OrganizationPresenter } from '../views/organization.presenter.js';
import { RepositoryPresenter } from '../views/repository.presenter.js';

const organizations = f.router('codacy_organizations')
  .describe('Codacy organization management — list organizations and their repositories.')
  .use(requireAuth);

export const listOrganizations = organizations.query('list')
  .describe('List organizations the authenticated user belongs to.')
  .instructions(`Entry point for discovering available organizations. Filter by provider (gh, gl, bb) to narrow results.
Common mistake: skipping this step and guessing organization names — always list organizations first to get the exact provider and name.`)
  .withOptionalEnum('provider', [...PROVIDERS] as const, 'Filter by Git provider')
  .withOptionalNumber('cursor', 'Pagination cursor')
  .withOptionalNumber('limit', 'Results per page (max 100)')
  .returns(OrganizationPresenter)
  .handle(async (input, ctx) => {
    return ctx.client.get('user/organizations', {
      provider: input.provider,
      cursor: input.cursor,
      limit: input.limit ?? 50,
    });
  });

export const listOrgRepos = organizations.query('list_repos')
  .describe('List repositories in an organization.')
  .instructions(`Lists repositories within the organization. Use search to filter by name.
Common mistake: searching for repositories without first confirming the organization exists — use codacy_organizations.list first.
Repositories must be added/followed in Codacy to appear — use codacy_repositories.setup to add new ones.`)
  .fromModel(CodacyScopeModel, 'org')
  .withOptionalString('search', 'Search repositories by name')
  .withOptionalNumber('cursor', 'Pagination cursor')
  .withOptionalNumber('limit', 'Results per page (max 100)')
  .returns(RepositoryPresenter)
  .handle(async (input, ctx) => {
    return ctx.client.get(
      `analysis/organizations/${input.provider}/${input.organization}/repositories`,
      { search: input.search, cursor: input.cursor, limit: input.limit ?? 50 },
    );
  });
