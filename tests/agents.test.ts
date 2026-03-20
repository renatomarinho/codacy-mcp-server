/**
 * Agents (Structural) — Router definitions, action names, proxy endpoints.
 *
 * An QA engineer smiles when: an agent declares a .proxy() with a
 * :param that doesn't exist in the tool's input, causing a silent 404.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const AGENTS_DIR = resolve(import.meta.dirname, '..', 'src', 'agents');

function getAgentFiles(): Array<{ name: string; content: string }> {
  return readdirSync(AGENTS_DIR)
    .filter(f => f.endsWith('.tool.ts'))
    .map(f => ({ name: f, content: readFileSync(join(AGENTS_DIR, f), 'utf-8') }));
}

// ── Router Definitions ───────────────────────────────────────────────────────

describe('Agents — Router Definitions', () => {
  for (const { name, content } of getAgentFiles()) {
    it(`${name} has exactly one f.router() call`, () => {
      const routers = content.match(/f\.router\(/g);
      expect(routers).not.toBeNull();
      expect(routers!.length).toBe(1);
    });

    it(`${name} router has .describe()`, () => {
      expect(content).toContain('.describe(');
    });
  }
});

// ── Action Naming ────────────────────────────────────────────────────────────

describe('Agents — Action Names', () => {
  for (const { name, content } of getAgentFiles()) {
    // Extract all action names: .query('name') or .mutation('name') or .action('name')
    const actionPattern = /\.(query|mutation|action)\(\s*['"](\w+)['"]\)/g;
    const actions: Array<{ type: string; name: string }> = [];
    let match: RegExpExecArray | null;
    while ((match = actionPattern.exec(content)) !== null) {
      actions.push({ type: match[1], name: match[2] });
    }

    it(`${name} has at least one action defined`, () => {
      expect(actions.length).toBeGreaterThan(0);
    });

    it(`${name} action names don't contain dots (Vurb.ts restriction)`, () => {
      for (const action of actions) {
        expect(action.name).not.toContain('.');
      }
    });

    it(`${name} action names use only lowercase + underscores`, () => {
      for (const action of actions) {
        expect(action.name).toMatch(/^[a-z][a-z0-9_]*$/);
      }
    });

    it(`${name} has no duplicate action names`, () => {
      const names = actions.map(a => a.name);
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    });
  }
});

// ── Every .describe() is non-empty ──────────────────────────────────────────

describe('Agents — Descriptions', () => {
  for (const { name, content } of getAgentFiles()) {
    const describePattern = /\.describe\(\s*'([^']*)'\s*\)|\.describe\(\s*"([^"]*)"\s*\)/g;
    let match: RegExpExecArray | null;

    while ((match = describePattern.exec(content)) !== null) {
      const text = match[1] ?? match[2];
      it(`${name} description is non-empty: "${text.slice(0, 50)}..."`, () => {
        expect(text.length).toBeGreaterThan(10);
      });
    }
  }
});

// ── Mutations vs Queries segregation ─────────────────────────────────────────

describe('Agents — Mutation Safety', () => {
  for (const { name, content } of getAgentFiles()) {
    // Find mutation indices precisely
    const mutationRegex = /\.mutation\(\s*['"]([\w]+)['"]\)/g;
    let match: RegExpExecArray | null;

    while ((match = mutationRegex.exec(content)) !== null) {
      const actionName = match[1];
      const startIdx = match.index;

      // Scope: from this .mutation() to the next .query(, .mutation(, or export const
      const nextBoundary = content.slice(startIdx + match[0].length).search(
        /\.(query|mutation)\(|export\s+const\s/,
      );
      const endIdx = nextBoundary === -1 ? content.length : startIdx + match[0].length + nextBoundary;
      const block = content.slice(startIdx, endIdx);

      // Mutations must NOT be .cached()
      it(`${name} mutation "${actionName}" is not marked .cached()`, () => {
        expect(block).not.toContain('.cached()');
      });
    }
  }
});

// ── .instructions() quality check ────────────────────────────────────────────

describe('Agents — Instructions Quality', () => {
  for (const { name, content } of getAgentFiles()) {
    const instructionPattern = /\.instructions\(\s*['"]([^'"]+)['"]\)/g;
    let match: RegExpExecArray | null;

    while ((match = instructionPattern.exec(content)) !== null) {
      const text = match[1];

      it(`${name} instruction is substantive (>20 chars): "${text.slice(0, 40)}..."`, () => {
        expect(text.length).toBeGreaterThan(20);
      });
    }
  }
});

// ── .egress() is used on high-volume queries ─────────────────────────────────

describe('Agents — Egress Limits', () => {
  // Only check agents that return large, variable-size data sets
  // codacy_tools.list and codacy_quality.list_policies are small, cacheable catalogs
  const highVolumeChecks: Array<{ file: string; actions: string[] }> = [
    { file: 'codacy_issues.tool.ts',    actions: ['list'] },
    { file: 'codacy_security.tool.ts',  actions: ['search_org', 'search_repo'] },
  ];

  for (const { file, actions } of highVolumeChecks) {
    const content = readFileSync(join(AGENTS_DIR, file), 'utf-8');

    for (const action of actions) {
      it(`${file} query "${action}" has .egress() limit`, () => {
        const pattern = new RegExp(`\\.(query)\\(\\s*['"]${action}['"]\\)`);
        const startIdx = content.search(pattern);
        expect(startIdx).toBeGreaterThan(-1);
        const endIdx = content.indexOf('export ', startIdx + 1);
        const block = content.slice(startIdx, endIdx === -1 ? undefined : endIdx);
        expect(block).toContain('.egress(');
      });
    }
  }
});

// ── codacy_cli does NOT use requireAuth ──────────────────────────────────────

describe('Agents — codacy_cli is noAuth', () => {
  const cliContent = readFileSync(join(AGENTS_DIR, 'codacy_cli.tool.ts'), 'utf-8');

  it('does not import or use requireAuth', () => {
    expect(cliContent).not.toContain('requireAuth');
  });
});
