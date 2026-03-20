import { definePresenter, ui } from '@vurb/core';
import { PullRequestModel } from '../models/PullRequestModel.js';
import { PULL_REQUEST_RULES } from '../utils/rules.js';
import type { SuggestAction } from '../utils/types.js';

export const PullRequestPresenter = definePresenter({
  name: 'PullRequest',
  schema: PullRequestModel.schema,
  rules: [...PULL_REQUEST_RULES],
  agentLimit: { max: 50, onTruncate: (n) => ui.summary(`⚠️ ${n} pull requests omitted. Filter by status to narrow results.`) },
  collectionUi: (items) => [
    ui.summary(`🔀 ${items.length} pull request${items.length !== 1 ? 's' : ''} returned.`),
  ],
  suggestActions: (pr) => {
    const actions: SuggestAction[] = [];
    if (pr.isUpToStandards === false) {
      actions.push(
        { tool: 'codacy_pull_requests', reason: 'See what issues are failing the quality gate', args: { action: 'coverage', pullRequestNumber: pr.number } },
        { tool: 'codacy_issues', reason: 'View new issues introduced by this PR', args: { action: 'pr_issues', pullRequestNumber: pr.number } },
      );
    }
    if (pr.isAnalysed) {
      actions.push(
        { tool: 'codacy_pull_requests', reason: 'Trigger AI-powered code review', args: { action: 'trigger_ai_review', pullRequestNumber: pr.number } },
      );
    }
    return actions;
  },
});
