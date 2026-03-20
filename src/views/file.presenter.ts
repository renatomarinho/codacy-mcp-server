import { definePresenter, ui } from '@vurb/core';
import { FileModel } from '../models/FileModel.js';
import { FILE_RULES } from '../utils/rules.js';
import type { SuggestAction } from '../utils/types.js';

export const FilePresenter = definePresenter({
  name: 'File',
  schema: FileModel.schema,
  rules: [...FILE_RULES],
  agentLimit: { max: 200, onTruncate: (n) => ui.summary(`⚠️ ${n} files omitted. Use language or path filters to narrow results.`) },
  collectionUi: (items) => [
    ui.summary(`📁 ${items.length} file${items.length !== 1 ? 's' : ''} returned.`),
  ],
  suggestActions: (file) => {
    const actions: SuggestAction[] = [];
    if (file.totalIssues > 0) {
      actions.push({ tool: 'codacy_issues', reason: `This file has ${file.totalIssues} issues`, args: { action: 'file_issues', fileId: file.fileId } });
    }
    if (file.duplication > 10) {
      actions.push({ tool: 'codacy_files', reason: `${file.duplication}% duplication — view clone blocks`, args: { action: 'clones', fileId: file.fileId } });
    }
    return actions;
  },
});
