/**
 * Codacy domain constants — languages, categories, severity levels, providers.
 * Used by Models, Presenters, and Tools across the entire server.
 */

export const CODACY_API_BASE = 'https://app.codacy.com/api/v3';

export const PROVIDERS = ['gh', 'gl', 'bb'] as const;
export type Provider = (typeof PROVIDERS)[number];

export const PROVIDER_LABELS: Record<Provider, string> = {
  gh: 'GitHub',
  gl: 'GitLab',
  bb: 'Bitbucket',
};

export const ISSUE_CATEGORIES = [
  'Security',
  'ErrorProne',
  'Performance',
  'Compatibility',
  'UnusedCode',
  'Complexity',
  'CodeStyle',
  'Documentation',
  'BestPractice',
  'Comprehensibility',
] as const;
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export const ISSUE_LEVELS = ['Error', 'Warning', 'Info'] as const;
export type IssueLevel = (typeof ISSUE_LEVELS)[number];

export const SECURITY_CATEGORIES = [
  'Auth',
  'Cookies',
  'CSRF',
  'Cryptography',
  'DoS',
  'FileAccess',
  'HTTP',
  'InputValidation',
  'InsecureModulesLibraries',
  'InsecureStorage',
  'Regex',
  'SQLInjection',
  'UnexpectedBehaviour',
  'Visibility',
  'XSS',
  'Other',
  '_other_',
] as const;
export type SecurityCategory = (typeof SECURITY_CATEGORIES)[number];

export const REPO_SCAN_TYPES = ['SAST', 'SCA', 'Secrets', 'IaC', 'CICD'] as const;
export type RepoScanType = (typeof REPO_SCAN_TYPES)[number];

export const SCAN_TYPES = [...REPO_SCAN_TYPES, 'DAST', 'PenTesting'] as const;
export type ScanType = (typeof SCAN_TYPES)[number];

export const SEVERITY_LEVELS = ['Critical', 'High', 'Medium', 'Low', 'Info'] as const;
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

export const IGNORE_REASONS = [
  'FalsePositive',
  'WontFix',
  'NotRelevant',
] as const;
export type IgnoreReason = (typeof IGNORE_REASONS)[number];

export const SECURITY_STATUSES = [
  'OnTrack', 'DueSoon', 'Overdue',       // Open
  'ClosedOnTime', 'ClosedLate', 'Ignored', // Closed
] as const;
export type SecurityStatus = (typeof SECURITY_STATUSES)[number];

export const SBOM_RISK_CATEGORIES = ['Forbidden', 'Risky', 'Normal'] as const;
export type SbomRiskCategory = (typeof SBOM_RISK_CATEGORIES)[number];

export const LANGUAGES = [
  'ABAP', 'Apex', 'C', 'CPP', 'CSharp', 'CSS', 'CoffeeScript',
  'Crystal', 'Dart', 'Dockerfile', 'Elixir', 'Go', 'Groovy',
  'Haskell', 'JSON', 'Java', 'JavaScript', 'Kotlin', 'Less',
  'Lua', 'Markdown', 'ObjectiveC', 'PHP', 'PLSQL', 'Perl',
  'PowerShell', 'Python', 'Ruby', 'Rust', 'SASS', 'SQL', 'Sass',
  'Scala', 'Shell', 'Solidity', 'Swift', 'Terraform', 'TypeScript',
  'VisualBasic', 'VisualForce', 'XML', 'YAML',
] as const;
export type Language = (typeof LANGUAGES)[number];
