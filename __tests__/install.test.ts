import * as tc from '@actions/tool-cache';
import * as core from '@actions/core';
import * as fs from 'fs';
import { installSame, InstallResult } from '../src/install';

jest.mock('@actions/tool-cache');
jest.mock('@actions/core');
jest.mock('fs', () => ({
  statSync: jest.fn(),
  existsSync: jest.fn(),
  chmodSync: jest.fn(),
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
  },
  constants: {
    O_RDONLY: 0,
    O_WRONLY: 1,
    O_RDWR: 2,
    S_IFMT: 61440,
    S_IFREG: 32768,
    S_IFDIR: 16384,
    S_IFCHR: 8192,
    S_IFBLK: 6144,
    S_IFIFO: 4096,
    S_IFLNK: 40960,
    S_IFSOCK: 49152,
    F_OK: 0,
    R_OK: 4,
    W_OK: 2,
    X_OK: 1,
  },
}));

const mockedTc = tc as jest.Mocked<typeof tc>;
const mockedCore = core as jest.Mocked<typeof core>;
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('installSame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedTc.find.mockReturnValue('');
    mockedTc.downloadTool.mockResolvedValue('/tmp/download.tar.gz');
    mockedTc.extractTar.mockResolvedValue('/tmp/extracted');
    mockedTc.cacheDir.mockResolvedValue('/tmp/cached');
    mockedFs.statSync.mockReturnValue({ size: 1024 } as fs.Stats);
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.chmodSync.mockReturnValue(undefined);
  });

  it('should construct correct URL for Linux x86_64', async () => {
    const platformInfo = { os: 'linux' as const, arch: 'x86_64' as const };
    await installSame('1.0.0', platformInfo, 'test-token');

    expect(mockedTc.downloadTool).toHaveBeenCalledWith(
      'https://github.com/traiproject/same/releases/download/v1.0.0/same_1.0.0_linux_x86_64.tar.gz',
      '',
      'token test-token'
    );
  });

  it('should construct correct URL for Linux arm64', async () => {
    const platformInfo = { os: 'linux' as const, arch: 'arm64' as const };
    await installSame('1.0.0', platformInfo, 'test-token');

    expect(mockedTc.downloadTool).toHaveBeenCalledWith(
      'https://github.com/traiproject/same/releases/download/v1.0.0/same_1.0.0_linux_arm64.tar.gz',
      '',
      'token test-token'
    );
  });

  it('should construct correct URL for macOS x86_64', async () => {
    const platformInfo = { os: 'macOS' as const, arch: 'x86_64' as const };
    await installSame('1.0.0', platformInfo, 'test-token');

    expect(mockedTc.downloadTool).toHaveBeenCalledWith(
      'https://github.com/traiproject/same/releases/download/v1.0.0/same_1.0.0_macOS_x86_64.tar.gz',
      '',
      'token test-token'
    );
  });

  it('should construct correct URL for macOS arm64', async () => {
    const platformInfo = { os: 'macOS' as const, arch: 'arm64' as const };
    await installSame('1.0.0', platformInfo, 'test-token');

    expect(mockedTc.downloadTool).toHaveBeenCalledWith(
      'https://github.com/traiproject/same/releases/download/v1.0.0/same_1.0.0_macOS_arm64.tar.gz',
      '',
      'token test-token'
    );
  });

  it('should return cached path and cache hit when cache is found', async () => {
    mockedTc.find.mockReturnValue('/cached/path');

    const platformInfo = { os: 'linux' as const, arch: 'x86_64' as const };
    const result: InstallResult = await installSame('1.0.0', platformInfo, 'test-token');

    expect(result).toEqual({
      cachedPath: '/cached/path',
      cacheHit: true,
    });
    expect(mockedTc.downloadTool).not.toHaveBeenCalled();
    expect(mockedCore.addPath).toHaveBeenCalledWith('/cached/path');
  });

  it('should download and cache when no cache is found', async () => {
    const platformInfo = { os: 'linux' as const, arch: 'x86_64' as const };
    const result: InstallResult = await installSame('1.0.0', platformInfo, 'test-token');

    expect(result).toEqual({
      cachedPath: '/tmp/cached',
      cacheHit: false,
    });
    expect(mockedTc.downloadTool).toHaveBeenCalledWith(
      'https://github.com/traiproject/same/releases/download/v1.0.0/same_1.0.0_linux_x86_64.tar.gz',
      '',
      'token test-token'
    );
    expect(mockedTc.extractTar).toHaveBeenCalledWith('/tmp/download.tar.gz');
    expect(mockedTc.cacheDir).toHaveBeenCalledWith(
      '/tmp/extracted',
      'same',
      '1.0.0',
      'linux_x86_64'
    );
    expect(mockedCore.addPath).toHaveBeenCalledWith('/tmp/cached');
  });

  it('should log cache hit message when cache is found', async () => {
    mockedTc.find.mockReturnValue('/cached/path');

    const platformInfo = { os: 'linux' as const, arch: 'x86_64' as const };
    await installSame('1.0.0', platformInfo, 'test-token');

    expect(mockedCore.info).toHaveBeenCalledWith(
      'Found cached same 1.0.0 for linux/x86_64'
    );
  });

  it('should log download and extraction messages when no cache is found', async () => {
    const platformInfo = { os: 'linux' as const, arch: 'x86_64' as const };
    await installSame('1.0.0', platformInfo, 'test-token');

    expect(mockedCore.info).toHaveBeenCalledWith(
      'Downloading same 1.0.0 for linux/x86_64 from GitHub releases'
    );
    expect(mockedCore.info).toHaveBeenCalledWith('Download attempt 1/3');
    expect(mockedCore.info).toHaveBeenCalledWith(expect.stringContaining('Downloaded to'));
    expect(mockedCore.info).toHaveBeenCalledWith(
      expect.stringContaining('Downloaded file size')
    );
    expect(mockedCore.info).toHaveBeenCalledWith(expect.stringContaining('Extracted to'));
    expect(mockedCore.info).toHaveBeenCalledWith(expect.stringContaining('Cached to'));
    expect(mockedCore.info).toHaveBeenCalledWith('Set binary as executable');
  });

  it('should throw error when downloaded file is empty', async () => {
    mockedFs.statSync.mockReturnValue({ size: 0 } as fs.Stats);

    const platformInfo = { os: 'linux' as const, arch: 'x86_64' as const };

    await expect(installSame('1.0.0', platformInfo, 'test-token')).rejects.toThrow(
      'Downloaded file is empty'
    );
  });

  it('should throw error when binary is not found after extraction', async () => {
    mockedFs.existsSync.mockReturnValue(false);

    const platformInfo = { os: 'linux' as const, arch: 'x86_64' as const };

    await expect(installSame('1.0.0', platformInfo, 'test-token')).rejects.toThrow(
      'Binary not found at'
    );
  });

  it('should set binary as executable on Unix systems', async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });

    const platformInfo = { os: 'linux' as const, arch: 'x86_64' as const };
    await installSame('1.0.0', platformInfo, 'test-token');

    expect(mockedFs.chmodSync).toHaveBeenCalledWith('/tmp/cached/same', 0o755);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should not set chmod on Windows', async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });

    const platformInfo = { os: 'linux' as const, arch: 'x86_64' as const };
    await installSame('1.0.0', platformInfo, 'test-token');

    expect(mockedFs.chmodSync).not.toHaveBeenCalled();

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should handle download failure with retries', async () => {
    mockedTc.downloadTool.mockRejectedValue(new Error('Network error'));

    const platformInfo = { os: 'linux' as const, arch: 'x86_64' as const };
    
    await expect(installSame('1.0.0', platformInfo, 'test-token')).rejects.toThrow('Network error');
    
    expect(mockedTc.downloadTool).toHaveBeenCalledTimes(3);
    expect(mockedCore.info).toHaveBeenCalledWith('Download attempt 1/3');
    expect(mockedCore.info).toHaveBeenCalledWith('Download attempt 2/3');
    expect(mockedCore.info).toHaveBeenCalledWith('Download attempt 3/3');
    expect(mockedCore.warning).toHaveBeenCalledTimes(2);
  }, 30000);

  it('should handle extraction failure', async () => {
    mockedTc.downloadTool.mockResolvedValue('/tmp/download.tar.gz');
    mockedTc.extractTar.mockRejectedValue(new Error('Invalid archive'));

    const platformInfo = { os: 'linux' as const, arch: 'x86_64' as const };
    
    await expect(installSame('1.0.0', platformInfo, 'test-token')).rejects.toThrow('Invalid archive');
  });

  it('should handle cache failure', async () => {
    mockedTc.downloadTool.mockResolvedValue('/tmp/download.tar.gz');
    mockedTc.extractTar.mockResolvedValue('/tmp/extracted');
    mockedTc.cacheDir.mockRejectedValue(new Error('No space left'));

    const platformInfo = { os: 'linux' as const, arch: 'x86_64' as const };
    
    await expect(installSame('1.0.0', platformInfo, 'test-token')).rejects.toThrow('No space left');
  });

  it('should work without token parameter', async () => {
    const platformInfo = { os: 'linux' as const, arch: 'x86_64' as const };
    const result: InstallResult = await installSame('1.0.0', platformInfo);

    expect(result).toEqual({
      cachedPath: '/tmp/cached',
      cacheHit: false,
    });
    expect(mockedTc.downloadTool).toHaveBeenCalledWith(
      'https://github.com/traiproject/same/releases/download/v1.0.0/same_1.0.0_linux_x86_64.tar.gz',
      '',
      ''
    );
  });
});
