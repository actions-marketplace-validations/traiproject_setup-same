import * as tc from '@actions/tool-cache';
import * as core from '@actions/core';
import { installSame, InstallResult } from '../src/install';

jest.mock('@actions/tool-cache');
jest.mock('@actions/core');

const mockedTc = tc as jest.Mocked<typeof tc>;
const mockedCore = core as jest.Mocked<typeof core>;

describe('installSame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedTc.find.mockReturnValue('');
    mockedTc.downloadTool.mockResolvedValue('/tmp/download.tar.gz');
    mockedTc.extractTar.mockResolvedValue('/tmp/extracted');
    mockedTc.cacheDir.mockResolvedValue('/tmp/cached');
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
      'Downloading same 1.0.0 for linux/x86_64'
    );
    expect(mockedCore.info).toHaveBeenCalledWith(
      expect.stringContaining('Download URL')
    );
    expect(mockedCore.info).toHaveBeenCalledWith(
      expect.stringContaining('Downloaded to')
    );
    expect(mockedCore.info).toHaveBeenCalledWith(
      expect.stringContaining('Extracted to')
    );
    expect(mockedCore.info).toHaveBeenCalledWith(
      expect.stringContaining('Cached to')
    );
  });

  it('should handle download failure', async () => {
    mockedTc.downloadTool.mockRejectedValue(new Error('Network error'));

    const platformInfo = { os: 'linux' as const, arch: 'x86_64' as const };
    
    await expect(installSame('1.0.0', platformInfo, 'test-token')).rejects.toThrow('Network error');
  });

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
