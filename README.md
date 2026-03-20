# Codacy MCP Server — Vurb.ts Edition

> The official [Codacy MCP Server](https://github.com/codacy/codacy-mcp-server) reimagined with the [Vurb.ts](https://github.com/vinkius-labs/vurb.ts) framework — **structured perception for AI agents.**

[![Vurb.ts](https://img.shields.io/badge/Built%20with-Vurb.ts-blueviolet?style=flat-square)](https://github.com/vinkius-labs/vurb.ts)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](tsconfig.json)

---

## 11 Tools - 44 actions available on-demand
<img width="538" height="111" alt="image" src="https://github.com/user-attachments/assets/903fd134-6ebe-4dc2-92eb-fc70aea917e7" />

## 3 Prompts MCP prompts — code-review, security-audit, repo-health
<img width="337" height="239" alt="image" src="https://github.com/user-attachments/assets/428a84c3-3a66-49c2-be71-8a0127d3d982" />

<br>
<br>

> [!IMPORTANT]
> ### 🤖 Zero lines of human code.
> An AI agent (Antigravity, Opus 4.6) read a framework's [`llms.txt`](https://vurb.vinkius.com/llms.txt) and a [488-line skill file](https://github.com/vinkius-labs/vurb.ts/blob/main/.claude/skills/vurb-ts-development/SKILL.md). That's all it knew about Vurb.ts.
> From that, it built a complete production codebase from scratch:
> 11 tools · 44 actions · 12 models · 11 presenters · 3 prompts · 105 tests
> No human wrote a single line.

**The thesis of Vurb.ts**: if an AI agent can learn a framework from its `llms.txt` and produce production-grade code on the first attempt — the framework is doing its job.

> [!NOTE]
> ### 📐 Designed for agents, not for humans.
>
> Traditional frameworks optimize for human ergonomics — tutorials, documentation, months of learning curve. **Vurb.ts inverts this entirely.** Its fluent API, `llms.txt`, and skill system were designed so that an AI agent can become productive in a single context window. The learning curve isn't short — it's **zero.** The agent reads the spec, understands the patterns, and ships. This codebase is the proof.

---

## Why Vurb.ts?

The original Codacy MCP Server is a solid, production-grade implementation. This edition rebuilds it using the **Vurb.ts MVA (Model · View · Agent) pattern** — a framework designed specifically for MCP servers that gives AI agents **structured, high-fidelity perception** instead of raw JSON dumps.

Key advantages of the Vurb.ts approach:

- 🧠 **Structured Perception** — Presenters transform raw API data into optimized, LLM-readable formats with semantic annotations, HATEOAS navigation links, and severity-based suggestions
- 🛡️ **Guardrails** — Middleware (`requireAuth`), egress limits, idempotent mutation markers, and DLP redaction (secrets are stripped before reaching the wire)
- 📋 **Prompt Templates** — First-class support for MCP prompts (`code-review`, `security-audit`, `repo-health`) with dynamic argument injection
- 🔄 **State Sync** — Declarative cache invalidation policies ensure mutations automatically refresh dependent queries
- 🧩 **Fluent API** — Each tool action is defined as a composable, type-safe chain — no manual JSON schemas or handler wiring
- 📦 **Zero Code Generation** — No auto-generated OpenAPI client; a lightweight typed HTTP client is all that's needed
- 🗂️ **Grouped Exposition** — 44 actions exposed as 11 namespace tools, avoiding context window explosion

---


## Capability Matrix

| Capability | Original | Vurb.ts |
|------------|:--------:|:-------:|
| **Security & DLP** | | |
| Auth middleware with self-healing errors | ❌ | ✅ |
| Secret redaction before wire (DLP) | ❌ | ✅ |
| Egress size limits per action | ❌ | ✅ |
| Safe process execution (`execFileSync`) for analysis | ❌ | ✅ |
| **Determinism & Guardrails** | | |
| Typed input schemas (Zod) | ❌ | ✅ |
| Idempotent mutation markers | ❌ | ✅ |
| Declarative cache invalidation | ❌ | ✅ |
| `.instructions()` with common-mistake guardrails | ❌ | ✅ |
| Tool-redirection hints (cross-agent navigation) | ❌ | ✅ |
| **LLM Optimization** | | |
| Grouped tool exposition (−78% context tokens) | ❌ | ✅ |
| HATEOAS navigation links in responses | ❌ | ✅ |
| Severity-aware action suggestions | ❌ | ✅ |
| Presenter-formatted tables (vs raw JSON) | ❌ | ✅ |
| **MCP Protocol** | | |
| `tools/list` | ✅ | ✅ |
| `tools/call` | ✅ | ✅ |
| `prompts/list` + `prompts/get` | ❌ | ✅ |
| State sync / cache control headers | ❌ | ✅ |
| **Developer Experience** | | |
| Auto-discovery (zero manual imports) | ❌ | ✅ |
| Fluent builder API | ❌ | ✅ |
| Test suite (105 tests) | ❌ | ✅ |
| Hot-reload dev server | ❌ | ✅ |

---

## Grouped Tool Exposition — Solving Context Explosion

This is the **single most important architectural difference** between the two implementations.

### The Problem

The original server registers **24 flat tools** in the MCP `tools/list` response. Every one of them — with its full name, description, and JSON Schema — is injected into the LLM's system prompt **at the start of every conversation**. This means the model must process ~4,000 tokens of tool definitions before the user even types a word.

At 44 actions, a flat approach would be even worse — **~7,000+ tokens consumed permanently** just by tool schemas, leaving less room for actual conversation and reasoning.

### The Solution: `toolExposition: 'grouped'`

Vurb.ts introduces **grouped tool exposition**. Instead of exposing 44 individual tools, the MCP server advertises only **11 namespace routers**:

```
Original (flat)                    Vurb.ts (grouped)
─────────────────────              ──────────────────────
codacy_list_organizations          codacy_organizations     → 2 actions
codacy_list_organization_repos     codacy_repositories      → 3 actions
codacy_list_repository_issues      codacy_issues            → 7 actions
codacy_search_org_srm_items        codacy_security          → 6 actions
codacy_search_repo_srm_items       codacy_tools             → 6 actions
codacy_list_files                  codacy_files             → 4 actions
codacy_get_file_issues             codacy_pull_requests     → 6 actions
codacy_get_file_coverage           codacy_commits           → 3 actions
codacy_get_file_clones             codacy_overview          → 2 actions
codacy_get_file_with_analysis      codacy_quality           → 3 actions
codacy_list_repository_pull_reqs   codacy_cli               → 2 actions
codacy_get_repository_pull_req     ──────────────────────
codacy_list_pull_request_issues    11 tools in system prompt
                                   44 actions available on-demand
codacy_get_pr_files_coverage
codacy_get_pr_git_diff
codacy_get_repository_analysis
codacy_list_tools
codacy_list_repo_tools
codacy_get_pattern
codacy_list_repo_tool_patterns
codacy_get_issue
codacy_setup_repository
codacy_cli_analyze
codacy_cli_install
─────────────────────
24 tools in system prompt
```

### How the LLM Navigates

The model interacts with the 11 namespace tools using an `action` parameter. It works like a **progressive disclosure** pattern:

**Step 1 — Discovery.** The LLM sees 11 high-level tools with concise descriptions. Each tool's schema has an `action` enum listing available actions:

```
codacy_security → actions: [search_org, search_repo, dashboard, sbom_search, ossf_scorecard, ignore]
```

**Step 2 — Selection.** When the user asks "show me security vulnerabilities in my repo", the LLM picks `codacy_security` with `action: "search_repo"`. The remaining 43 action schemas are **never loaded into context**.

**Step 3 — Navigation.** Presenters include HATEOAS-style links in their response, guiding the LLM to the next logical tool:

```
🔗 Next steps: codacy_issues.list (for code quality) · codacy_security.dashboard (for summary)
```

### Context Window Impact

| Metric | Original (flat) | Vurb.ts (grouped) |
|--------|-----------------|--------------------|
| Tools in `tools/list` | **24** | **11** |
| Actions available | 24 | **44 (+83%)** |
| JSON Schema surface (tool definitions) | 29,316 chars across 718 lines | Derived from fluent chain — no hand-written schemas |

Fewer tools in the system prompt means the LLM spends less context budget on tool schemas and more on actual reasoning — a critical advantage for models with limited context windows.

---

## Developer Experience — Side by Side

The same security search tool in both implementations:

<table>
<tr>
<th>❌ Without Vurb.ts — 3 files, ~160 lines</th>
<th>✅ With Vurb.ts — 1 file, 26 lines</th>
</tr>
<tr>
<td>

```typescript
// tools/searchSecurityItemsTool.ts (124 lines)
export const searchRepositorySecurityItemsTool = {
  name: toolNames.CODACY_LIST_REPOSITORY_SRM_ITEMS,
  description: `Tool to list security...
   \n ${rules}
   \n ${generalRepositoryMistakes}`,
  inputSchema: {
    type: 'object',
    properties: {
      ...repositorySchema,
      ...getPaginationWithSorting('...'),
      options: {
        type: 'object',
        properties: {
          priorities: {
            type: 'array',
            items: { type: 'string',
              enum: ['Low','Medium','High','Critical']
            },
          },
          scanTypes: { /* ... 20 more lines */ },
          categories: { /* ... 15 more lines */ },
          statuses: { /* ... 8 more lines */ },
        },
      },
    },
    required: ['provider','organization','repository'],
  },
};

// handlers/security.ts (35 lines)
export const handler = async (args: any) => {
  const { provider, organization, repository,
    cursor, limit, sort, direction, options
  } = args;
  return await SecurityService.searchSecurityItems(
    provider, organization,
    cursor, limit, sort, direction,
    { ...options, repositories: [repository] }
  );
};

// index.ts — manual tool registration
codacy_search_repository_srm_items: {
  tool: Tools.searchRepositorySecurityItemsTool,
  handler: Handlers.searchRepoSecurityItemsHandler,
},
```

</td>
<td>

```typescript
// codacy_security.tool.ts — complete
export const searchRepo = security
  .query('search_repo')
  .describe('Search security findings within a repository.')
  .instructions(`Repo-level security search.
    Uses the organization-level API filtered by repo.
    Scan types: SAST, SCA, Secrets, IaC, CICD.
    DAST and PenTesting are org-level only.`)
  .fromModel(CodacyScopeModel, 'repo')
  .withOptionalEnum('priority', SEVERITY_LEVELS)
  .withOptionalEnum('category', SECURITY_CATEGORIES)
  .withOptionalEnum('scanType', REPO_SCAN_TYPES)
  .withOptionalEnum('status', SECURITY_STATUSES)
  .withOptionalNumber('cursor')
  .withOptionalNumber('limit')
  .egress(1 * 1024 * 1024)
  .returns(SecurityPresenter)
  .handle(async (input, ctx) => {
    const body = { repositories: [input.repository] };
    if (input.priority) body.priorities = [input.priority];
    if (input.category) body.categories = [input.category];
    return ctx.client.post(
      `organizations/${input.provider}/${input.organization}/security/search`,
      body,
      { cursor: input.cursor, limit: input.limit ?? 50 },
    );
  });
```

</td>
</tr>
</table>

**What you don't write with Vurb.ts:**
- ❌ No JSON Schema objects — input types derived from fluent chain
- ❌ No handler wiring — `autoDiscover()` replaces manual registration
- ❌ No OpenAPI codegen — lightweight HTTP client replaces 3,000+ generated lines
- ❌ No `any` types — full type inference from model to presenter

---

## 🔒 What Reaches the LLM — The Security Gap

The original server sends **every API field** directly to the LLM provider via `JSON.stringify`  ([index.ts:172](https://github.com/codacy/codacy-mcp-server/blob/5d72e2171d7df694a2fd9ca258f5950017caa368/index.ts#L172)). No filtering, no size limit, no redaction.

Here is what happens to each field from a **Secrets detection scan**:

| API Field | ❌ Without Vurb.ts | ✅ With Vurb.ts | How |
|-----------|-------------------|----------------|-----|
| `title` | `"Hardcoded AWS Secret Key"` → sent to LLM | `"Hardcoded AWS Secret Key"` → sent to LLM | — |
| `priority` | `"Critical"` → sent to LLM | `🔴 Crit` → semantic badge | Presenter |
| `apiToken` | ⚠️ `"cda_tk_9f8e7d6c5b4a3..."` **→ sent to LLM** | `[REDACTED]` | `redactPII` |
| `internalId` | ⚠️ `948271` **→ sent to LLM** | **Gone** — never serialized | Schema stripping |
| `orgId` | ⚠️ `"org_5f8a2b1d"` **→ sent to LLM** | **Gone** — never serialized | Schema stripping |
| `suggestion.patchUrl` | ⚠️ `"/api/v3/internal/patches/..."` **→ sent to LLM** | **Gone** — never serialized | Schema stripping |
| `_links` | ⚠️ Full internal API surface **→ sent to LLM** | **Gone** — never serialized | Schema stripping |
| **247 findings** | All 247 dumped (1,000+ lines) | Top results only | `agentLimit: 100` |
| **Response size** | Unbounded | Max 1 MB | `.egress(1 * 1024 * 1024)` |
| **Next action** | LLM must guess | `→ codacy_security.ignore` | `suggestActions()` |

---

## Architecture Comparison

<table>
<thead>
<tr>
<th></th>
<th>Original (codacy-mcp-server)</th>
<th>Vurb.ts Edition (codacy-vurb)</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Pattern</strong></td>
<td>Imperative — monolithic handler registry</td>
<td>MVA — Model · View (Presenter) · Agent</td>
</tr>
<tr>
<td><strong>Tool Definition</strong></td>
<td>Manual JSON Schema objects per tool</td>
<td>Fluent builder API (<code>.withString()</code>, <code>.withOptionalEnum()</code>)</td>
</tr>
<tr>
<td><strong>Tool Registration</strong></td>
<td>190-line <code>index.ts</code> mapping tools → handlers</td>
<td><code>autoDiscover()</code> — zero manual imports</td>
</tr>
<tr>
<td><strong>Tool Exposition</strong></td>
<td>Flat — 24 individual tools in <code>tools/list</code></td>
<td>Grouped — 11 namespace routers, 44 actions via <code>action</code> param (54% fewer tools in system prompt)</td>
</tr>
<tr>
<td><strong>API Client</strong></td>
<td>Auto-generated OpenAPI client (~3,000+ lines)</td>
<td>Lightweight typed HTTP client (123 lines)</td>
</tr>
<tr>
<td><strong>Response Format</strong></td>
<td>Raw <code>JSON.stringify(result)</code></td>
<td>Presenters with semantic tables, HATEOAS links, severity badges, and action suggestions</td>
</tr>
<tr>
<td><strong>Auth Handling</strong></td>
<td><code>noAuth</code> boolean flag + inline <code>if</code> check</td>
<td><code>requireAuth</code> middleware with self-healing error messages</td>
</tr>
<tr>
<td><strong>Security</strong></td>
<td>No DLP or output sanitization</td>
<td>DLP-ready: <code>SecurityPresenter</code> redacts secrets before wire</td>
</tr>
<tr>
<td><strong>Prompts</strong></td>
<td>Not supported</td>
<td>3 MCP prompts — <code>code-review</code>, <code>security-audit</code>, <code>repo-health</code></td>
</tr>
<tr>
<td><strong>Cache / State Sync</strong></td>
<td>Not supported</td>
<td>Declarative invalidation policies (mutations auto-refresh queries)</td>
</tr>
<tr>
<td><strong>Egress Control</strong></td>
<td>Not supported</td>
<td>Per-action egress limits (e.g., 1 MB for issue lists, 2 MB for patches)</td>
</tr>
<tr>
<td><strong>LLM Instructions</strong></td>
<td>Embedded in tool <code>description</code> field</td>
<td>Separate <code>.instructions()</code> with common mistakes, redirection rules, and guardrails</td>
</tr>
<tr>
<td><strong>Mutation Safety</strong></td>
<td>No markers</td>
<td><code>.idempotent()</code> marker + <code>.invalidates()</code> cache busting</td>
</tr>
<tr>
<td><strong>Tests</strong></td>
<td>No test suite</td>
<td>105 tests (prompts, presenters, structural invariants)</td>
</tr>
<tr>
<td><strong>Dependencies</strong></td>
<td>11 (including codegen, node-fetch, ESLint, Prettier, Husky)</td>
<td>4 (<code>@vurb/core</code>, <code>@modelcontextprotocol/sdk</code>, <code>fast-redact</code>, <code>zod</code>)</td>
</tr>
</tbody>
</table>

---

## Metrics (verified)

Every number below was measured directly from the source code.

| Metric | Original | Vurb.ts | Diff |
|--------|----------|---------|------|
| Source files (hand-written) | 45 | 42 | −3 |
| Tool definitions (`src/tools/`) | 718 lines | — | — |
| Handlers (`src/handlers/`) | 424 lines | — | — |
| Agents (`src/agents/` — tool + handler in one file) | — | 763 lines | **−33% vs tools+handlers** |
| Tools in `tools/list` response | 24 | 11 | **−54%** |
| Actions available to the LLM | 24 | 44 | **+83%** |
| MCP Prompts | 0 | 3 | +3 |
| Test cases | 0 | 105 | +105 |
| Runtime dependencies | 6 | 4 | **−33%** |
| Dev dependencies | 9 | 3 | **−67%** |

---

## Tool Actions (44)

### codacy_organizations (2)
| Action | Description |
|--------|-------------|
| `list` | List organizations the authenticated user belongs to |
| `list_repos` | List repositories in an organization |

### codacy_repositories (3)
| Action | Description |
|--------|-------------|
| `get` | Get repository details with analysis metrics |
| `list_branches` | List branches of a repository |
| `setup` | Add or follow a repository (multi-step orchestration) |

### codacy_issues (7)
| Action | Description |
|--------|-------------|
| `list` | Search and filter code quality issues |
| `get` | Get detailed issue information |
| `file_issues` | Get issues for a specific file |
| `pr_issues` | Get issues in a pull request |
| `quickfix_patch` | Download auto-fix patches |
| `ignore` | Mark an issue as ignored |
| `bulk_ignore` | Batch ignore multiple issues |

### codacy_security (6)
| Action | Description |
|--------|-------------|
| `search_org` | Search org-level security findings |
| `search_repo` | Search repo-specific security findings |
| `dashboard` | Get security dashboard summary |
| `sbom_search` | Search SBOM dependencies |
| `ossf_scorecard` | Get OSSF Scorecard for a package/repo |
| `ignore` | Ignore a security finding |

### codacy_tools (6)
| Action | Description |
|--------|-------------|
| `list` | List all analysis tools available |
| `repo_tools` | List tools configured for a repository |
| `get_pattern` | Get a specific code pattern definition |
| `repo_patterns` | List patterns for a tool in a repository |
| `configure` | Enable/disable a tool for a repository |
| `update_patterns` | Enable/disable specific patterns |

### codacy_files (4)
| Action | Description |
|--------|-------------|
| `list` | List files with analysis metrics |
| `get` | Get file details with metrics |
| `coverage` | Get line-by-line coverage |
| `clones` | Get code duplication blocks |

### codacy_pull_requests (6)
| Action | Description |
|--------|-------------|
| `list` | List PRs with analysis status |
| `get` | Get PR details with quality results |
| `coverage` | Get file-level PR coverage |
| `diff` | Get the Git diff |
| `trigger_ai_review` | Trigger AI-powered code review |
| `bypass` | Bypass the quality gate |

### codacy_commits (3)
| Action | Description |
|--------|-------------|
| `list` | List commits with analysis status |
| `get` | Get commit details with delta statistics |
| `issues` | Get issues introduced by a commit |

### codacy_overview (2)
| Action | Description |
|--------|-------------|
| `issues` | Aggregated issue overview with charts |
| `categories` | Issue count breakdown by category |

### codacy_quality (3)
| Action | Description |
|--------|-------------|
| `get_settings` | Get quality gate thresholds for a repository |
| `list_policies` | List gate policies for an organization |
| `get_policy` | Get details of a specific gate policy |

### codacy_cli (2)
| Action | Description |
|--------|-------------|
| `analyze` | Run local analysis via CLI |
| `install` | Install the CLI |

---

## Setup

### Requirements

- **Node.js** ≥ 18
- A [Codacy Account API Token](https://app.codacy.com/account/access-management)

### Configuration

Add to your MCP client configuration (Cursor, VS Code, Claude Desktop, etc.):

```json
{
  "mcpServers": {
    "codacy": {
      "command": "node",
      "args": ["dist/server.js"],
      "env": {
        "CODACY_ACCOUNT_TOKEN": "<YOUR_TOKEN>"
      }
    }
  }
}
```

### Development

```bash
npm install
npm run build      # Compile TypeScript
npm run dev        # Vurb dev server (hot-reload)
npm test           # Run 105 tests
npm run inspect    # MCP Inspector
```

---

## Project Structure

```
src/
├── agents/              # Tool definitions (Fluent API)
│   ├── codacy_organizations.tool.ts
│   ├── codacy_repositories.tool.ts
│   ├── codacy_issues.tool.ts
│   ├── codacy_security.tool.ts
│   ├── codacy_tools.tool.ts
│   ├── codacy_files.tool.ts
│   ├── codacy_pull_requests.tool.ts
│   ├── codacy_commits.tool.ts
│   ├── codacy_overview.tool.ts
│   ├── codacy_quality.tool.ts
│   └── codacy_cli.tool.ts
├── models/              # Zod schemas (data contracts)
├── views/               # Presenters (LLM-optimized output)
├── middleware/           # Auth, validation
├── prompts/             # MCP prompt templates
├── utils/               # Constants, rules, types
├── context.ts           # API client + context factory
├── index.ts             # Registry
└── server.ts            # Entry point
```

---

## Usage (MCP stdio)

This server runs as a **stdio** MCP transport — the AI client launches it as a subprocess and communicates via stdin/stdout.

### Cursor / Windsurf / Claude Desktop

Add to your MCP configuration file:

- **Cursor:** `.cursor/mcp.json`
- **Windsurf:** `.codeium/windsurf/mcp_config.json`
- **Claude Desktop:** `claude_desktop_config.json`

```json
{
  "mcpServers": {
    "codacy": {
      "command": "node",
      "args": ["/absolute/path/to/codacy-vurb/dist/server.js"],
      "env": {
        "CODACY_ACCOUNT_TOKEN": "<YOUR_TOKEN>"
      }
    }
  }
}
```

### VS Code (Copilot)

Add to your `settings.json` (`Ctrl+Shift+P` → _Preferences: Open User Settings (JSON)_):

```json
{
  "mcp": {
    "servers": {
      "codacy": {
        "command": "node",
        "args": ["/absolute/path/to/codacy-vurb/dist/server.js"],
        "env": {
          "CODACY_ACCOUNT_TOKEN": "<YOUR_TOKEN>"
        }
      }
    }
  }
}
```

### Get your token

1. Go to [Codacy Account → Access Management](https://app.codacy.com/account/access-management)
2. Generate an **Account API Token**
3. Paste it in the `CODACY_ACCOUNT_TOKEN` field above

### Build & run

```bash
npm install
npm run build
# The server starts automatically when the MCP client launches it via stdio
```

---

## License

Apache 2.0 — see [LICENSE](LICENSE).
