import * as tc from '@actions/tool-cache';
import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import { PlatformInfo } from './platform';
import { SAME_REPO } from './config';

export interface InstallResult {
  cachedPath: string;
  cacheHit: boolean;
}

async function downloadWithRetry(url: string, authHeader: string, maxRetries = 3): Promise<string> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      core.info(`Download attempt ${attempt}/${maxRetries}`);
      return await tc.downloadTool(url, '', authHeader);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        core.warning(`Download failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Download failed after all retries');
}

export async function installSame(
  version: string,
  platformInfo: PlatformInfo,
  githubToken?: string
): Promise<InstallResult> {
  const { os, arch } = platformInfo;

  const cacheArch = `${os}_${arch}`;
  const cachedPath = tc.find('same', version, cacheArch);
  if (cachedPath) {
    core.info(`Found cached same ${version} for ${os}/${arch}`);
    core.addPath(cachedPath);
    return { cachedPath, cacheHit: true };
  }

  core.info(`Downloading same ${version} for ${os}/${arch} from GitHub releases`);

  const downloadUrl = `https://github.com/${SAME_REPO}/releases/download/v${version}/same_${version}_${os}_${arch}.tar.gz`;

  const authHeader = githubToken ? `token ${githubToken}` : '';
  const downloadPath = await downloadWithRetry(downloadUrl, authHeader);
  core.info(`Downloaded to ${downloadPath}`);

  const stats = fs.statSync(downloadPath);
  if (stats.size === 0) {
    throw new Error('Downloaded file is empty');
  }
  core.info(`Downloaded file size: ${stats.size} bytes`);

  const extractPath = await tc.extractTar(downloadPath);
  core.info(`Extracted to ${extractPath}`);

  const toolPath = await tc.cacheDir(extractPath, 'same', version, cacheArch);
  core.info(`Cached to ${toolPath}`);

  const binaryName = process.platform === 'win32' ? 'same.exe' : 'same';
  const binaryPath = path.join(toolPath, binaryName);

  if (!fs.existsSync(binaryPath)) {
    throw new Error(`Binary not found at ${binaryPath} after extraction`);
  }

  if (process.platform !== 'win32') {
    fs.chmodSync(binaryPath, 0o755);
    core.info('Set binary as executable');
  }

  core.addPath(toolPath);

  return { cachedPath: toolPath, cacheHit: false };
}
