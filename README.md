# Jules MCP Server

[![Status](https://img.shields.io/badge/status-GitHub%20Actions-2088FF?style=flat-square)](.github/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-1.0.0-0ea5e9?style=flat-square)](package.json)

MCP (Model Context Protocol) server for [Google Jules](https://jules.google) - the AI coding agent. This server enables LLMs like Claude to interact with Jules API, creating and managing coding sessions programmatically.

## Features

- **Session Management**: Create, list, get, and delete coding sessions
- **Interactive Communication**: Send messages to active sessions and approve plans
- **Activity Monitoring**: Track progress through session activities
- **Source Management**: List and inspect connected GitHub repositories
- **Dual Transport**: Supports both stdio and HTTP transports

## Prerequisites

- Node.js 18+
- Jules API Key (get from [jules.google.com/settings](https://jules.google.com/settings))
- Connected GitHub repositories in Jules

## Installation

```bash
# Clone or download the server
cd jules-mcp-server

# Install dependencies
npm install

# Build the TypeScript
npm run build
```

## Configuration

Set your Jules API key as an environment variable:

```bash
export JULES_API_KEY="your-api-key-here"
```

## Usage

### With Claude Desktop (stdio transport)

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "jules": {
      "command": "node",
      "args": ["/path/to/jules-mcp-server/dist/index.js"],
      "env": {
        "JULES_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Command Line

```bash
# Run with stdio transport
JULES_API_KEY=your-key node dist/index.js

# Run with HTTP transport
JULES_API_KEY=your-key node dist/index.js --http

# Custom port for HTTP
JULES_API_KEY=your-key PORT=8080 node dist/index.js --http

# Show help
node dist/index.js --help
```

## Available Tools

### Session Tools

| Tool                   | Description                         |
| ---------------------- | ----------------------------------- |
| `jules_create_session` | Create a new coding session         |
| `jules_list_sessions`  | List all sessions                   |
| `jules_get_session`    | Get details of a specific session   |
| `jules_delete_session` | Delete a session                    |
| `jules_send_message`   | Send a message to an active session |
| `jules_approve_plan`   | Approve a pending plan              |

### Activity Tools

| Tool                    | Description                        |
| ----------------------- | ---------------------------------- |
| `jules_list_activities` | List all activities for a session  |
| `jules_get_activity`    | Get details of a specific activity |

### Source Tools

| Tool                 | Description                      |
| -------------------- | -------------------------------- |
| `jules_list_sources` | List connected repositories      |
| `jules_get_source`   | Get details of a specific source |

## Examples

### Create a Coding Session

```
Use jules_create_session with:
- prompt: "Add unit tests for the authentication module"
- sourceContext:
  - source: "sources/github-myorg-myrepo"
  - githubRepoContext:
    - startingBranch: "main"
- requirePlanApproval: true
```

### Monitor Session Progress

```
1. Use jules_list_sessions to see all sessions
2. Use jules_get_session with sessionId to get details
3. Use jules_list_activities with sessionId to see progress
4. If state is AWAITING_PLAN_APPROVAL, use jules_approve_plan
5. If state is AWAITING_USER_FEEDBACK, use jules_send_message
```

### View Code Changes

```
1. Use jules_list_activities to find activities with artifacts
2. Use jules_get_activity to see code diffs and changes
```

## Session States

| State                    | Description              |
| ------------------------ | ------------------------ |
| `QUEUED`                 | Waiting to be processed  |
| `PLANNING`               | Jules is creating a plan |
| `AWAITING_PLAN_APPROVAL` | Plan ready for approval  |
| `AWAITING_USER_FEEDBACK` | Jules needs input        |
| `IN_PROGRESS`            | Jules is working         |
| `PAUSED`                 | Session paused           |
| `COMPLETED`              | Task completed           |
| `FAILED`                 | Task failed              |

## Response Formats

All tools support two output formats:

- **markdown** (default): Human-readable formatted text
- **json**: Structured data for programmatic processing

Use the `response_format` parameter to choose.

## Error Handling

The server provides clear error messages for common issues:

- **401**: Invalid or missing API key
- **403**: Insufficient permissions
- **404**: Resource not found
- **429**: Rate limited

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Type-check without emitting files
npm run check

# Lint source files
npm run lint

# Check formatting
npm run format:check

# Development mode (watch)
npm run dev
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, workflow, and pull request guidance.

Project hygiene and community documents:

- [CHANGELOG.md](CHANGELOG.md)
- [SECURITY.md](SECURITY.md)
- [LICENSE](LICENSE)

## API Reference

Based on [Jules REST API](https://jules.google/docs/api/reference/):

- Base URL: `https://jules.googleapis.com/v1alpha`
- Authentication: `x-goog-api-key` header
- Full documentation: [jules.google/docs/api/reference](https://jules.google/docs/api/reference/)

## License

MIT
