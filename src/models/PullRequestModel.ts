import { defineModel } from '@vurb/core';

export const PullRequestModel = defineModel('PullRequest', m => {
  m.casts({
    number:           m.number('Pull request number'),
    title:            m.string('Pull request title'),
    status:           m.string('PR status (open, closed, merged)'),
    isAnalysed:       m.boolean('Whether Codacy analysis is complete'),
    isUpToStandards:  m.boolean('CRITICAL: true = PR passes all quality gates. false = PR has quality issues that should be reviewed.'),
    author:           m.string('PR author username'),
    headCommitSha:    m.string('HEAD commit SHA'),
    targetBranch:     m.string('Base branch'),
    sourceBranch:     m.string('Head branch'),
    newIssues:        m.number('Number of new issues introduced'),
    fixedIssues:      m.number('Number of issues fixed'),
    deltaCoverage:    m.number('Coverage diff percentage (can be negative)'),
    diffCoverage:     m.number('Coverage of new/changed lines only'),
  });
});
