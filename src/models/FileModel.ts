import { defineModel } from '@vurb/core';

export const FileModel = defineModel('File', m => {
  m.casts({
    fileId:      m.string('File identifier'),
    filePath:    m.string('Full file path in repository'),
    language:    m.string('Programming language'),
    grade:       m.string('Codacy grade (A through F)'),
    totalIssues: m.number('Total issues in this file'),
    complexity:  m.number('Cyclomatic complexity'),
    coverage:    m.number('Code coverage percentage (0-100)'),
    duplication: m.number('Duplication percentage (0-100)'),
    lineCount:   m.number('Total lines of code'),
    isIgnored:   m.boolean('Whether Codacy ignores this file from analysis'),
  });
});
