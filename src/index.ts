import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { getPlatformInfo } from './platform';
import { resolveVersion } from './version';
import { installSame } from './install';

async function run(): Promise<void> {
  try {
    const versionInput = core.getInput('version') || 'latest';
    const githubToken = core.getInput('github-token') || process.env.GITHUB_TOKEN || '';

    const platformInfo = getPlatformInfo();
    core.info(`Platform: ${platformInfo.os}/${platformInfo.arch}`);

    const version = await resolveVersion(versionInput, githubToken);
    core.info(`Resolved version: ${version}`);

    const { cachedPath, cacheHit } = await installSame(version, platformInfo);
    core.info(`Installation completed at ${cachedPath}`);

    try {
      await exec.exec('same', ['--version']);
      core.info('Successfully verified same installation');
    } catch (error) {
      core.warning(`Failed to verify same installation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    core.setOutput('version', version);
    core.setOutput('cache-hit', cacheHit.toString());

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
