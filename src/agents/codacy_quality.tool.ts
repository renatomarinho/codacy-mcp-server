/**
 * codacy_quality — Quality Gates & policies (3 queries, all cached)
 */

import { f } from '../index.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { CodacyScopeModel } from '../models/CodacyScopeModel.js';
import { GatePolicyPresenter } from '../views/gate-policy.presenter.js';

const quality = f.router('codacy_quality')
  .describe('Quality Gates & policies — view repository quality settings, organization gate policies, and policy details.')
  .use(requireAuth);

export const getSettings = quality.query('get_settings')
  .describe('Get quality settings for a repository (commit/PR/repository thresholds).')
  .instructions(`Returns the quality gate configuration — thresholds for issues, coverage, complexity, and duplication.
These settings determine what isUpToStandards means for PRs and commits.`)
  .fromModel(CodacyScopeModel, 'repo')
  .cached()
  .proxy('organizations/:provider/:organization/repositories/:repository/settings/quality');

export const listPolicies = quality.query('list_policies')
  .describe('List gate policies for an organization.')
  .instructions(`Gate policies are organization-level quality rules applied to repositories.
Common mistake: confusing policies with repository-specific settings — policies are templates, settings are per-repo. isDefault=true means this policy applies to all repos without explicit overrides.`)
  .fromModel(CodacyScopeModel, 'org')
  .cached()
  .returns(GatePolicyPresenter)
  .proxy('organizations/:provider/:organization/gate-policies');

export const getPolicy = quality.query('get_policy')
  .describe('Get details of a specific gate policy including all thresholds.')
  .instructions(`Returns the full threshold configuration for a policy. Use the policyId from codacy_quality.list_policies.
Thresholds define pass/fail conditions for issues, coverage, complexity, and duplication.`)
  .fromModel(CodacyScopeModel, 'org')
  .withNumber('policyId', 'Gate policy ID')
  .cached()
  .returns(GatePolicyPresenter)
  .proxy('organizations/:provider/:organization/gate-policies/:policyId');
