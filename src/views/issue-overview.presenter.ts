import { definePresenter, ui } from '@vurb/core';
import { IssueOverviewModel } from '../models/IssueOverviewModel.js';
import { ISSUE_OVERVIEW_RULES } from '../utils/rules.js';
import type { SuggestAction } from '../utils/types.js';

export const IssueOverviewPresenter = definePresenter({
  name: 'IssueOverview',
  schema: IssueOverviewModel.schema,
  rules: [...ISSUE_OVERVIEW_RULES],
  ui: (data) => [
    ui.echarts({
      title: { text: 'Issues by Category' },
      series: [{
        type: 'pie',
        radius: '60%',
        data: (data.categories ?? []).map((c: { name: string; count: number }) => ({
          name: c.name,
          value: c.count,
        })),
      }],
    }),
    ui.echarts({
      title: { text: 'Issues by Severity' },
      series: [{
        type: 'pie',
        radius: '60%',
        data: (data.levels ?? []).map((l: { name: string; count: number }) => ({
          name: l.name,
          value: l.count,
        })),
      }],
    }),
    ui.summary(`Total issues: ${data.totalCount}`),
  ],
  suggestActions: (overview) => {
    const actions: SuggestAction[] = [];
    if (overview.totalCount > 0) {
      // Suggest drilling into the highest-count category
      const topCategory = (overview.categories ?? []).sort(
        (a: { count: number }, b: { count: number }) => b.count - a.count,
      )[0];
      if (topCategory) {
        actions.push({
          tool: 'codacy_issues',
          reason: `Drill into the largest category: ${topCategory.name} (${topCategory.count} issues)`,
          args: { action: 'list', category: topCategory.name },
        });
      }
      // Suggest viewing Error severity issues if any
      const errorLevel = (overview.levels ?? []).find(
        (l: { name: string }) => l.name === 'Error',
      );
      if (errorLevel && errorLevel.count > 0) {
        actions.push({
          tool: 'codacy_issues',
          reason: `${errorLevel.count} Error-severity issues need attention`,
          args: { action: 'list', level: 'Error' },
        });
      }
    }
    return actions;
  },
});
