import { defineModel } from '@vurb/core';
import { PROVIDERS } from '../utils/constants.js';

export const RepositoryModel = defineModel('Repository', m => {
  m.casts({
    name:              m.string('Repository name'),
    fullPath:          m.string('Full repository path (org/repo)'),
    owner:             m.string('Repository owner'),
    provider:          m.enum('Provider', [...PROVIDERS]),
    addedState:        m.string('Codacy tracking state'),
    defaultBranch:     m.string('Default branch name'),
    lastAnalysedCommit:m.string('SHA of last analysed commit'),
    grade:             m.string('Codacy grade (A through F). CRITICAL: A is best, F is worst.'),
    totalIssues:       m.number('Total open issues'),
    complexity:        m.number('Average cyclomatic complexity'),
    coverage:          m.number('Code coverage percentage (0-100)'),
    duplication:       m.number('Duplication percentage (0-100)'),
    languages:         m.list('Languages', { name: m.string(), percentage: m.number() }),
  });
  m.hidden(['internalId']);
});
