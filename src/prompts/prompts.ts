/**
 * Server-side Prompts — pre-composed workflows for common agent tasks.
 *
 * Uses Internal Loopback Dispatch (ctx.invokeTool) to aggregate
 * data from multiple tools into a single prompt context.
 */

import { f } from '../index.js';
import { PromptMessage } from '@vurb/core';

// ─── Code Review Prompt ──────────────────────────────────────────────────────

export const codeReviewPrompt = f.prompt('code_review')
  .describe('Comprehensive code review for a pull request — issues, coverage, diff, and quickfix availability.')
  .input({
    provider:          { type: 'string', description: 'Git provider: gh (GitHub) or bb (Bitbucket)' },
    organization:      { type: 'string', description: 'Organization or username (e.g., "my-org")' },
    repository:        { type: 'string', description: 'Repository name (e.g., "my-api")' },
    pullRequestNumber: { type: 'string', description: 'Pull request number (e.g., "42")' },
  })
  .handler(async (ctx, args) => {
    const [prResult, issuesResult, coverageResult] = await Promise.all([
      ctx.invokeTool('codacy_pull_requests', {
        action: 'get', provider: args.provider, organization: args.organization,
        repository: args.repository, pullRequestNumber: Number(args.pullRequestNumber),
      }),
      ctx.invokeTool('codacy_issues', {
        action: 'pr_issues', provider: args.provider, organization: args.organization,
        repository: args.repository, pullRequestNumber: Number(args.pullRequestNumber),
      }),
      ctx.invokeTool('codacy_pull_requests', {
        action: 'coverage', provider: args.provider, organization: args.organization,
        repository: args.repository, pullRequestNumber: Number(args.pullRequestNumber),
      }),
    ]);

    return {
      messages: [
        PromptMessage.system(
          `You are reviewing Pull Request #${args.pullRequestNumber} in ${args.organization}/${args.repository}.\n` +
          'Analyze the quality issues, coverage changes, and provide actionable feedback.\n' +
          'Focus on new issues introduced by this PR.'
        ),
        PromptMessage.user(`### Pull Request Details\n${prResult.text}`),
        PromptMessage.user(`### Issues Found\n${issuesResult.text}`),
        PromptMessage.user(`### Coverage Data\n${coverageResult.text}`),
      ],
    };
  });

// ─── Security Audit Prompt ───────────────────────────────────────────────────

export const securityAuditPrompt = f.prompt('security_audit')
  .describe('Security audit for a repository — SRM findings, dashboard, and risk assessment.')
  .input({
    provider:     { type: 'string', description: 'Git provider: gh (GitHub) or bb (Bitbucket)' },
    organization: { type: 'string', description: 'Organization or username (e.g., "my-org")' },
    repository:   { type: 'string', description: 'Repository name (e.g., "my-api")' },
  })
  .handler(async (ctx, args) => {
    const [srmResult, dashResult] = await Promise.all([
      ctx.invokeTool('codacy_security', { action: 'search_repo', provider: args.provider, organization: args.organization, repository: args.repository }),
      ctx.invokeTool('codacy_security', { action: 'dashboard', provider: args.provider, organization: args.organization, repository: args.repository }),
    ]);

    return {
      messages: [
        PromptMessage.system(
          `You are performing a security audit on the repository ${args.repository}.\n` +
          'Analyze SRM findings, prioritize by severity, and provide remediation guidance.\n' +
          'Focus on Critical and High priority items.'
        ),
        PromptMessage.user(`### Security Findings\n${srmResult.text}`),
        PromptMessage.user(`### Security Dashboard\n${dashResult.text}`),
      ],
    };
  });

// ─── Repo Health Prompt ──────────────────────────────────────────────────────

export const repoHealthPrompt = f.prompt('repo_health')
  .describe('Repository health assessment — analysis grade, issues overview, category breakdown, and quality settings.')
  .input({
    provider:     { type: 'string', description: 'Git provider: gh (GitHub) or bb (Bitbucket)' },
    organization: { type: 'string', description: 'Organization or username (e.g., "my-org")' },
    repository:   { type: 'string', description: 'Repository name (e.g., "my-api")' },
  })
  .handler(async (ctx, args) => {
    const [repoResult, overviewResult] = await Promise.all([
      ctx.invokeTool('codacy_repositories', { action: 'get', provider: args.provider, organization: args.organization, repository: args.repository }),
      ctx.invokeTool('codacy_overview', { action: 'issues', provider: args.provider, organization: args.organization, repository: args.repository }),
    ]);

    return {
      messages: [
        PromptMessage.system(
          `You are assessing the health of repository ${args.repository}.\n` +
          'Analyze the quality grade, issue distribution, and coverage metrics.\n' +
          'Provide recommendations for improving the overall code quality score.'
        ),
        PromptMessage.user(`### Repository Analysis\n${repoResult.text}`),
        PromptMessage.user(`### Issues Overview\n${overviewResult.text}`),
      ],
    };
  });
