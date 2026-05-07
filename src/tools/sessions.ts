/**
 * Sessions Tools
 * MCP tools for managing Jules coding sessions
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getApiClient } from "../services/api-client.js";
import {
  formatSessionMarkdown,
  formatSessionsListMarkdown,
} from "../services/formatters.js";
import {
  CreateSessionInputSchema,
  ListSessionsInputSchema,
  GetSessionInputSchema,
  DeleteSessionInputSchema,
  SendMessageInputSchema,
  ApprovePlanInputSchema,
  type CreateSessionInput,
  type ListSessionsInput,
  type GetSessionInput,
  type DeleteSessionInput,
  type SendMessageInput,
  type ApprovePlanInput,
} from "../schemas/index.js";
import type {
  Session,
  ListSessionsResponse,
  SendMessageResponse,
  ApprovePlanResponse,
} from "../types.js";

export function registerSessionsTools(server: McpServer): void {
  // =========================================================================
  // Create Session
  // =========================================================================
  server.registerTool(
    "jules_create_session",
    {
      title: "Create Jules Session",
      description: `Create a new coding session with Jules AI coding agent.

A session represents a unit of work where Jules executes a coding task on your repository.

Args:
  - prompt (string, required): The task description for Jules to execute
  - title (string, optional): Title for the session
  - sourceContext (object, required): Repository context with:
    - source (string): Resource name like 'sources/github-owner-repo'
    - githubRepoContext (object, optional): { startingBranch: string }
  - requirePlanApproval (boolean, optional): If true, plans need approval
  - automationMode (string, optional): 'AUTO_CREATE_PR' to auto-create PRs
  - response_format ('markdown' | 'json'): Output format

Returns:
  The created session with ID, state, and URL.

Examples:
  - "Add unit tests for auth module" with source "sources/github-myorg-myrepo"
  - Set requirePlanApproval=true to review plans before execution`,
      inputSchema: CreateSessionInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: CreateSessionInput) => {
      const client = getApiClient();

      const requestBody = {
        prompt: params.prompt,
        ...(params.title && { title: params.title }),
        sourceContext: params.sourceContext,
        ...(params.requirePlanApproval !== undefined && {
          requirePlanApproval: params.requirePlanApproval,
        }),
        ...(params.automationMode && { automationMode: params.automationMode }),
      };

      const session = await client.post<Session>("/sessions", requestBody);

      if (params.response_format === "json") {
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(session, null, 2) },
          ],
        };
      }

      return {
        content: [
          { type: "text" as const, text: formatSessionMarkdown(session) },
        ],
      };
    }
  );

  // =========================================================================
  // List Sessions
  // =========================================================================
  server.registerTool(
    "jules_list_sessions",
    {
      title: "List Jules Sessions",
      description: `List all coding sessions for the authenticated user.

Args:
  - pageSize (number, optional): Results per page (1-100, default: 20)
  - pageToken (string, optional): Token for pagination
  - response_format ('markdown' | 'json'): Output format

Returns:
  List of sessions with ID, title, state, and timestamps.
  Includes nextPageToken if more results exist.

Examples:
  - List recent sessions: no params needed
  - Paginate: use pageToken from previous response`,
      inputSchema: ListSessionsInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListSessionsInput) => {
      const client = getApiClient();

      const response = await client.get<ListSessionsResponse>("/sessions", {
        pageSize: params.pageSize,
        pageToken: params.pageToken,
      });

      const sessions = response.sessions || [];
      const total = sessions.length;
      const hasMore = !!response.nextPageToken;

      if (params.response_format === "json") {
        const output = {
          sessions,
          total,
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
            text: formatSessionsListMarkdown(
              sessions,
              total,
              hasMore,
              response.nextPageToken
            ),
          },
        ],
      };
    }
  );

  // =========================================================================
  // Get Session
  // =========================================================================
  server.registerTool(
    "jules_get_session",
    {
      title: "Get Jules Session",
      description: `Get details of a specific coding session.

Args:
  - sessionId (string, required): The session ID
  - response_format ('markdown' | 'json'): Output format

Returns:
  Full session details including:
  - State and progress
  - Source context
  - Outputs (pull requests if completed)

Examples:
  - Get session details: sessionId="1234567"`,
      inputSchema: GetSessionInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: GetSessionInput) => {
      const client = getApiClient();

      const session = await client.get<Session>(
        `/sessions/${params.sessionId}`
      );

      if (params.response_format === "json") {
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(session, null, 2) },
          ],
        };
      }

      return {
        content: [
          { type: "text" as const, text: formatSessionMarkdown(session) },
        ],
      };
    }
  );

  // =========================================================================
  // Delete Session
  // =========================================================================
  server.registerTool(
    "jules_delete_session",
    {
      title: "Delete Jules Session",
      description: `Delete a coding session.

Args:
  - sessionId (string, required): The session ID to delete

Returns:
  Confirmation of deletion.

Note: This action cannot be undone.`,
      inputSchema: DeleteSessionInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: DeleteSessionInput) => {
      const client = getApiClient();

      await client.delete(`/sessions/${params.sessionId}`);

      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Session ${params.sessionId} deleted successfully.`,
          },
        ],
      };
    }
  );

  // =========================================================================
  // Send Message
  // =========================================================================
  server.registerTool(
    "jules_send_message",
    {
      title: "Send Message to Jules Session",
      description: `Send a message to an active Jules session.

Use this to provide feedback, answer questions, or give additional 
instructions while Jules is working on a task.

Args:
  - sessionId (string, required): The session ID
  - prompt (string, required): The message to send

Returns:
  Confirmation that the message was sent.

Examples:
  - "Please also add integration tests"
  - "Use TypeScript instead of JavaScript"
  - Answer a clarifying question from Jules`,
      inputSchema: SendMessageInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: SendMessageInput) => {
      const client = getApiClient();

      await client.post<SendMessageResponse>(
        `/sessions/${params.sessionId}:sendMessage`,
        { prompt: params.prompt }
      );

      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Message sent to session ${params.sessionId}.\n\nMessage: "${params.prompt}"`,
          },
        ],
      };
    }
  );

  // =========================================================================
  // Approve Plan
  // =========================================================================
  server.registerTool(
    "jules_approve_plan",
    {
      title: "Approve Jules Session Plan",
      description: `Approve a pending plan in a Jules session.

Only needed when the session was created with requirePlanApproval=true.
After approval, Jules will execute the planned steps.

Args:
  - sessionId (string, required): The session ID with pending plan

Returns:
  Confirmation that the plan was approved.

Note: Check session state is 'AWAITING_PLAN_APPROVAL' before calling.`,
      inputSchema: ApprovePlanInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ApprovePlanInput) => {
      const client = getApiClient();

      await client.post<ApprovePlanResponse>(
        `/sessions/${params.sessionId}:approvePlan`,
        {}
      );

      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Plan approved for session ${params.sessionId}.\n\nJules will now execute the planned steps.`,
          },
        ],
      };
    }
  );
}
