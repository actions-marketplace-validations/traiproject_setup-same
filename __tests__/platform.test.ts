import { getPlatformInfo } from '../src/platform';

describe('getPlatformInfo', () => {
  const originalPlatform = process.platform;
  const originalArch = process.arch;

  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      configurable: true,
    });
    Object.defineProperty(process, 'arch', {
      value: originalArch,
      configurable: true,
    });
  });

  it('should return linux and x86_64 for Linux x64', () => {
    Object.defineProperty(process, 'platform', {
      value: 'linux',
      configurable: true,
    });
    Object.defineProperty(process, 'arch', {
      value: 'x64',
      configurable: true,
    });

    expect(getPlatformInfo()).toEqual({
      os: 'linux',
      arch: 'x86_64',
    });
  });

  it('should return linux and arm64 for Linux ARM64', () => {
    Object.defineProperty(process, 'platform', {
      value: 'linux',
      configurable: true,
    });
    Object.defineProperty(process, 'arch', {
      value: 'arm64',
      configurable: true,
    });

    expect(getPlatformInfo()).toEqual({
      os: 'linux',
      arch: 'arm64',
    });
  });

  it('should return macOS and x86_64 for macOS x64', () => {
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
      configurable: true,
    });
    Object.defineProperty(process, 'arch', {
      value: 'x64',
      configurable: true,
    });

    expect(getPlatformInfo()).toEqual({
      os: 'macOS',
      arch: 'x86_64',
    });
  });

  it('should return macOS and arm64 for macOS ARM64', () => {
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
      configurable: true,
    });
    Object.defineProperty(process, 'arch', {
      value: 'arm64',
      configurable: true,
    });

    expect(getPlatformInfo()).toEqual({
      os: 'macOS',
      arch: 'arm64',
    });
  });

  it('should throw error for Windows', () => {
    Object.defineProperty(process, 'platform', {
      value: 'win32',
      configurable: true,
    });
    Object.defineProperty(process, 'arch', {
      value: 'x64',
      configurable: true,
    });

    expect(() => getPlatformInfo()).toThrow('Windows is not supported');
  });

  it('should throw error for unsupported OS', () => {
    Object.defineProperty(process, 'platform', {
      value: 'freebsd',
      configurable: true,
    });
    Object.defineProperty(process, 'arch', {
      value: 'x64',
      configurable: true,
    });

    expect(() => getPlatformInfo()).toThrow('Unsupported OS: freebsd');
  });

  it('should throw error for unsupported architecture', () => {
    Object.defineProperty(process, 'platform', {
      value: 'linux',
      configurable: true,
    });
    Object.defineProperty(process, 'arch', {
      value: 'ia32',
      configurable: true,
    });

    expect(() => getPlatformInfo()).toThrow('Unsupported architecture: ia32');
  });
});
