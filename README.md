# setup-same

![](https://img.shields.io/github/actions/workflow/status/traiproject/setup-same/test.yml?style=flat-square)
![](https://img.shields.io/github/v/release/traiproject/setup-same?style=flat-square)

Set up your GitHub Actions workflow with the [same CLI tool](https://github.com/traiproject/same).

This action downloads and installs the `same` binary from GitHub releases, caches it for improved performance, and makes it available in your workflow's PATH.

## Usage

### Basic Usage (Latest Version)

Install the latest version of same with minimal configuration:

```yaml
- name: Setup same
  uses: traiproject/setup-same@v1

- name: Use same
  run: same --version
```

### Pinning a Specific Version

Install a specific version of same (with or without the 'v' prefix):

```yaml
- name: Setup same v0.0.1
  uses: traiproject/setup-same@v1
  with:
    version: 'v0.0.1'

- name: Setup same 0.0.1
  uses: traiproject/setup-same@v1
  with:
    version: '0.0.1'
```

### Using a Custom GitHub Token

For private repositories or to avoid rate limits:

```yaml
- name: Setup same with custom token
  uses: traiproject/setup-same@v1
  with:
    version: 'latest'
    github-token: ${{ secrets.CUSTOM_GITHUB_TOKEN }}
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `version` | Version of same to install (`latest` or version tag like `v1.0.0`) | No | `latest` |
| `github-token` | GitHub token for API requests | No | `${{ github.token }}` |

## Outputs

| Output | Description |
|--------|-------------|
| `version` | The installed version of same |
| `cache-hit` | Boolean indicating if the binary was retrieved from cache |

##Platform Support

- **Linux**: Ubuntu, Debian, and other Linux distributions
- **macOS**: Intel (x86_64) and Apple Silicon (ARM64) Macs
- **Not supported**: Windows

Supported architectures: `x86_64`, `arm64`

## Caching

This action caches the downloaded binary between workflow runs to improve performance. The cache key is based on the OS, architecture, and version.

## License

MIT