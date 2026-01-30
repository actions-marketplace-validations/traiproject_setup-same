import { HttpClient } from '@actions/http-client';
import { SAME_REPO } from './config';

interface GitHubRelease {
  tag_name: string;
  draft?: boolean;
  prerelease?: boolean;
}

function isValidVersion(version: string): boolean {
  return /^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?$/.test(version);
}

export async function resolveVersion(version: string, token: string): Promise<string> {
  const trimmedVersion = version.trim();

  if (!trimmedVersion) {
    throw new Error('Version cannot be empty');
  }

  const sanitizedVersion = trimmedVersion.startsWith('v')
    ? trimmedVersion.slice(1)
    : trimmedVersion;

  if (!sanitizedVersion) {
    throw new Error('Invalid version: input was "v" with no version number');
  }

  if (sanitizedVersion !== 'latest' && !isValidVersion(sanitizedVersion)) {
    throw new Error(
      `Invalid version format: ${sanitizedVersion}. Expected semver format (e.g., 1.0.0) or 'latest'`
    );
  }

  if (sanitizedVersion !== 'latest') {
    return sanitizedVersion;
  }

  const client = new HttpClient('@actions/setup-same', undefined, {
    allowRetries: true,
    maxRetries: 3,
    socketTimeout: 30000,
    keepAlive: true,
  });

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const url = `https://api.github.com/repos/${SAME_REPO}/releases/latest`;
  const response = await client.get(url, headers);

  const body = await response.readBody();

  if (response.message.statusCode === 403) {
    const rateLimitRemaining = response.message.headers['x-ratelimit-remaining'];
    const rateLimitReset = response.message.headers['x-ratelimit-reset'];

    const remaining = Array.isArray(rateLimitRemaining)
      ? rateLimitRemaining[0]
      : rateLimitRemaining;
    const reset = Array.isArray(rateLimitReset) ? rateLimitReset[0] : rateLimitReset;

    if (remaining === '0') {
      const resetDate = new Date(parseInt(reset || '0') * 1000);
      throw new Error(
        `GitHub API rate limit exceeded. Limit resets at ${resetDate.toISOString()}. ` +
          `Consider providing a github-token input to increase rate limits.`
      );
    }
  }

  if (response.message.statusCode !== 200) {
    const truncatedBody = body.length > 200 ? body.substring(0, 200) + '...' : body;
    throw new Error(
      `Failed to fetch latest release from GitHub API: HTTP ${response.message.statusCode}. ` +
        `Response: ${truncatedBody}`
    );
  }

  let data: GitHubRelease;
  try {
    data = JSON.parse(body);
  } catch (error) {
    throw new Error(
      `Failed to parse GitHub API response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response structure from GitHub API');
  }

  if (!data.tag_name || typeof data.tag_name !== 'string') {
    throw new Error('No valid tag_name found in GitHub API response');
  }

  const latestVersion = data.tag_name.startsWith('v') ? data.tag_name.slice(1) : data.tag_name;

  return latestVersion;
}
