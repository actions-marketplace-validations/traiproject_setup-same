import { HttpClient } from '@actions/http-client';

interface GitHubRelease {
  tag_name: string;
}

export async function resolveVersion(version: string, token: string): Promise<string> {
  const trimmedVersion = version.trim();
  
  if (!trimmedVersion) {
    throw new Error('Version cannot be empty');
  }
  
  const sanitizedVersion = trimmedVersion.startsWith('v') ? trimmedVersion.slice(1) : trimmedVersion;
  
  if (!sanitizedVersion) {
    throw new Error('Invalid version: input was "v" with no version number');
  }
  
  if (sanitizedVersion !== 'latest') {
    return sanitizedVersion;
  }
  
  const client = new HttpClient('@actions/setup-same', undefined, {
    allowRetries: true,
    maxRetries: 3
  });
  
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  
  const url = 'https://api.github.com/repos/traiproject/same/releases/latest';
  const response = await client.get(url, headers);
  
  const body = await response.readBody();
  
  if (response.message.statusCode !== 200) {
    throw new Error(`Failed to fetch latest release: ${response.message.statusCode} ${body}`);
  }
  
  let data: GitHubRelease;
  try {
    data = JSON.parse(body);
  } catch (error) {
    throw new Error(`Failed to parse GitHub API response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  if (!data.tag_name) {
    throw new Error('No tag_name found in GitHub API response');
  }
  
  const latestVersion = data.tag_name.startsWith('v') ? data.tag_name.slice(1) : data.tag_name;
  
  return latestVersion;
}
