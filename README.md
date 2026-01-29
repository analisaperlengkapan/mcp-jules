# Jules MCP Server

A Model Context Protocol (MCP) server that enables AI agents to interact with [Google's Jules](https://jules.google) agentic coding agent.

This server allows you to delegate coding tasks to Jules, monitor their progress, review plans, and intervene when necessary—all through a standardized MCP interface.

## Features

- **Delegate Tasks**: Start new coding sessions with `jules_create_session`. Supports attaching local Git context or specifying explicit remote repositories.
- **Monitor Progress**: distinct tools to list sessions (`jules_list_sessions`) and view detailed activity logs (`jules_list_activities`, `jules_get_activity`).
- **Review & Approve**: Approve Jules' execution plans with `jules_approve_plan`.
- **Intervene**: Send messages/feedback to active sessions using `jules_send_message`.
- **Manage**: Delete old or temporary sessions with `jules_delete_session`.
- **Discovery**: List connected source repositories with `jules_list_sources`.

## Prerequisites

- **Node.js**: v16 or higher.
- **Jules API Key**: Obtain one from [jules.google.com/settings](https://jules.google.com/settings).

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/analisaperlengkapan/mcp-jules.git
    cd mcp-jules
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Build the project:
    ```bash
    npm run build
    ```

## Configuration

Set your Jules API Key as an environment variable. You can create a `.env` file in the root directory:

```bash
JULES_API_KEY=your_api_key_here
```

## Usage

### Running Locally

You can run the server directly using Node:

```bash
node build/index.js
```

### integrating with MCP Clients

Add the server to your MCP Client configuration (e.g., Claude Desktop, etc.):

```json
{
  "mcpServers": {
    "jules": {
      "command": "node",
      "args": ["/path/to/mcp-jules/build/index.js"],
      "env": {
        "JULES_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Tools Available

- `jules_create_session`: Start a new task. Args: `prompt`, `title`, `source_repo`, `starting_branch`.
- `jules_list_sessions`: View recent sessions.
- `jules_get_session`: Get details of a specific session.
- `jules_list_activities`: View events (plans, messages) for a session.
- `jules_get_activity`: View full details of a specific event.
- `jules_send_message`: Send feedback to Jules.
- `jules_approve_plan`: Approve a waiting plan.
- `jules_delete_session`: Delete a session.
- `jules_list_sources`: See available GitHub repositories.

## License

ISC
