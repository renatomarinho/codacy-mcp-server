/**
 * codacy_security — Security Risk Management (5q + 1m) ⭐
 * DLP showcase: SecurityPresenter redacts secrets before wire.
 */

import { f } from '../index.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { CodacyScopeModel } from '../models/CodacyScopeModel.js';
import { SEVERITY_LEVELS, SCAN_TYPES, REPO_SCAN_TYPES, IGNORE_REASONS, SBOM_RISK_CATEGORIES, SECURITY_CATEGORIES, SECURITY_STATUSES } from '../utils/constants.js';
import { SecurityPresenter } from '../views/security.presenter.js';
import { SbomDependencyPresenter } from '../views/sbom-dependency.presenter.js';

const security = f.router('codacy_security')
  .describe('Security Risk Management (SRM) — search security findings, SBOM dependencies, OSSF scorecard, and manage ignored items.')
  .use(requireAuth);

export const searchOrg = security.query('search_org')
  .describe('Search organization-level security findings across all repositories.')
  .instructions(`Cross-repository security overview at the organization level. For repository-specific findings, use codacy_security.search_repo instead.
Scan types: SAST, SCA, Secrets, IaC, CICD (repo-level). DAST and PenTesting are organization-level only.
Common mistakes: (1) Using this for code quality issues — use codacy_issues instead. (2) Status values: OnTrack, DueSoon, Overdue (open), ClosedOnTime, ClosedLate, Ignored (closed) — do NOT invent statuses.`)
  .fromModel(CodacyScopeModel, 'org')
  .withOptionalEnum('priority', [...SEVERITY_LEVELS] as const, 'Filter by priority')
  .withOptionalEnum('category', [...SECURITY_CATEGORIES] as const, 'Filter by security category (e.g., Injection, XSS, CSRF)')
  .withOptionalEnum('scanType', [...SCAN_TYPES] as const, 'Filter by scan type')
  .withOptionalEnum('status', [...SECURITY_STATUSES] as const, 'Filter by status (OnTrack, DueSoon, Overdue, ClosedOnTime, ClosedLate, Ignored)')
  .withOptionalNumber('cursor', 'Pagination cursor')
  .withOptionalNumber('limit', 'Results per page (max 100)')
  .egress(1 * 1024 * 1024)
  .returns(SecurityPresenter)
  .handle(async (input, ctx) => {
    const body: Record<string, unknown> = {};
    if (input.priority) body.priorities = [input.priority];
    if (input.category) body.categories = [input.category];
    if (input.scanType) body.scanTypes = [input.scanType];
    if (input.status) body.statuses = [input.status];
    return ctx.client.post(
      `organizations/${input.provider}/${input.organization}/security/search`,
      body,
      { cursor: input.cursor, limit: input.limit ?? 50 },
    );
  });

export const searchRepo = security.query('search_repo')
  .describe('Search security findings within a specific repository.')
  .instructions(`Repository-scoped security search. Uses the organization-level API filtered by this repository.
Scan types available at repo level: SAST, SCA, Secrets, IaC, CICD. For DAST and PenTesting, use codacy_security.search_org instead.
Common mistake: using DAST or PenTesting scan types here — those are organization-level only.`)
  .fromModel(CodacyScopeModel, 'repo')
  .withOptionalEnum('priority', [...SEVERITY_LEVELS] as const, 'Filter by priority')
  .withOptionalEnum('category', [...SECURITY_CATEGORIES] as const, 'Filter by security category')
  .withOptionalEnum('scanType', [...REPO_SCAN_TYPES] as const, 'Filter by scan type (repo-level: SAST, SCA, Secrets, IaC, CICD)')
  .withOptionalEnum('status', [...SECURITY_STATUSES] as const, 'Filter by status (OnTrack, DueSoon, Overdue, ClosedOnTime, ClosedLate, Ignored)')
  .withOptionalNumber('cursor', 'Pagination cursor')
  .withOptionalNumber('limit', 'Results per page (max 100)')
  .egress(1 * 1024 * 1024)
  .returns(SecurityPresenter)
  .handle(async (input, ctx) => {
    const body: Record<string, unknown> = {
      repositories: [input.repository],
    };
    if (input.priority) body.priorities = [input.priority];
    if (input.category) body.categories = [input.category];
    if (input.scanType) body.scanTypes = [input.scanType];
    if (input.status) body.statuses = [input.status];
    return ctx.client.post(
      `organizations/${input.provider}/${input.organization}/security/search`,
      body,
      { cursor: input.cursor, limit: input.limit ?? 50 },
    );
  });

