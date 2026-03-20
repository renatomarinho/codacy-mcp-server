/**
 * codacy_issues — Code quality issues (5q + 2m)
 * The flagship router — showcases agentLimit, egress, idempotent mutations, quickfix patches.
 */

import { f } from '../index.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { CodacyScopeModel } from '../models/CodacyScopeModel.js';
import { ISSUE_LEVELS, IGNORE_REASONS, ISSUE_CATEGORIES, LANGUAGES } from '../utils/constants.js';
import { IssuePresenter } from '../views/issue.presenter.js';

const issues = f.router('codacy_issues')
  .describe('Code quality issues — search, inspect, quickfix patches, and manage (ignore/bulk).')
  .use(requireAuth);

// ── Queries ─────────────────────────────────────────────────────────────────

export const listIssues = issues.query('list')
  .describe('Search and filter repository code quality issues.')
  .instructions(`Code quality issues ONLY — for security findings, use codacy_security.
Common mistakes: (1) Do NOT search issues without specifying filters when the repository is large. (2) Severity levels: Info, Warning, Error — do NOT invent levels like 'Critical' or 'High'. (3) Categories: Security, Performance, CodeStyle, Compatibility, ErrorProne, UnusedCode, Complexity, BestPractice, Comprehensibility, Documentation — do NOT invent categories. (4) Analysis reflects COMMITTED code only — local edits are NOT visible until pushed.
Tool redirection: For security vulnerabilities (CVEs, OWASP), use codacy_security.search_repo. For file-level issues, use codacy_issues.file_issues with the fileId.`)
  .fromModel(CodacyScopeModel, 'repo')
  .withOptionalString('branchName', 'Branch name (defaults to main/default branch)')
  .withOptionalEnum('level', [...ISSUE_LEVELS] as const, 'Filter by severity level')
  .withOptionalEnum('category', [...ISSUE_CATEGORIES] as const, 'Filter by issue category (e.g., Security, Performance, CodeStyle)')
  .withOptionalEnum('language', [...LANGUAGES] as const, 'Filter by programming language')
  .withOptionalString('patternId', 'Filter by pattern identifier')
  .withOptionalString('authorEmail', 'Filter by commit author email')
  .withOptionalNumber('cursor', 'Pagination cursor')
  .withOptionalNumber('limit', 'Results per page (max 100)')
  .egress(1 * 1024 * 1024)
  .returns(IssuePresenter)
  .handle(async (input, ctx) => {
    const body: Record<string, unknown> = {};
    if (input.branchName) body.branchName = input.branchName;
    if (input.level) body.levels = [input.level];
    if (input.category) body.categories = [input.category];
    if (input.language) body.languages = [input.language];
    if (input.patternId) body.patternIds = [input.patternId];
    if (input.authorEmail) body.authorEmails = [input.authorEmail];

    return ctx.client.post(
      `analysis/organizations/${input.provider}/${input.organization}/repositories/${input.repository}/issues/search`,
      body,
      { cursor: input.cursor, limit: input.limit ?? 50 },
    );
  });

export const getIssue = issues.query('get')
  .describe('Get detailed information about a specific issue.')
  .fromModel(CodacyScopeModel, 'repo')
  .withString('issueId', 'Issue identifier')
  .returns(IssuePresenter)
  .proxy('analysis/organizations/:provider/:organization/repositories/:repository/issues/:issueId');

export const fileIssues = issues.query('file_issues')
  .describe('Get issues for a specific file in the repository.')
  .instructions(`Requires a valid fileId. Common mistake: using the file PATH instead of the fileId — get the fileId from codacy_files.list first.
If unsure about the file identifier, call codacy_files.list to browse available files.`)
  .fromModel(CodacyScopeModel, 'repo')
  .withString('fileId', 'File identifier')
  .withOptionalNumber('cursor', 'Pagination cursor')
  .withOptionalNumber('limit', 'Results per page (max 100)')
  .returns(IssuePresenter)
  .handle(async (input, ctx) => {
    return ctx.client.get(
      `analysis/organizations/${input.provider}/${input.organization}/repositories/${input.repository}/files/${input.fileId}/issues`,
      { cursor: input.cursor, limit: input.limit ?? 50 },
    );
  });

