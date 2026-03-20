/**
 * Codacy MCP Server — Vurb.ts entry point.
 *
 * Uses startServer() with autoDiscover() — no manual imports needed.
 * Handles: MCP Server creation, registry attachment, telemetry, transport.
 */

import { startServer, PromptRegistry, autoDiscover } from '@vurb/core';
import type { StateSyncConfig } from '@vurb/core';
import { registry } from './index.js';
import { createCodacyContext, type CodacyContext } from './context.js';

// ── Import prompts ──────────────────────────────────────────────────────────

import { codeReviewPrompt, securityAuditPrompt, repoHealthPrompt } from './prompts/prompts.js';

// ── Prompt Registry ─────────────────────────────────────────────────────────

const prompts = new PromptRegistry<CodacyContext>();
prompts.register(codeReviewPrompt);
prompts.register(securityAuditPrompt);
prompts.register(repoHealthPrompt);

// ── State Sync (raw config object) ──────────────────────────────────────────

const stateSync: StateSyncConfig = {
  defaults: { cacheControl: 'no-store' },
  policies: [
    { match: 'codacy_tools.list',             cacheControl: 'immutable' },
    { match: 'codacy_tools.get_pattern',      cacheControl: 'immutable' },
    { match: 'codacy_organizations*',         cacheControl: 'immutable' },
    { match: 'codacy_quality*',               cacheControl: 'immutable' },
    { match: 'codacy_issues.ignore*',         invalidates: ['codacy_issues*'] },
    { match: 'codacy_issues.bulk_ignore*',    invalidates: ['codacy_issues*'] },
    { match: 'codacy_security.ignore*',       invalidates: ['codacy_security*'] },
    { match: 'codacy_tools.configure*',       invalidates: ['codacy_tools*'] },
    { match: 'codacy_tools.update_patterns*', invalidates: ['codacy_tools*'] },
    { match: 'codacy_pull_requests.trigger*', invalidates: ['codacy_pull_requests*'] },
    { match: 'codacy_pull_requests.bypass*',  invalidates: ['codacy_pull_requests*'] },
    { match: 'codacy_repositories.setup',     invalidates: ['codacy_organizations*', 'codacy_repositories*'] },
  ],
};

// ── Start ───────────────────────────────────────────────────────────────────

async function main() {
  // Auto-discover agents from the agents/ directory (replaces 11 manual imports)
  await autoDiscover(registry, new URL('./agents', import.meta.url).pathname);

  await startServer<CodacyContext>({
    name: 'codacy-mcp-vurb',
    version: '1.0.0',
    registry,
    prompts,
    contextFactory: createCodacyContext,
    attach: {
      toolExposition: 'grouped',
      stateSync,
    },
  });

  console.error('Codacy MCP Server (Vurb.ts) running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