export const dashboard = security.query('dashboard')
  .describe('Get the security dashboard summary for a repository.')
  .fromModel(CodacyScopeModel, 'repo')
  .proxy('organizations/:provider/:organization/repositories/:repository/security/dashboard');

export const sbomSearch = security.query('sbom_search')
  .describe('Search SBOM dependencies across the organization. Find vulnerable packages by name, severity, or risk category.')
  .instructions(`Supply chain security investigation — search SBOM dependencies by name, vulnerability severity, or risk category.
Common mistakes: (1) Confusing SBOM search with security findings — SBOM shows dependencies, use codacy_security.search_repo for code-level findings. (2) Risk categories: Forbidden, Risky, Normal — do NOT invent categories.
Use purl (Package URL) as the universal identifier for cross-referencing with OSSF Scorecard.`)
  .fromModel(CodacyScopeModel, 'org')
  .withOptionalString('text', 'Search by dependency name or package URL')
  .withOptionalEnum('findingSeverity', [...SEVERITY_LEVELS] as const, 'Filter by vulnerability severity')
  .withOptionalEnum('riskCategory', [...SBOM_RISK_CATEGORIES] as const, 'Filter by risk classification')
  .withOptionalNumber('cursor', 'Pagination cursor')
  .withOptionalNumber('limit', 'Results per page (max 100)')
  .returns(SbomDependencyPresenter)
  .handle(async (input, ctx) => {
    const body: Record<string, unknown> = {};
    if (input.text) body.text = input.text;
    if (input.findingSeverity) body.findingSeverities = [input.findingSeverity];
    if (input.riskCategory) body.riskCategories = [input.riskCategory];
    return ctx.client.post(
      `organizations/${input.provider}/${input.organization}/sbom/dependencies/search`,
      body,
      { cursor: input.cursor, limit: input.limit ?? 50 },
    );
  });

export const ossfScorecard = security.query('ossf_scorecard')
  .describe('Get the OSSF Scorecard for a repository or package. Returns security posture score.')
  .instructions(`Accepts either a repository URL (e.g., https://github.com/org/repo) or a purl (e.g., maven:ch.qos.logback:logback-classic:1.2.3). At least one is required.
Common mistake: not providing either url or purl — the API requires at least one identifier. Use the purl from SBOM search results.`)
  .withOptionalString('url', 'Repository URL (e.g., https://github.com/org/repo)')
  .withOptionalString('purl', 'Package URL in purl format (e.g., maven:ch.qos.logback:logback-classic:1.2.3)')
  .handle(async (input, ctx) => {
    const body: Record<string, unknown> = {};
    if (input.url) body.url = input.url;
    if (input.purl) body.purl = input.purl;
    return ctx.client.post('security/dependencies/ossf/scorecard', body);
  });

// ── Mutations ───────────────────────────────────────────────────────────────

export const ignoreSecurityItem = security.mutation('ignore')
  .describe('Ignore or unignore a security finding.')
  .instructions(`Use when the user explicitly wants to mark a security finding as ignored. Always provide a reason: FalsePositive, WontFix, or NotRelevant.
Common mistakes: (1) Do NOT invent reasons. (2) Ignoring without user confirmation — this is a security decision, always confirm.
This action is idempotent — calling it twice with the same srmItemId has no additional effect.`)
  .fromModel(CodacyScopeModel, 'org')
  .withString('srmItemId', 'SRM item identifier')
  .withEnum('reason', [...IGNORE_REASONS] as const, 'Reason for ignoring')
  .withOptionalString('comment', 'Optional explanation comment')
  .idempotent()
  .invalidates('codacy_security.*')
  .handle(async (input, ctx) => {
    return ctx.client.post(
      `organizations/${input.provider}/${input.organization}/security/items/${input.srmItemId}/ignore`,
      { reason: input.reason, comment: input.comment },
    );
  });
