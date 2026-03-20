import { defineModel } from '@vurb/core';

export const SbomDependencyModel = defineModel('SbomDependency', m => {
  m.casts({
    name:              m.string('Dependency name'),
    version:           m.string('Dependency version'),
    purl:              m.string('Package URL (purl) identifier'),
    license:           m.string('License type (e.g., MIT, Apache-2.0, GPL-3.0)'),
    riskCategory:      m.enum('Risk', ['Forbidden', 'Risky', 'Normal']),
    findingSeverity:   m.enum('Severity', ['Critical', 'High', 'Medium', 'Low', 'Info']),
    vulnerabilities:   m.number('Number of known vulnerabilities'),
    repositories:      m.list('Found In', { name: m.string() }),
  });
});
