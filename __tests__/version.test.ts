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
      message: { statusCode: 200 },
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
    await expect(resolveVersion('v', '')).rejects.toThrow('Invalid version: input was "v" with no version number');
  });

  it('should throw error when GitHub API fails', async () => {
    const mockResponse = {
      message: { statusCode: 500 },
      readBody: jest.fn().mockResolvedValue('Internal Server Error'),
    };

    const mockClient = {
      get: jest.fn().mockResolvedValue(mockResponse),
    };

    mockedHttpClient.mockImplementation(() => mockClient as any);

    await expect(resolveVersion('latest', '')).rejects.toThrow('Failed to fetch latest release: 500 Internal Server Error');
  });

  it('should throw error when API response is invalid JSON', async () => {
    const mockResponse = {
      message: { statusCode: 200 },
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
      message: { statusCode: 200 },
      readBody: jest.fn().mockResolvedValue(JSON.stringify({})),
    };

    const mockClient = {
      get: jest.fn().mockResolvedValue(mockResponse),
    };

    mockedHttpClient.mockImplementation(() => mockClient as any);

    await expect(resolveVersion('latest', '')).rejects.toThrow('No tag_name found in GitHub API response');
  });

  it('should use GitHub token when provided', async () => {
    const mockResponse = {
      message: { statusCode: 200 },
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
