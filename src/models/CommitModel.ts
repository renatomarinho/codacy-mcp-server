import { defineModel } from '@vurb/core';

export const CommitModel = defineModel('Commit', m => {
  m.casts({
    sha:            m.string('Commit SHA hash'),
    authorName:     m.string('Commit author name'),
    authorEmail:    m.string('Commit author email'),
    message:        m.string('Commit message'),
    timestamp:      m.timestamp('Commit timestamp'),
    analysisStatus: m.enum('AnalysisStatus', ['Analysed', 'InProgress', 'NotAnalysed', 'Failed']),
    newIssues:      m.number('New issues introduced by this commit'),
    fixedIssues:    m.number('Issues fixed by this commit'),
    deltaCoverage:  m.number('Coverage change from this commit'),
    grade:          m.string('Codacy grade after this commit'),
  });
});
