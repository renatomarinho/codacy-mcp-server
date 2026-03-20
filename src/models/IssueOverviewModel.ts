import { defineModel } from '@vurb/core';

export const IssueOverviewModel = defineModel('IssueOverview', m => {
  m.casts({
    totalCount:      m.number('Total number of issues'),
    categories:      m.list('Category Breakdown', {
      name:  m.string('Category name'),
      count: m.number('Number of issues in this category'),
    }),
    levels:          m.list('Severity Breakdown', {
      name:  m.string('Severity level'),
      count: m.number('Number of issues at this severity'),
    }),
    languages:       m.list('Language Breakdown', {
      name:  m.string('Language name'),
      count: m.number('Number of issues in this language'),
    }),
  });
});