export const prIssues = issues.query('pr_issues')
  .describe('Get code quality issues introduced or found in a pull request.')
  .fromModel(CodacyScopeModel, 'repo')
  .withNumber('pullRequestNumber', 'Pull request number')
  .withOptionalNumber('cursor', 'Pagination cursor')
  .withOptionalNumber('limit', 'Results per page (max 100)')
  .returns(IssuePresenter)
  .handle(async (input, ctx) => {
    return ctx.client.get(
      `analysis/organizations/${input.provider}/${input.organization}/repositories/${input.repository}/pull-requests/${input.pullRequestNumber}/issues`,
      { cursor: input.cursor, limit: input.limit ?? 50 },
    );
  });

export const quickfixPatch = issues.query('quickfix_patch')
  .describe('Download auto-fix patches for issues that have quickfix suggestions available.')
  .instructions(`Returns a unified diff patch. Use ONLY after confirming hasQuickfix=true on the relevant issues.
Common mistakes: (1) Calling this without checking quickfix availability first — verify with codacy_issues.list. (2) The patch is a unified diff — apply it with \`git apply\`, not \`git am\`.
The response can be large for repositories with many fixable issues — the egress guard will truncate if necessary.`)
  .fromModel(CodacyScopeModel, 'repo')
  .withOptionalString('branchName', 'Branch name')
  .egress(2 * 1024 * 1024)
  .handle(async (input, ctx) => {
    return ctx.client.get(
      `analysis/organizations/${input.provider}/${input.organization}/repositories/${input.repository}/issues/patch`,
      { branchName: input.branchName },
    );
  });

// ── Mutations ───────────────────────────────────────────────────────────────

export const ignoreIssue = issues.mutation('ignore')
  .describe('Mark a specific issue as ignored with a reason.')
  .instructions(`Use when the user explicitly wants to ignore an issue. Always provide a reason: FalsePositive, WontFix, or NotRelevant.
Common mistakes: (1) Do NOT invent reasons — only the three listed are valid. (2) Ignoring without asking the user first — this is destructive, always confirm intent.
This action is idempotent — calling it twice with the same issueId and reason has no additional effect.`)
  .fromModel(CodacyScopeModel, 'repo')
  .withString('issueId', 'Issue identifier to ignore')
  .withEnum('reason', [...IGNORE_REASONS] as const, 'Reason for ignoring')
  .idempotent()
  .invalidates('codacy_issues.*')
  .handle(async (input, ctx) => {
    return ctx.client.patch(
      `analysis/organizations/${input.provider}/${input.organization}/repositories/${input.repository}/issues/${input.issueId}`,
      { ignore: true, reason: input.reason },
    );
  });

export const bulkIgnoreIssues = issues.mutation('bulk_ignore')
  .describe('Batch ignore multiple issues at once with a comment.')
  .instructions(`Use when the user wants to ignore many issues of the same pattern or category. Provide issue IDs, reason, and an optional comment.
Common mistakes: (1) Do NOT bulk-ignore without user confirmation — always list the issues first and confirm. (2) Reason must be FalsePositive, WontFix, or NotRelevant. (3) Verify issue IDs exist before sending — invalid IDs silently fail.
This action is idempotent — safe to retry if the request times out.`)
  .fromModel(CodacyScopeModel, 'repo')
  .withArray('issueIds', 'string', 'List of issue identifiers to ignore')
  .withEnum('reason', [...IGNORE_REASONS] as const, 'Reason for ignoring')
  .withOptionalString('comment', 'Optional comment explaining why these issues are being ignored')
  .idempotent()
  .invalidates('codacy_issues.*')
  .handle(async (input, ctx) => {
    return ctx.client.post(
      `analysis/organizations/${input.provider}/${input.organization}/repositories/${input.repository}/issues/ignore`,
      { issueIds: input.issueIds, reason: input.reason, comment: input.comment },
    );
  });
