import { definePresenter, ui } from '@vurb/core';
import { CommitModel } from '../models/CommitModel.js';
import { COMMIT_RULES } from '../utils/rules.js';
import type { SuggestAction } from '../utils/types.js';

export const CommitPresenter = definePresenter({
  name: 'Commit',
  schema: CommitModel.schema,
  rules: [...COMMIT_RULES],
  agentLimit: { max: 50, onTruncate: (n) => ui.summary(`⚠️ ${n} commits omitted. Use date filters or pagination to navigate commit history.`) },
  collectionUi: (items) => [
    ui.summary(`🔨 ${items.length} commit${items.length !== 1 ? 's' : ''} returned.`),
  ],
  suggestActions: (commit) => {
    const actions: SuggestAction[] = [];
    if (commit.newIssues > 0) {
      actions.push({
        tool: 'codacy_commits',
        reason: `${commit.newIssues} new issues introduced by this commit`,
        args: { action: 'issues', commitSha: commit.sha },
      });
    }
    return actions;
  },
});
