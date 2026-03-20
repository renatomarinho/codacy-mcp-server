import { defineModel } from '@vurb/core';
import { PROVIDERS } from '../utils/constants.js';

export const OrganizationModel = defineModel('Organization', m => {
  m.casts({
    name:       m.string('Organization name'),
    provider:   m.enum('Provider', [...PROVIDERS]),
    identifier: m.string('Remote organization identifier'),
    joinStatus: m.string('Membership status'),
    type:       m.string('Organization type'),
  });
  m.fillable({
    search: ['provider'],
  });
});
