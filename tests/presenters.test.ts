/**
 * Presenters — Schema, agentLimit, suggestActions, collectionUi, redactPII.
 *
 * An QA engineer smiles when: a suggestActions function references
 * a tool name that doesn't exist, silently guiding the LLM to a dead end.
 *
 * NOTE: definePresenter returns Presenter instances whose internal properties
 * are not publicly exposed. We test suggestActions/redactPII logic by reading
 * source files and validating tool+action references against the VALID_ACTIONS map.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const VIEWS_DIR = resolve(import.meta.dirname, '..', 'src', 'views');

// Valid actions per tool (must stay in sync with agents)
const VALID_ACTIONS: Record<string, string[]> = {
  codacy_organizations: ['list', 'list_repos'],
  codacy_repositories:  ['get', 'list_branches', 'setup'],
  codacy_issues:        ['list', 'get', 'file_issues', 'pr_issues', 'overview', 'quickfix_patch', 'ignore', 'bulk_ignore'],
  codacy_security:      ['search_org', 'search_repo', 'dashboard', 'sbom_search', 'ossf_scorecard', 'ignore'],
  codacy_files:         ['list', 'get', 'coverage', 'clones'],
  codacy_pull_requests: ['list', 'get', 'coverage', 'diff', 'trigger_ai_review', 'bypass'],
  codacy_tools:         ['list', 'repo_tools', 'get_pattern', 'repo_patterns', 'configure', 'update_patterns'],
  codacy_quality:       ['get_settings', 'list_policies', 'get_policy'],
  codacy_commits:       ['list', 'get', 'issues'],
  codacy_overview:      ['issues', 'categories'],
  codacy_cli:           ['analyze', 'install'],
};

const VALID_TOOLS = Object.keys(VALID_ACTIONS);

function getPresenterFiles(): Array<{ name: string; content: string }> {
  return readdirSync(VIEWS_DIR)
    .filter(f => f.endsWith('.presenter.ts'))
    .map(f => ({ name: f, content: readFileSync(join(VIEWS_DIR, f), 'utf-8') }));
}

// ── Structure: every presenter has required properties ───────────────────────

describe('Presenters — Structure', () => {
  // issue-overview.presenter.ts is excluded from agentLimit: it presents a single overview object
  const AGENTLIMIT_EXCLUDED = ['issue-overview.presenter.ts'];

  for (const { name, content } of getPresenterFiles()) {
    it(`${name} has definePresenter call`, () => {
      expect(content).toContain('definePresenter(');
    });

    it(`${name} has a schema reference`, () => {
      expect(content).toContain('schema:');
    });

    if (!AGENTLIMIT_EXCLUDED.includes(name)) {
      it(`${name} has agentLimit`, () => {
        expect(content).toContain('agentLimit');
      });
    }
  }
});

// ── suggestActions tool/action references ────────────────────────────────────

describe('Presenters — suggestActions Validity', () => {
  for (const { name, content } of getPresenterFiles()) {
    if (!content.includes('suggestActions')) continue;

    // Extract all tool: 'name' and action: 'name' references from suggestActions
    const toolPattern = /tool:\s*['"](\w+)['"]/g;
    const actionPattern = /action:\s*['"](\w+)['"]/g;

    const tools: string[] = [];
    const actions: Array<{ action: string; tool?: string }> = [];

    let match: RegExpExecArray | null;
    while ((match = toolPattern.exec(content)) !== null) {
      tools.push(match[1]);
    }
    while ((match = actionPattern.exec(content)) !== null) {
      actions.push({ action: match[1] });
    }

    for (const tool of tools) {
      it(`${name} suggestActions references valid tool: "${tool}"`, () => {
        expect(VALID_TOOLS).toContain(tool);
      });
    }

    for (const { action } of actions) {
      it(`${name} suggestActions references a valid action name: "${action}"`, () => {
        // The action must exist in at least one tool's valid actions
        const existsInSomeTool = Object.values(VALID_ACTIONS).some(acts => acts.includes(action));
        expect(existsInSomeTool).toBe(true);
      });
    }
  }
});

// ── SecurityPresenter DLP config ─────────────────────────────────────────────

describe('SecurityPresenter — DLP Config', () => {
  const securityContent = readFileSync(join(VIEWS_DIR, 'security.presenter.ts'), 'utf-8');

  it('has redactPII configuration', () => {
    expect(securityContent).toContain('redactPII');
  });

  it('uses [REDACTED] as censor', () => {
    expect(securityContent).toContain('[REDACTED]');
  });

  it('covers common secret field patterns', () => {
    const mustCover = ['secret', 'token', 'password', 'apiKey', 'credentials'];
    for (const secret of mustCover) {
      expect(securityContent).toContain(secret);
    }
  });
});

// ── collectionUi presence ────────────────────────────────────────────────────

describe('Presenters — collectionUi', () => {
  const presentersWithCollectionUi = [
    'issue.presenter.ts',
    'security.presenter.ts',
    'pull-request.presenter.ts',
    'file.presenter.ts',
    'commit.presenter.ts',
    'tool-pattern.presenter.ts',
  ];

  for (const presenterFile of presentersWithCollectionUi) {
    const content = readFileSync(join(VIEWS_DIR, presenterFile), 'utf-8');

    it(`${presenterFile} has collectionUi`, () => {
      expect(content).toContain('collectionUi');
    });
  }
});

// ── IssueOverviewPresenter has suggestActions with sorting logic ──────────────

describe('IssueOverviewPresenter — suggestActions Logic', () => {
  const content = readFileSync(join(VIEWS_DIR, 'issue-overview.presenter.ts'), 'utf-8');

  it('has suggestActions', () => {
    expect(content).toContain('suggestActions');
  });

  it('sorts categories by count to find highest', () => {
    expect(content).toContain('.sort(');
  });

  it('checks for Error severity level', () => {
    expect(content).toContain("'Error'");
  });

  it('handles zero-issue case (checks totalCount > 0)', () => {
    expect(content).toContain('totalCount > 0');
  });
});

// ── ToolPatternPresenter has suggestActions with smart logic ──────────────────

describe('ToolPatternPresenter — suggestActions Logic', () => {
  const content = readFileSync(join(VIEWS_DIR, 'tool-pattern.presenter.ts'), 'utf-8');

  it('checks pattern.recommended status', () => {
    expect(content).toContain('recommended');
  });

  it('checks pattern.enabled status', () => {
    expect(content).toContain('enabled');
  });
});

// ── GatePolicyPresenter has suggestActions ────────────────────────────────────

describe('GatePolicyPresenter — suggestActions Logic', () => {
  const content = readFileSync(join(VIEWS_DIR, 'gate-policy.presenter.ts'), 'utf-8');

  it('checks isDefault policy', () => {
    expect(content).toContain('isDefault');
  });
});

// ── IssueOverviewPresenter has ui.echarts ────────────────────────────────────

describe('IssueOverviewPresenter — Charts', () => {
  const content = readFileSync(join(VIEWS_DIR, 'issue-overview.presenter.ts'), 'utf-8');

  it('renders pie charts for categories', () => {
    expect(content).toContain("type: 'pie'");
    expect(content).toContain('Issues by Category');
  });

  it('renders pie charts for severity', () => {
    expect(content).toContain('Issues by Severity');
  });

  it('shows total count summary', () => {
    expect(content).toContain('Total issues:');
  });
});
