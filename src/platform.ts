export interface PlatformInfo {
  os: 'linux' | 'macOS';
  arch: 'x86_64' | 'arm64';
}

export function getPlatformInfo(): PlatformInfo {
  let os: 'linux' | 'macOS';

  switch (process.platform) {
    case 'linux':
      os = 'linux';
      break;
    case 'darwin':
      os = 'macOS';
      break;
    case 'win32':
      throw new Error('Windows is not supported');
    default:
      throw new Error(`Unsupported OS: ${process.platform}`);
  }

  let arch: 'x86_64' | 'arm64';

  switch (process.arch) {
    case 'x64':
      arch = 'x86_64';
      break;
    case 'arm64':
      arch = 'arm64';
      break;
    default:
      throw new Error(`Unsupported architecture: ${process.arch}`);
  }

  return { os, arch };
}
