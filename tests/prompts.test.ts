/**
 * Prompts — Action name validation, input shape, handler contract.
 *
 * An QA engineer smiles when: a prompt invokes a tool with the
 * wrong action name and the integration silently returns empty data.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const SRC_DIR = resolve(import.meta.dirname, '..', 'src');

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

describe('Prompts — invokeTool Action Name Validation', () => {
  const promptsContent = readFileSync(join(SRC_DIR, 'prompts', 'prompts.ts'), 'utf-8');

  // Extract all ctx.invokeTool('toolName', { action: 'actionName', ... }) calls
  const invokePattern = /ctx\.invokeTool\(\s*['"](\w+)['"]\s*,\s*\{[^}]*action:\s*['"](\w+)['"]/g;
  const invocations: Array<{ tool: string; action: string }> = [];

  let match: RegExpExecArray | null;
  while ((match = invokePattern.exec(promptsContent)) !== null) {
    invocations.push({ tool: match[1], action: match[2] });
  }

  it('finds at least 5 invokeTool calls (sanity check)', () => {
    expect(invocations.length).toBeGreaterThanOrEqual(5);
  });

  for (const { tool, action } of invocations) {
    it(`invokeTool('${tool}', { action: '${action}' }) references a valid tool`, () => {
      expect(Object.keys(VALID_ACTIONS)).toContain(tool);
    });

    it(`invokeTool('${tool}', { action: '${action}' }) references a valid action`, () => {
      const validActions = VALID_ACTIONS[tool];
      expect(validActions).toBeDefined();
      expect(validActions).toContain(action);
    });
  }
});

describe('Prompts — Input Shape Requirements', () => {
  const promptsContent = readFileSync(join(SRC_DIR, 'prompts', 'prompts.ts'), 'utf-8');

  it('code_review prompt requires pullRequestNumber', () => {
    // Verify the input definition includes pullRequestNumber
    expect(promptsContent).toContain("pullRequestNumber:");
  });

  it('security_audit prompt requires provider, organization, repository', () => {
    // All 3 prompts need these minimum params
    const securityBlock = promptsContent.slice(
      promptsContent.indexOf("f.prompt('security_audit')"),
      promptsContent.indexOf("f.prompt('repo_health')"),
    );
    expect(securityBlock).toContain("provider:");
    expect(securityBlock).toContain("organization:");
    expect(securityBlock).toContain("repository:");
  });

  it('repo_health prompt requires provider, organization, repository', () => {
    const repoBlock = promptsContent.slice(
      promptsContent.indexOf("f.prompt('repo_health')"),
    );
    expect(repoBlock).toContain("provider:");
    expect(repoBlock).toContain("organization:");
    expect(repoBlock).toContain("repository:");
  });
});

describe('Prompts — PromptMessage usage', () => {
  const promptsContent = readFileSync(join(SRC_DIR, 'prompts', 'prompts.ts'), 'utf-8');

  it('every prompt handler uses PromptMessage.system()', () => {
    // Count system messages vs prompt declarations
    const promptCount = (promptsContent.match(/f\.prompt\(/g) ?? []).length;
    const systemMsgCount = (promptsContent.match(/PromptMessage\.system\(/g) ?? []).length;
    expect(systemMsgCount).toBeGreaterThanOrEqual(promptCount);
  });

  it('every prompt handler returns messages array', () => {
    const returnMessages = (promptsContent.match(/messages:\s*\[/g) ?? []).length;
    const promptCount = (promptsContent.match(/f\.prompt\(/g) ?? []).length;
    expect(returnMessages).toBe(promptCount);
  });
});
