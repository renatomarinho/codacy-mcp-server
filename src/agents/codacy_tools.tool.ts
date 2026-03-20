/**
 * codacy_tools — Analysis tools & code patterns (4q + 2m)
 * Mixed auth: global tool/pattern listings are noAuth, repo-specific need auth.
 */

import { f } from '../index.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { CodacyScopeModel } from '../models/CodacyScopeModel.js';
import { ToolPatternPresenter } from '../views/tool-pattern.presenter.js';

const tools = f.router('codacy_tools')
  .describe('Analysis tools & code patterns — list tools, view patterns, configure tool settings, enable/disable patterns.');

export const listTools = tools.query('list')
  .describe('List all analysis tools available in Codacy (ESLint, PMD, Semgrep, etc.).')
  .instructions(`Global catalog of available analysis tools — does NOT require authentication.
This returns tool names and UUIDs. Use the toolUuid when configuring tools for a specific repository with codacy_tools.configure or codacy_tools.repo_patterns.`)
  .cached()
  .handle(async (_input, ctx) => {
    return ctx.client.get('tools');
  });

export const repoTools = tools.query('repo_tools')
  .describe('List tools configured for a specific repository with their enabled/disabled status.')
  .use(requireAuth)
  .fromModel(CodacyScopeModel, 'repo')
  .proxy('analysis/organizations/:provider/:organization/repositories/:repository/tools');

export const getPattern = tools.query('get_pattern')
  .describe('Get the definition of a specific code pattern.')
  .instructions(`Global pattern definition — does NOT require authentication. Returns the pattern description, category, severity, and recommended status.
Common mistake: confusing patternId with toolUuid — patternId identifies a specific rule (e.g., ESLint_no-unused-vars), toolUuid identifies the tool. Both are required.`)
  .cached()
  .withString('toolUuid', 'Tool UUID (from codacy_tools.list)')
  .withString('patternId', 'Pattern identifier (e.g., ESLint_no-unused-vars)')
  .returns(ToolPatternPresenter)
  .proxy('tools/:toolUuid/patterns/:patternId');

export const repoPatterns = tools.query('repo_patterns')
  .describe('List code patterns for a specific tool in a repository with their enabled/disabled status.')
  .use(requireAuth)
  .fromModel(CodacyScopeModel, 'repo')
  .withString('toolUuid', 'Tool UUID (from repo_tools listing)')
  .withOptionalNumber('cursor', 'Pagination cursor')
  .withOptionalNumber('limit', 'Results per page (max 100)')
  .returns(ToolPatternPresenter)
  .handle(async (input, ctx) => {
    return ctx.client.get(
      `analysis/organizations/${input.provider}/${input.organization}/repositories/${input.repository}/tools/${input.toolUuid}/patterns`,
      { cursor: input.cursor, limit: input.limit ?? 50 },
    );
  });

// ── Mutations ───────────────────────────────────────────────────────────────

export const configureTool = tools.mutation('configure')
  .describe('Configure a tool for a repository — enable/disable the tool, set configuration file usage, and configure individual patterns with parameters.')
  .instructions(`Full tool configuration for a repository. Requires toolUuid from codacy_tools.repo_tools.
Common mistakes: (1) Using the tool name instead of toolUuid. (2) Enabling useConfigurationFile without having a config file in the repository — this will cause the tool to use no patterns.
For enabling/disabling specific patterns, use codacy_tools.update_patterns instead.
This action is idempotent — safe to retry.`)
  .use(requireAuth)
  .fromModel(CodacyScopeModel, 'repo')
  .withString('toolUuid', 'Tool UUID')
  .withOptionalBoolean('enabled', 'Enable or disable the tool')
  .withOptionalBoolean('useConfigurationFile', 'Whether to use the repository configuration file')
  .idempotent()
  .invalidates('codacy_tools.*')
  .handle(async (input, ctx) => {
    const body: Record<string, unknown> = {};
    if (input.enabled !== undefined) body.enabled = input.enabled;
    if (input.useConfigurationFile !== undefined) body.useConfigurationFile = input.useConfigurationFile;
    return ctx.client.patch(
      `analysis/organizations/${input.provider}/${input.organization}/repositories/${input.repository}/tools/${input.toolUuid}`,
      body,
    );
  });

export const updatePatterns = tools.mutation('update_patterns')
  .describe('Enable or disable specific code patterns for a tool in a repository.')
  .instructions(`Enable or disable specific patterns. Requires toolUuid from codacy_tools.repo_tools.
Common mistakes: (1) Not listing current patterns first — use codacy_tools.repo_patterns to see current state before making changes. (2) Using patternId from a different tool.
For enabling/disabling the entire tool, use codacy_tools.configure instead.
This action is idempotent — safe to retry.`)
  .use(requireAuth)
  .fromModel(CodacyScopeModel, 'repo')
  .withString('toolUuid', 'Tool UUID')
  .withString('patternsJson', 'JSON array of patterns to update, e.g. [{"id":"ESLint_no-unused-vars","enabled":true}]')
  .idempotent()
  .invalidates('codacy_tools.*')
  .handle(async (input, ctx) => {
    const patterns = JSON.parse(input.patternsJson);
    return ctx.client.patch(
      `analysis/organizations/${input.provider}/${input.organization}/repositories/${input.repository}/tools/${input.toolUuid}`,
      { patterns },
    );
  });
