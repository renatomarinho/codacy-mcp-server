/**
 * codacy_overview — Aggregated visualizations (2 queries)
 * The Vurb.ts ui.echarts() and ui.mermaid() showcase.
 */

import { f } from '../index.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { CodacyScopeModel } from '../models/CodacyScopeModel.js';
import { IssueOverviewPresenter } from '../views/issue-overview.presenter.js';

const overview = f.router('codacy_overview')
  .describe('Aggregated repository health visualizations — issue statistics with server-rendered charts and category breakdowns.')
  .use(requireAuth);

export const issuesOverviewChart = overview.query('issues')
  .describe('Get aggregated issue overview with server-rendered pie charts by category and severity.')
  .instructions(`Returns server-rendered ECharts pie charts. Do NOT try to recalculate or re-render — present them as-is.
Use the breakdown to identify highest-impact areas, then drill down with codacy_issues.list using appropriate filters.`)
  .fromModel(CodacyScopeModel, 'repo')
  .withOptionalString('branchName', 'Branch name')
  .returns(IssueOverviewPresenter)
  .handle(async (input, ctx) => {
    const body: Record<string, unknown> = {};
    if (input.branchName) body.branchName = input.branchName;
    return ctx.client.post(
      `analysis/organizations/${input.provider}/${input.organization}/repositories/${input.repository}/issues/overview`,
      body,
    );
  });

export const categoriesOverview = overview.query('categories')
  .describe('Get issue count breakdown by quality category (Security, Performance, CodeStyle, etc.).')
  .instructions(`Returns category-level counts — use these to identify which category has the most issues, then drill down with codacy_issues.list filtering by that category.`)
  .fromModel(CodacyScopeModel, 'repo')
  .proxy('analysis/organizations/:provider/:organization/repositories/:repository/category-overviews');
