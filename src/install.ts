import * as tc from '@actions/tool-cache';
import * as core from '@actions/core';
import { PlatformInfo } from './platform';

export interface InstallResult {
  cachedPath: string;
  cacheHit: boolean;
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

  core.info(`Downloading same ${version} for ${os}/${arch}`);

  const downloadUrl = `https://github.com/traiproject/same/releases/download/v${version}/same_${version}_${os}_${arch}.tar.gz`;
  core.info(`Download URL: ${downloadUrl}`);

  const authHeader = githubToken ? `token ${githubToken}` : '';
  const downloadPath = await tc.downloadTool(downloadUrl, '', authHeader);
  core.info(`Downloaded to ${downloadPath}`);

  const extractPath = await tc.extractTar(downloadPath);
  core.info(`Extracted to ${extractPath}`);

  const toolPath = await tc.cacheDir(extractPath, 'same', version, cacheArch);
  core.info(`Cached to ${toolPath}`);

  core.addPath(toolPath);

  return { cachedPath: toolPath, cacheHit: false };
}
