/**
 * Sources Tools
 * MCP tools for managing Jules repository sources
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getApiClient } from "../services/api-client.js";
import {
  formatSourceMarkdown,
  formatSourcesListMarkdown,
} from "../services/formatters.js";
import {
  ListSourcesInputSchema,
  GetSourceInputSchema,
  type ListSourcesInput,
  type GetSourceInput,
} from "../schemas/index.js";
import type { Source, ListSourcesResponse } from "../types.js";

export function registerSourcesTools(server: McpServer): void {
  // =========================================================================
  // List Sources
  // =========================================================================
  server.registerTool(
    "jules_list_sources",
    {
      title: "List Connected Sources",
      description: `List all repository sources connected to Jules.

Sources are GitHub repositories that Jules can work with. 
Sources are connected through the Jules web interface.

Args:
  - pageSize (number, optional): Results per page (1-100, default: 20)
  - pageToken (string, optional): Token for pagination
  - filter (string, optional): Filter expression (e.g., 'name=sources/github-owner-repo')
  - response_format ('markdown' | 'json'): Output format

Returns:
  List of sources with repository details:
  - Owner and repo name
  - Public/private status
  - Available branches

Examples:
  - List all repos: no params needed
  - Filter by name: filter="name=sources/github-myorg-myrepo"`,
      inputSchema: ListSourcesInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListSourcesInput) => {
      const client = getApiClient();

      const response = await client.get<ListSourcesResponse>("/sources", {
        pageSize: params.pageSize,
        pageToken: params.pageToken,
        filter: params.filter,
      });

      const sources = response.sources || [];
      const hasMore = !!response.nextPageToken;

      if (params.response_format === "json") {
        const output = {
          sources,
          total: sources.length,
          hasMore,
          nextPageToken: response.nextPageToken,
        };
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(output, null, 2) },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: formatSourcesListMarkdown(
              sources,
              hasMore,
              response.nextPageToken
            ),
          },
        ],
      };
    }
  );

  // =========================================================================
  // Get Source
  // =========================================================================
  server.registerTool(
    "jules_get_source",
    {
      title: "Get Source Details",
      description: `Get details of a specific repository source.

Retrieves full information about a connected GitHub repository
including all available branches.

Args:
  - sourceId (string, required): The source ID (e.g., 'github-owner-repo')
  - response_format ('markdown' | 'json'): Output format

Returns:
  Full source details:
  - Repository owner and name
  - Public/private status
  - Default branch
  - All available branches

Examples:
  - Get repo details: sourceId="github-myorg-myrepo"`,
      inputSchema: GetSourceInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: GetSourceInput) => {
      const client = getApiClient();

      const source = await client.get<Source>(`/sources/${params.sourceId}`);

      if (params.response_format === "json") {
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(source, null, 2) },
          ],
        };
      }

      return {
        content: [
          { type: "text" as const, text: formatSourceMarkdown(source) },
        ],
      };
    }
  );
}
