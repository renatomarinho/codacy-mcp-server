/**
 * Cross-Cutting Invariants — Regression guards.
 *
 * An QA engineer smiles when: someone adds a new agent, forgets
 * to use constants, and these tests block the PR.
 *
 * These tests read SOURCE FILES as strings to detect anti-patterns
 * that wouldn't be caught by TypeScript alone.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SRC_DIR = resolve(import.meta.dirname, '..', 'src');
const AGENTS_DIR = join(SRC_DIR, 'agents');
const VIEWS_DIR = join(SRC_DIR, 'views');
const MODELS_DIR = join(SRC_DIR, 'models');

function readFile(path: string): string {
  return readFileSync(path, 'utf-8');
}

function getAgentFiles(): string[] {
  return readdirSync(AGENTS_DIR).filter(f => f.endsWith('.tool.ts')).map(f => join(AGENTS_DIR, f));
}

function getPresenterFiles(): string[] {
  return readdirSync(VIEWS_DIR).filter(f => f.endsWith('.presenter.ts')).map(f => join(VIEWS_DIR, f));
}

function getModelFiles(): string[] {
  return readdirSync(MODELS_DIR).filter(f => f.endsWith('.ts')).map(f => join(MODELS_DIR, f));
}

// ── No inline PROVIDERS arrays in agents ────────────────────────────────────

describe('Invariant: No inline provider arrays', () => {
  for (const file of getAgentFiles()) {
    const content = readFile(file);
    const basename = file.split(/[\\/]/).pop()!;

    it(`${basename} does not hardcode ['gh', 'gl', 'bb']`, () => {
      // Match the exact inline array pattern that should be replaced by PROVIDERS constant
      const inlineProviderPattern = /\['gh',\s*'gl',\s*'bb'\]/;
      const matches = content.match(inlineProviderPattern);
      expect(matches).toBeNull();
    });
  }

  for (const file of getModelFiles()) {
    const content = readFile(file);
    const basename = file.split(/[\\/]/).pop()!;

    it(`${basename} does not hardcode ['gh', 'gl', 'bb']`, () => {
      const inlineProviderPattern = /\['gh',\s*'gl',\s*'bb'\]/;
      const matches = content.match(inlineProviderPattern);
      expect(matches).toBeNull();
    });
  }
});

// ── No inline IGNORE_REASONS in agents ──────────────────────────────────────

describe('Invariant: No inline ignore reason arrays', () => {
  for (const file of getAgentFiles()) {
    const content = readFile(file);
    const basename = file.split(/[\\/]/).pop()!;

    it(`${basename} does not hardcode ['FalsePositive', 'WontFix', 'NotRelevant']`, () => {
      const pattern = /\['FalsePositive',\s*'WontFix',\s*'NotRelevant'\]/;
      expect(content.match(pattern)).toBeNull();
    });
  }
});

// ── Server.ts uses autoDiscover, not manual imports ───────────────────────

describe('Invariant: server.ts uses autoDiscover', () => {
  const serverContent = readFile(join(SRC_DIR, 'server.ts'));

  it('imports autoDiscover from @vurb/core', () => {
    expect(serverContent).toContain('autoDiscover');
  });

  it('does NOT have manual agent imports', () => {
    // Should not have import './agents/*' pattern
    const manualImportPattern = /import\s+['"]\.\/agents\//;
    expect(serverContent.match(manualImportPattern)).toBeNull();
  });
});

// ── Every agent file uses fromModel for scope ───────────────────────────────

describe('Invariant: Agents use .fromModel() for scope', () => {
  // Agents that are expected to use fromModel (all except codacy_cli which is local)
  const agentFiles = getAgentFiles().filter(f => !f.includes('codacy_cli'));

  for (const file of agentFiles) {
    const content = readFile(file);
    const basename = file.split(/[\\/]/).pop()!;

    it(`${basename} imports CodacyScopeModel`, () => {
      expect(content).toContain('CodacyScopeModel');
    });

    it(`${basename} uses .fromModel(CodacyScopeModel`, () => {
      expect(content).toContain('.fromModel(CodacyScopeModel');
    });
  }
});

// ── Every presenter has agentLimit ──────────────────────────────────────────

describe('Invariant: Collection presenters use agentLimit', () => {
  // issue-overview is a single-object presenter (not a collection) — no agentLimit needed
  const EXCLUDED = ['issue-overview.presenter.ts'];

  for (const file of getPresenterFiles()) {
    const basename = file.split(/[\\/]/).pop()!;
    if (EXCLUDED.includes(basename)) continue;

    const content = readFile(file);
    it(`${basename} defines agentLimit`, () => {
      expect(content).toContain('agentLimit');
    });
  }
});

// ── .proxy() endpoints don't start with slash ───────────────────────────────

describe('Invariant: .proxy() endpoints start without leading slash', () => {
  for (const file of getAgentFiles()) {
    const content = readFile(file);
    const basename = file.split(/[\\/]/).pop()!;

    it(`${basename} proxy endpoints have no leading slash`, () => {
      // Match .proxy('/... which is wrong — should be .proxy('analysis/...
      const badProxyPattern = /\.proxy\(\s*['"]\//;
      expect(content.match(badProxyPattern)).toBeNull();
    });
  }
});

// ── Every mutation has .invalidates() or .idempotent() ──────────────────────

describe('Invariant: Mutations have cache invalidation', () => {
  for (const file of getAgentFiles()) {
    const content = readFile(file);
    const basename = file.split(/[\\/]/).pop()!;

    const mutationRegex = /\.mutation\(\s*['"](\w+)['"]\)/g;
    let match: RegExpExecArray | null;

    while ((match = mutationRegex.exec(content)) !== null) {
      const actionName = match[1];
      const startIdx = match.index;

      // Scope to just this mutation's chain (until next .query(, .mutation(, or export const)
      const rest = content.slice(startIdx + match[0].length);
      const nextBoundary = rest.search(/\.(query|mutation)\(|export\s+const\s/);
      const endIdx = nextBoundary === -1 ? content.length : startIdx + match[0].length + nextBoundary;
      const block = content.slice(startIdx, endIdx);

      it(`${basename} mutation "${actionName}" has .invalidates() or .idempotent()`, () => {
        const hasInvalidates = block.includes('.invalidates(');
        const hasIdempotent = block.includes('.idempotent()');
        expect(hasInvalidates || hasIdempotent).toBe(true);
      });
    }
  }
});

// ── Every agent with .proxy() uses :param syntax matching input fields ──────

describe('Invariant: .proxy() param names match tool input fields', () => {
  for (const file of getAgentFiles()) {
    const content = readFile(file);
    const basename = file.split(/[\\/]/).pop()!;

    // Find .proxy('endpoint/:param/:param2') calls
    const proxyMatches = content.matchAll(/\.proxy\(['"]([^'"]+)['"]\)/g);
    for (const match of proxyMatches) {
      const endpoint = match[1];
      const params = endpoint.match(/:(\w+)/g)?.map(p => p.slice(1)) ?? [];

      for (const param of params) {
        it(`${basename} proxy endpoint "${endpoint}" — param ":${param}" is a known scope or input field`, () => {
          // These are valid param names from CodacyScopeModel + common input fields
          const knownParams = [
            'provider', 'organization', 'repository', 'branchName',
            'issueId', 'commitSha', 'pullRequestNumber', 'fileId',
            'toolUuid', 'policyId', 'srmItemId', 'patternId',
          ];
          expect(knownParams).toContain(param);
        });
      }
    }
  }
});

// ── No duplicate router names across agent files ────────────────────────────

describe('Invariant: No duplicate router names', () => {
  const routerNames: string[] = [];

  for (const file of getAgentFiles()) {
    const content = readFile(file);
    const matches = content.matchAll(/f\.router\(['"](\w+)['"]\)/g);
    for (const match of matches) {
      routerNames.push(match[1]);
    }
  }

  it('all router names are unique', () => {
    const unique = new Set(routerNames);
    expect(unique.size).toBe(routerNames.length);
  });

  it('there are exactly 11 routers', () => {
    expect(routerNames.length).toBe(11);
  });
});

// ── IssueOverview presenter has suggestActions (regression from Phase 2) ───

describe('Invariant: IssueOverview presenter has suggestActions', () => {
  const content = readFile(join(VIEWS_DIR, 'issue-overview.presenter.ts'));

  it('defines suggestActions', () => {
    expect(content).toContain('suggestActions');
  });
});

// ── Constants file is the single source of truth ────────────────────────────

describe('Invariant: Constants file completeness', () => {
  const content = readFile(join(SRC_DIR, 'utils', 'constants.ts'));

  it('exports PROVIDERS', () => {
    expect(content).toContain('export const PROVIDERS');
  });
  it('exports ISSUE_LEVELS', () => {
    expect(content).toContain('export const ISSUE_LEVELS');
  });
  it('exports SEVERITY_LEVELS', () => {
    expect(content).toContain('export const SEVERITY_LEVELS');
  });
  it('exports SCAN_TYPES', () => {
    expect(content).toContain('export const SCAN_TYPES');
  });
  it('exports IGNORE_REASONS', () => {
    expect(content).toContain('export const IGNORE_REASONS');
  });
  it('exports SBOM_RISK_CATEGORIES', () => {
    expect(content).toContain('export const SBOM_RISK_CATEGORIES');
  });
  it('exports LANGUAGES', () => {
    expect(content).toContain('export const LANGUAGES');
  });
});
