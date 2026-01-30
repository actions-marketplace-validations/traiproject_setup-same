import { HttpClient } from '@actions/http-client';
import { resolveVersion } from '../src/version';

jest.mock('@actions/http-client');

const mockedHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;

describe('resolveVersion', () => {
  beforeEach(() => {
    mockedHttpClient.mockClear();
  });

  it('should return version without v prefix', async () => {
    const result = await resolveVersion('0.0.1', '');
    expect(result).toBe('0.0.1');
  });

  it('should strip v prefix from version', async () => {
    const result = await resolveVersion('v0.0.1', '');
    expect(result).toBe('0.0.1');
  });

  it('should trim whitespace from version', async () => {
    const result = await resolveVersion('  v0.0.1  ', '');
    expect(result).toBe('0.0.1');
  });

  it('should resolve latest version from GitHub API', async () => {
    const mockResponse = {
      message: { statusCode: 200, headers: {} },
      readBody: jest.fn().mockResolvedValue(JSON.stringify({ tag_name: 'v0.1.0' })),
    };

    const mockClient = {
      get: jest.fn().mockResolvedValue(mockResponse),
    };

    mockedHttpClient.mockImplementation(() => mockClient as any);

    const result = await resolveVersion('latest', '');
    expect(result).toBe('0.1.0');
    expect(mockClient.get).toHaveBeenCalledWith(
      'https://api.github.com/repos/traiproject/same/releases/latest',
      {}
    );
  });

  it('should throw error for empty version', async () => {
    await expect(resolveVersion('', '')).rejects.toThrow('Version cannot be empty');
  });

  it('should throw error for version with only v', async () => {
    await expect(resolveVersion('v', '')).rejects.toThrow(
      'Invalid version: input was "v" with no version number'
    );
  });

  it('should throw error for invalid version format', async () => {
    await expect(resolveVersion('invalid-version', '')).rejects.toThrow(
      'Invalid version format: invalid-version. Expected semver format (e.g., 1.0.0) or \'latest\''
    );
  });

  it('should throw error for path traversal attempt', async () => {
    await expect(resolveVersion('../../etc/passwd', '')).rejects.toThrow(
      'Invalid version format: ../../etc/passwd. Expected semver format (e.g., 1.0.0) or \'latest\''
    );
  });

  it('should accept valid semver versions', async () => {
    expect(await resolveVersion('1.2.3', '')).toBe('1.2.3');
    expect(await resolveVersion('0.0.1', '')).toBe('0.0.1');
    expect(await resolveVersion('1.0.0-beta.1', '')).toBe('1.0.0-beta.1');
  });

  it('should throw error when GitHub API fails', async () => {
    const mockResponse = {
      message: { statusCode: 500, headers: {} },
      readBody: jest.fn().mockResolvedValue('Internal Server Error'),
    };

    const mockClient = {
      get: jest.fn().mockResolvedValue(mockResponse),
    };

    mockedHttpClient.mockImplementation(() => mockClient as any);

    await expect(resolveVersion('latest', '')).rejects.toThrow(
      'Failed to fetch latest release from GitHub API: HTTP 500'
    );
  });

  it('should throw error with rate limit message when rate limited', async () => {
    const mockResponse = {
      message: {
        statusCode: 403,
        headers: {
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': '1234567890',
        },
      },
      readBody: jest.fn().mockResolvedValue('Rate limit exceeded'),
    };

    const mockClient = {
      get: jest.fn().mockResolvedValue(mockResponse),
    };

    mockedHttpClient.mockImplementation(() => mockClient as any);

    await expect(resolveVersion('latest', '')).rejects.toThrow('GitHub API rate limit exceeded');
    await expect(resolveVersion('latest', '')).rejects.toThrow('github-token');
  });

  it('should throw error when API response is invalid JSON', async () => {
    const mockResponse = {
      message: { statusCode: 200, headers: {} },
      readBody: jest.fn().mockResolvedValue('invalid json'),
    };

    const mockClient = {
      get: jest.fn().mockResolvedValue(mockResponse),
    };

    mockedHttpClient.mockImplementation(() => mockClient as any);

    await expect(resolveVersion('latest', '')).rejects.toThrow('Failed to parse GitHub API response');
  });

  it('should throw error when tag_name is missing from response', async () => {
    const mockResponse = {
      message: { statusCode: 200, headers: {} },
      readBody: jest.fn().mockResolvedValue(JSON.stringify({})),
    };

    const mockClient = {
      get: jest.fn().mockResolvedValue(mockResponse),
    };

    mockedHttpClient.mockImplementation(() => mockClient as any);

    await expect(resolveVersion('latest', '')).rejects.toThrow(
      'No valid tag_name found in GitHub API response'
    );
  });

  it('should use GitHub token when provided', async () => {
    const mockResponse = {
      message: { statusCode: 200, headers: {} },
      readBody: jest.fn().mockResolvedValue(JSON.stringify({ tag_name: 'v0.2.0' })),
    };

    const mockClient = {
      get: jest.fn().mockResolvedValue(mockResponse),
    };

    mockedHttpClient.mockImplementation(() => mockClient as any);

    await resolveVersion('latest', 'test-token');

    expect(mockClient.get).toHaveBeenCalledWith(
      'https://api.github.com/repos/traiproject/same/releases/latest',
      { Authorization: 'token test-token' }
    );
  });
});
