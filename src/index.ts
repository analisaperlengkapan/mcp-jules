/**
 * Jules MCP Server
 *
 * MCP Server for Google Jules AI Coding Agent API
 * Enables LLMs to create and manage coding sessions, monitor progress,
 * and interact with Jules through natural language.
 *
 * @see https://jules.google/docs/api/reference/
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

import { registerSessionsTools } from "./tools/sessions.js";
import { registerActivitiesTools } from "./tools/activities.js";
import { registerSourcesTools } from "./tools/sources.js";
import { API_KEY_ENV_VAR } from "./constants.js";

// ============================================================================
// Server Initialization
// ============================================================================

const server = new McpServer({
  name: "jules-mcp-server",
  version: "1.0.0",
});

// ============================================================================
// Register All Tools
// ============================================================================

/**
 * Register all MCP tools with the server
 */
function registerAllTools(): void {
  // Sessions: Create, list, get, delete, send message, approve plan
  registerSessionsTools(server);

  // Activities: List and get session activities
  registerActivitiesTools(server);

  // Sources: List and get connected repositories
  registerSourcesTools(server);
}

// ============================================================================
// Transport Setup
// ============================================================================

/**
 * Run server with stdio transport (for local/CLI use)
 */
async function runStdio(): Promise<void> {
  // Validate API key exists
  if (!process.env[API_KEY_ENV_VAR]) {
    console.error(
      `Error: ${API_KEY_ENV_VAR} environment variable is required.`
    );
    console.error("Get your API key from https://jules.google.com/settings");
    process.exit(1);
  }

  registerAllTools();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Jules MCP Server running on stdio");
}

/**
 * Run server with HTTP transport (for remote/web use)
 */
async function runHTTP(): Promise<void> {
  // Validate API key exists
  if (!process.env[API_KEY_ENV_VAR]) {
    console.error(
      `Error: ${API_KEY_ENV_VAR} environment variable is required.`
    );
    console.error("Get your API key from https://jules.google.com/settings");
    process.exit(1);
  }

  registerAllTools();

  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get("/health", (_, res) => {
    res.json({ status: "ok", server: "jules-mcp-server", version: "1.0.0" });
  });

  // MCP endpoint
  app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const port = parseInt(process.env.PORT || "3000");
  app.listen(port, () => {
    console.error(`Jules MCP Server running on http://localhost:${port}/mcp`);
    console.error(`Health check: http://localhost:${port}/health`);
  });
}

// ============================================================================
// CLI Interface
// ============================================================================

function printHelp(): void {
  console.log(`
Jules MCP Server - Google Jules AI Coding Agent API

USAGE:
  node dist/index.js [OPTIONS]

OPTIONS:
  --help, -h      Show this help message
  --http          Run with HTTP transport (default: stdio)

ENVIRONMENT:
  JULES_API_KEY   Required. Get from https://jules.google.com/settings
  PORT            HTTP port (default: 3000, only for --http)
  TRANSPORT       Alternative to --http: set to 'http' for HTTP transport

EXAMPLES:
  # Run with stdio (for MCP clients like Claude Desktop)
  JULES_API_KEY=your-key node dist/index.js

  # Run with HTTP (for remote access)
  JULES_API_KEY=your-key node dist/index.js --http

  # Run with HTTP on custom port
  JULES_API_KEY=your-key PORT=8080 node dist/index.js --http

AVAILABLE TOOLS:
  jules_create_session    Create a new coding session
  jules_list_sessions     List all sessions
  jules_get_session       Get session details
  jules_delete_session    Delete a session
  jules_send_message      Send message to active session
  jules_approve_plan      Approve a pending plan
  jules_list_activities   List session activities
  jules_get_activity      Get activity details
  jules_list_sources      List connected repositories
  jules_get_source        Get source details

For more information, see: https://jules.google/docs/api/reference/
`);
}

// ============================================================================
// Main Entry Point
// ============================================================================

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

const useHttp = args.includes("--http") || process.env.TRANSPORT === "http";

if (useHttp) {
  runHTTP().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
} else {
  runStdio().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
