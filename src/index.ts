import * as core from '@actions/core';

async function run(): Promise<void> {
  try {
    core.info('Hello World');

    const version = core.getInput('version') || 'latest';
    const githubToken = core.getInput('github-token') || process.env.GITHUB_TOKEN || '';

    core.info(`Version requested: ${version}`);
    core.info(`GitHub token provided: ${githubToken ? 'yes' : 'no'}`);

    // Placeholder outputs
    core.setOutput('version', version);
    core.setOutput('cache-hit', 'false');

    core.info('setup-same action completed successfully');
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

run();
