/**
 * codacy_files — Repository file analysis (4 queries)
 */

import { f } from '../index.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { CodacyScopeModel } from '../models/CodacyScopeModel.js';
import { FilePresenter } from '../views/file.presenter.js';

const files = f.router('codacy_files')
  .describe('Repository file analysis — list files, view metrics, coverage, and duplication.')
  .use(requireAuth);

export const listFiles = files.query('list')
  .describe('List files in a repository with analysis metrics.')
  .instructions(`Lists files with five metrics: Grade, Issues, Duplication, Complexity, Coverage.
Common mistakes: (1) If a file has isIgnored=true, Codacy does NOT analyze it — metrics will be empty. (2) Use the fileId from results for file-specific queries (codacy_files.get, codacy_issues.file_issues, codacy_files.clones).
Tool redirection: For file-level issues, use codacy_issues.file_issues with the fileId. For file coverage, use codacy_files.coverage.`)
  .fromModel(CodacyScopeModel, 'repo')
  .withOptionalString('search', 'Search files by path')
  .withOptionalNumber('cursor', 'Pagination cursor')
  .withOptionalNumber('limit', 'Results per page (max 100)')
  .egress(512 * 1024)
  .returns(FilePresenter)
  .handle(async (input, ctx) => {
    return ctx.client.get(
      `analysis/organizations/${input.provider}/${input.organization}/repositories/${input.repository}/files`,
      { search: input.search, cursor: input.cursor, limit: input.limit ?? 50 },
    );
  });

export const getFile = files.query('get')
  .describe('Get file details with analysis metrics (grade, issues, complexity, coverage, duplication).')
  .instructions(`Requires a valid fileId — get it from codacy_files.list.
Common mistake: using the file PATH instead of the fileId. Paths like 'src/index.ts' are NOT valid fileId values.`)
  .fromModel(CodacyScopeModel, 'repo')
  .withString('fileId', 'File identifier')
  .returns(FilePresenter)
  .proxy('analysis/organizations/:provider/:organization/repositories/:repository/files/:fileId');

export const fileCoverage = files.query('coverage')
  .describe('Get line-by-line code coverage for a file.')
  .instructions(`Returns line-by-line coverage data (covered, uncovered, partial). Requires a valid fileId.
Coverage must be uploaded to Codacy first — if no coverage data exists, consider suggesting the user configure coverage reporting.`)
  .fromModel(CodacyScopeModel, 'repo')
  .withString('fileId', 'File identifier')
  .proxy('analysis/organizations/:provider/:organization/repositories/:repository/files/:fileId/coverage');

export const fileClones = files.query('clones')
  .describe('Get duplication blocks (clones) detected in a file.')
  .instructions(`Returns code clone blocks — duplicated code segments. Requires a valid fileId.
Common mistake: looking at individual files when codebase-wide duplication analysis is needed — for that, check file duplication metrics via codacy_files.list.`)
  .fromModel(CodacyScopeModel, 'repo')
  .withString('fileId', 'File identifier')
  .proxy('analysis/organizations/:provider/:organization/repositories/:repository/files/:fileId/clones');
