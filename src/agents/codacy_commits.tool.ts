/**
 * codacy_commits — Commit analysis & delta issues (3 queries)
 */

import { f } from '../index.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { CodacyScopeModel } from '../models/CodacyScopeModel.js';
import { CommitPresenter } from '../views/commit.presenter.js';
import { IssuePresenter } from '../views/issue.presenter.js';

const commits = f.router('codacy_commits')
  .describe('Commit analysis — list commits with analysis status, view commit details, and delta issues.')
  .use(requireAuth);

export const listCommits = commits.query('list')
  .describe('List repository commits with their analysis status and delta metrics.')
  .instructions(`Shows commits with delta metrics (new/fixed issues per commit). Analysis reflects COMMITTED code only.
Common mistake: confusing delta metrics (new issues introduced by this commit) with total repository metrics — use codacy_repositories.get for totals.`)
  .fromModel(CodacyScopeModel, 'repo')
  .withOptionalString('branchName', 'Branch name (defaults to default branch)')
  .withOptionalNumber('cursor', 'Pagination cursor')
  .withOptionalNumber('limit', 'Results per page (max 100)')
  .returns(CommitPresenter)
  .handle(async (input, ctx) => {
    return ctx.client.get(
      `analysis/organizations/${input.provider}/${input.organization}/repositories/${input.repository}/commits`,
      { branchName: input.branchName, cursor: input.cursor, limit: input.limit ?? 50 },
    );
  });

export const getCommit = commits.query('get')
  .describe('Get commit details with delta statistics (new/fixed issues, coverage change).')
  .instructions(`Requires a full 40-char commit SHA. Short SHAs or branch names are NOT valid.
Use codacy_commits.issues to see the specific issues introduced by this commit.`)
  .fromModel(CodacyScopeModel, 'repo')
  .withString('commitSha', 'Commit SHA hash')
  .returns(CommitPresenter)
  .proxy('analysis/organizations/:provider/:organization/repositories/:repository/commits/:commitSha');

export const commitIssues = commits.query('issues')
  .describe('Get issues introduced by a specific commit (delta issues only).')
  .instructions(`Returns ONLY issues introduced by this specific commit — not the full repository issue list.
Common mistake: using this to see all repository issues — use codacy_issues.list for that.`)
  .fromModel(CodacyScopeModel, 'repo')
  .withString('commitSha', 'Commit SHA hash')
  .withOptionalNumber('cursor', 'Pagination cursor')
  .withOptionalNumber('limit', 'Results per page (max 100)')
  .returns(IssuePresenter)
  .handle(async (input, ctx) => {
    return ctx.client.get(
      `analysis/organizations/${input.provider}/${input.organization}/repositories/${input.repository}/commits/${input.commitSha}/issues`,
      { cursor: input.cursor, limit: input.limit ?? 50 },
    );
  });
