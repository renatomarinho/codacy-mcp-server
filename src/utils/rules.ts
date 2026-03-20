/**
 * Centralized domain rules for Presenters and Agents.
 *
 * In Vurb.ts MVA, rules live in TWO places:
 *   1. Presenter `rules:` — JIT system rules injected with the data (perception-level)
 *   2. `.instructions()` — per-action behavioral guidance (action-level)
 *
 * This module provides the reusable FRAGMENTS that both consume.
 */

// ────────────────────────────────────────────────────────────
// Presenter Rules (injected as JIT system rules with data)
// ────────────────────────────────────────────────────────────

/**
 * Issues are code QUALITY only — never security.
 * Maps the Codacy API severity vocabulary for the LLM.
 */
export const ISSUE_RULES = [
  'These are code QUALITY issues — NOT security findings. For security, use codacy_security.',
  'Severity mapping: Info → Minor, Warning → Medium, Error → Critical.',
  'Issues with hasQuickfix=true can be auto-patched via the quickfix_patch action.',
  'Changes must be COMMITTED to the repository before analysis reflects them.',
] as const;

/**
 * Security SRM findings — distinguish from quality issues.
 * Maps the status vocabulary for the LLM.
 */
export const SECURITY_RULES = [
  'These are Security Risk Management (SRM) findings — NOT code quality issues. For quality, use codacy_issues.',
  'Open statuses: OnTrack, DueSoon, Overdue. Closed statuses: ClosedOnTime, ClosedLate, Ignored.',
  'Prioritize open findings (OnTrack, DueSoon, Overdue) — they require action.',
  'Scan types include SAST, SCA, Secrets, IaC, CICD. DAST and PenTesting are org-level only.',
] as const;

/**
 * File analysis metrics — five dimensions.
 */
export const FILE_RULES = [
  'If a file has isIgnored=true, Codacy does NOT analyze it — metrics will be empty.',
  'Five metrics: Grade, Issues, Duplication, Complexity, Coverage.',
  'Validate fileId with codacy_files.list before querying — wrong fileId silently returns empty.',
] as const;

/**
 * Pull request analysis reflects committed state.
 */
export const PULL_REQUEST_RULES = [
  'PR analysis reflects the last COMMITTED state only — uncommitted local changes are NOT reflected.',
  'isUpToStandards=false means the quality gate failed — investigate newIssues and coverage.',
  'A PR must be analysed (isAnalysed=true) before AI code review can be triggered.',
] as const;

/**
 * Commit analysis — deltas from parent.
 */
export const COMMIT_RULES = [
  'newIssues and fixedIssues are DELTAS from the parent commit — not totals.',
  'Analysis runs only on committed code. Grade reflects the state at this commit SHA.',
] as const;

/**
 * Tool patterns — configuration rules.
 */
export const TOOL_PATTERN_RULES = [
  'toolUuid identifies the analysis tool (e.g., ESLint, PMD, Semgrep). patternId identifies a specific rule.',
  'recommended=true means Codacy suggests enabling this pattern for best practices.',
  'Get toolUuid and patternId from codacy_tools.repo_patterns before configuring.',
] as const;

/**
 * Repository health overview.
 */
export const REPOSITORY_RULES = [
  'Grade scale: A (best) → F (worst). Coverage as percentage (0-100).',
  'A repository must be added/followed in Codacy before analysis data is available.',
] as const;

/**
 * Organization context.
 */
export const ORGANIZATION_RULES = [
  'Always specify the Git provider (gh, gl, bb) when working with organizations.',
  'If unsure about the exact name, use codacy_organizations.list to validate.',
] as const;

/**
 * Gate policies — quality thresholds.
 */
export const GATE_POLICY_RULES = [
  'isDefault=true means this policy applies to all repositories without a custom policy.',
  'Thresholds define the minimum quality bar — PRs below these standards fail the quality gate.',
] as const;

/**
 * Issue overview — aggregated charts.
 */
export const ISSUE_OVERVIEW_RULES = [
  'Charts are server-rendered ECharts — do NOT recalculate or re-render. Present them as-is.',
  'Use the breakdown to identify the most impactful category or severity for drill-down.',
] as const;

/**
 * SBOM dependencies — supply chain security.
 */
export const SBOM_DEPENDENCY_RULES = [
  'vulnerabilities > 0 indicates known CVEs — check OSSF Scorecard for posture assessment.',
  'purl (Package URL) is the universal identifier for dependencies.',
] as const;

// ────────────────────────────────────────────────────────────
// Agent Instruction Fragments (reusable across actions)
// ────────────────────────────────────────────────────────────

/**
 * Organization validation — prevents wrong/missing org name.
 * Inject into `.instructions()` via template literals.
 */
export const ORG_VALIDATION_HINT =
  'If unsure about the organization name, use codacy_organizations.list first to validate.';

/**
 * Repository validation — prevents missing/wrong repo name.
 */
export const REPO_VALIDATION_HINT =
  'Always provide the repository name. If unsure, use codacy_organizations.list_repos to validate.';

/**
 * Commit-first warning — analysis reflects committed state.
 */
export const COMMIT_FIRST_HINT =
  'Codacy analysis only reflects COMMITTED code — calling this after local edits without committing will show stale results.';
