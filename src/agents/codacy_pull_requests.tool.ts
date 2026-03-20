/**
 * codacy_pull_requests — Pull request analysis & actions (4q + 2m)
 */

import { f } from '../index.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { CodacyScopeModel } from '../models/CodacyScopeModel.js';
import { PullRequestPresenter } from '../views/pull-request.presenter.js';

const pullRequests = f.router('codacy_pull_requests')
  .describe('Pull request analysis — list PRs, view quality status, coverage, diff, trigger AI review, or bypass analysis.')
  .use(requireAuth);

export const listPRs = pullRequests.query('list')
  .describe('List pull requests in a repository with analysis status.')
  .instructions(`Lists PRs with quality analysis status. Analysis reflects COMMITTED code only — local changes are NOT visible.
Common mistake: expecting analysis to update in real-time after a push — there is processing delay. Use codacy_pull_requests.get to check if isAnalysed=true.`)
  .fromModel(CodacyScopeModel, 'repo')
  .withOptionalNumber('cursor', 'Pagination cursor')
  .withOptionalNumber('limit', 'Results per page (max 100)')
  .returns(PullRequestPresenter)
  .handle(async (input, ctx) => {
    return ctx.client.get(
      `analysis/organizations/${input.provider}/${input.organization}/repositories/${input.repository}/pull-requests`,
      { cursor: input.cursor, limit: input.limit ?? 50 },
    );
  });

export const getPR = pullRequests.query('get')
  .describe('Get pull request details with quality analysis results (isUpToStandards, new/fixed issues, coverage).')
  .instructions(`isUpToStandards=false means the quality gate FAILED. Investigate with codacy_issues.pr_issues and codacy_pull_requests.coverage.
Common mistake: treating isUpToStandards=null as passed — null means analysis is not yet complete.`)
  .fromModel(CodacyScopeModel, 'repo')
  .withNumber('pullRequestNumber', 'Pull request number')
  .returns(PullRequestPresenter)
  .proxy('analysis/organizations/:provider/:organization/repositories/:repository/pull-requests/:pullRequestNumber');

export const prCoverage = pullRequests.query('coverage')
  .describe('Get file-level coverage data for the pull request diff.')
  .fromModel(CodacyScopeModel, 'repo')
  .withNumber('pullRequestNumber', 'Pull request number')
  .proxy('analysis/organizations/:provider/:organization/repositories/:repository/pull-requests/:pullRequestNumber/files/coverage');

export const prDiff = pullRequests.query('diff')
  .describe('Get the Git diff for a pull request.')
  .fromModel(CodacyScopeModel, 'repo')
  .withNumber('pullRequestNumber', 'Pull request number')
  .proxy('analysis/organizations/:provider/:organization/repositories/:repository/pull-requests/:pullRequestNumber/diff');

// ── Mutations ───────────────────────────────────────────────────────────────

export const triggerAiReview = pullRequests.mutation('trigger_ai_review')
  .describe('Trigger a Codacy AI-powered code review on a pull request.')
  .instructions(`This triggers NEW work — use ONLY when the user explicitly asks for an AI code review. NOT idempotent — each call dispatches a new review.
Prerequisite: the PR must be analysed (isAnalysed=true). If not, suggest waiting for analysis to complete.
Common mistake: triggering review on unanalysed PRs — check with codacy_pull_requests.get first.`)
  .fromModel(CodacyScopeModel, 'repo')
  .withNumber('pullRequestNumber', 'Pull request number')
  .invalidates('codacy_pull_requests*')
  .proxy('analysis/organizations/:provider/:organization/repositories/:repository/pull-requests/:pullRequestNumber/ai-review');

export const bypassPR = pullRequests.mutation('bypass')
  .describe('Bypass the analysis quality gate for a pull request. Allows merging even if quality standards are not met.')
  .instructions(`Use ONLY when the user explicitly wants to override the quality gate — this is a deliberate decision with security implications.
Common mistakes: (1) Bypassing without user confirmation. (2) Bypassing for quality issues that could be fixed — suggest fixing first.
This action is idempotent — calling it twice has no additional effect.`)
  .fromModel(CodacyScopeModel, 'repo')
  .withNumber('pullRequestNumber', 'Pull request number')
  .idempotent()
  .invalidates('codacy_pull_requests*')
  .proxy('analysis/organizations/:provider/:organization/repositories/:repository/pull-requests/:pullRequestNumber/bypass');
