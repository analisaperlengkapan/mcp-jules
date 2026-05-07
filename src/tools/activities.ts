/**
 * Activities Tools
 * MCP tools for monitoring Jules session activities
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getApiClient } from "../services/api-client.js";
import {
  formatActivityMarkdown,
  formatActivitiesListMarkdown,
} from "../services/formatters.js";
import {
  ListActivitiesInputSchema,
  GetActivityInputSchema,
  type ListActivitiesInput,
  type GetActivityInput,
} from "../schemas/index.js";
import type { Activity, ListActivitiesResponse } from "../types.js";

export function registerActivitiesTools(server: McpServer): void {
  // =========================================================================
  // List Activities
  // =========================================================================
  server.registerTool(
    "jules_list_activities",
    {
      title: "List Session Activities",
      description: `List all activities for a Jules coding session.

Activities track everything that happens during a session:
- Plan generation and approval
- User and agent messages
- Progress updates
- Completion or failure events
- Code changes and artifacts

Args:
  - sessionId (string, required): The session ID
  - pageSize (number, optional): Results per page (1-100, default: 20)
  - pageToken (string, optional): Token for pagination
  - response_format ('markdown' | 'json'): Output format

Returns:
  List of activities with type, description, and timestamps.
  
Examples:
  - Monitor session progress: provide sessionId
  - Get full history: paginate through all activities`,
      inputSchema: ListActivitiesInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListActivitiesInput) => {
      const client = getApiClient();

      const response = await client.get<ListActivitiesResponse>(
        `/sessions/${params.sessionId}/activities`,
        {
          pageSize: params.pageSize,
          pageToken: params.pageToken,
        }
      );

      const activities = response.activities || [];
      const hasMore = !!response.nextPageToken;

      if (params.response_format === "json") {
        const output = {
          sessionId: params.sessionId,
          activities,
          total: activities.length,
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
            text: formatActivitiesListMarkdown(
              activities,
              hasMore,
              response.nextPageToken
            ),
          },
        ],
      };
    }
  );

  // =========================================================================
  // Get Activity
  // =========================================================================
  server.registerTool(
    "jules_get_activity",
    {
      title: "Get Session Activity",
      description: `Get details of a specific activity in a Jules session.

Retrieves full details including artifacts like code changes,
bash output, or media files.

Args:
  - sessionId (string, required): The session ID
  - activityId (string, required): The activity ID
  - response_format ('markdown' | 'json'): Output format

Returns:
  Full activity details including:
  - Event type (plan generated, message, progress, etc.)
  - Artifacts (code changes, command output, media)
  - Timestamps

Examples:
  - Get plan details: activity with planGenerated
  - Get code diff: activity with changeSet artifact`,
      inputSchema: GetActivityInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: GetActivityInput) => {
      const client = getApiClient();

      const activity = await client.get<Activity>(
        `/sessions/${params.sessionId}/activities/${params.activityId}`
      );

      if (params.response_format === "json") {
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(activity, null, 2) },
          ],
        };
      }

      return {
        content: [
          { type: "text" as const, text: formatActivityMarkdown(activity) },
        ],
      };
    }
  );
}
