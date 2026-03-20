/**
 * codacy_cli — Local CLI analysis (2 actions, noAuth)
 */

import { f } from '../index.js';
import { execSync, execFileSync } from 'node:child_process';

const cli = f.router('codacy_cli')
  .describe('Local Codacy CLI — run code analysis locally without sending code to the cloud. No API token required.');

export const cliAnalyze = cli.action('analyze')
  .describe('Run local code analysis using the Codacy CLI. Requires the CLI to be installed.')
  .instructions(`Runs analysis LOCALLY — does NOT require authentication or send code to the cloud. Results are in SARIF format.
Common mistakes: (1) If CLI is not installed, suggest codacy_cli.install first. (2) Provide an ABSOLUTE path for directory — relative paths may fail. (3) On Windows, the CLI requires WSL.
Tool redirection: For cloud-based analysis results, use codacy_issues.list instead.`)
  .withString('directory', 'Absolute path to the project directory to analyze')
  .withOptionalString('tool', 'Specific tool to run (e.g., eslint, pylint). Omit for all tools.')
  .withOptionalString('file', 'Specific file to analyze. Omit for full project.')
  .handle(async (input, _ctx) => {
    const cliPath = process.platform === 'win32'
      ? 'codacy-analysis-cli.bat'
      : 'codacy-analysis-cli';

    try {
      const args = ['analyze', '--directory', input.directory, '--format', 'sarif'];
      if (input.tool) args.push('--tool', input.tool);
      if (input.file) args.push('--file', input.file);

      const result = execFileSync(cliPath, args, {
        timeout: 300_000,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      });

      return { output: result, format: 'sarif' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return f.error('CLI_ERROR', `CLI analysis failed: ${message}`)
        .suggest('Ensure the Codacy CLI is installed. Use the install action to set it up.')
        .actions('codacy_cli');
    }
  });

export const cliInstall = cli.action('install')
  .describe('Install the Codacy CLI for local analysis.')
  .instructions(`Downloads and installs the Codacy CLI. On macOS/Linux uses curl. On Windows requires WSL — the CLI does NOT run natively on Windows.
Common mistake: running install without network access — requires internet connectivity to download the binary.`)
  .handle(async (_input, _ctx) => {
    try {
      if (process.platform === 'win32') {
        return {
          message: 'Codacy CLI requires WSL on Windows. Run the following in WSL:',
          command: 'curl -Ls https://raw.githubusercontent.com/codacy/codacy-analysis-cli/master/bin/codacy-analysis-cli.sh | bash',
        };
      }

      execSync('curl -Ls https://raw.githubusercontent.com/codacy/codacy-analysis-cli/master/bin/codacy-analysis-cli.sh | bash', {
        timeout: 120_000,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      return { message: 'Codacy CLI installed successfully.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return f.error('INSTALL_ERROR', `CLI installation failed: ${message}`)
        .suggest('Check network connectivity and try again.')
        .critical();
    }
  });
