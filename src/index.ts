
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { JulesClient } from "./jules-client.js";
import { getCurrentGitContext } from "./utils.js";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.JULES_API_KEY;

if (!API_KEY) {
  console.error("Error: JULES_API_KEY environment variable is required.");
  process.exit(1);
}

const client = new JulesClient(API_KEY);

const server = new McpServer({
  name: "jules-mcp-server",
  version: "1.0.0",
});

// Helper to format activity for display
function formatActivity(activity: any): string {
    const parts = [`[${activity.createTime}] ${activity.description} (${activity.originator})`];
    if (activity.planGenerated) parts.push(`Plan Generated: ${activity.planGenerated.plan.id}`);
    if (activity.agentMessaged) parts.push(`Agent: ${activity.agentMessaged.agentMessage}`);
    if (activity.userMessaged) parts.push(`User: ${activity.userMessaged.userMessage}`);
    if (activity.sessionFailed) parts.push(`FAILED: ${activity.sessionFailed.reason}`);
    return parts.join(' - ');
}

server.tool(
  "jules_create_session",
  "Delegate a coding task to Jules. Starts a new session.",
  {
    prompt: z.string().describe("The task description for Jules."),
    title: z.string().optional().describe("Optional title for the session."),
    include_current_branch: z.boolean().optional().describe("If true, tries to attach the current git repo/branch context."),
    source_repo: z.string().optional().describe("Explicit Source Repo Name (e.g. sources/github-owner-repo). Overrides include_current_branch."),
    starting_branch: z.string().optional().describe("Branch to start from (defaults to main if not specified)."),
    require_plan_approval: z.boolean().optional().describe("If true, plans require approval before execution."),
    automation_mode: z.enum(['AUTO_CREATE_PR']).optional().describe("Set automation mode (e.g. AUTO_CREATE_PR).")
  },
  async ({ prompt, title, include_current_branch, source_repo, starting_branch, require_plan_approval, automation_mode }) => {
    let sourceContext;
    
    // Explicit source takes precedence
    if (source_repo) {
        sourceContext = {
            source: source_repo,
            githubRepoContext: {
                startingBranch: starting_branch || 'main'
            }
        };
    } else if (include_current_branch) {
      const gitInfo = await getCurrentGitContext();
      if (gitInfo) {
        sourceContext = {
          source: `sources/github-${gitInfo.owner}-${gitInfo.repo}`,
          githubRepoContext: {
            startingBranch: gitInfo.branch
          }
        };
      }
    }

    try {
      const session = await client.createSession({
        prompt,
        title,
        sourceContext,
        requirePlanApproval: require_plan_approval,
        automationMode: automation_mode === 'AUTO_CREATE_PR' ? 'AUTO_CREATE_PR' : undefined
      });
      return {
        content: [{
          type: "text",
          text: `Session Created!\nID: ${session.id}\nName: ${session.name}\nState: ${session.state}\nURL: ${session.url}`
        }]
      };
    } catch (err) {
       return {
         isError: true,
         content: [{ type: "text", text: `Failed to create session: ${(err as Error).message}` }]
       };
    }
  }
);

server.tool(
  "jules_list_sessions",
  "List recent Jules sessions to check their status.",
  {
    limit: z.number().optional().default(10).describe("Number of sessions to return.")
  },
  async ({ limit }) => {
    try {
        const response = await client.listSessions(limit);
        const sessions = response.sessions || [];
        const text = sessions.map(s => `- [${s.state}] ${s.title || s.name} (ID: ${s.id})`).join('\n');
        return {
            content: [{ type: "text", text: `Sessions:\n${text}` }]
        };
    } catch (err) {
        return { isError: true, content: [{ type: "text", text: `Error: ${(err as Error).message}` }] };
    }
  }
);

server.tool(
  "jules_get_session",
  "Get details of a specific Jules session.",
  {
    session_id: z.string().describe("The Session ID or Resource Name.")
  },
  async ({ session_id }) => {
      try {
          const session = await client.getSession(session_id);
          return {
              content: [{
                  type: "text",
                  text: JSON.stringify(session, null, 2)
              }]
          };
      } catch (err) {
          return { isError: true, content: [{ type: "text", text: `Error: ${(err as Error).message}` }] };
      }
  }
);

server.tool(
    "jules_list_activities",
    "List activities (events) for a session to review progress.",
    {
        session_id: z.string().describe("The Session ID."),
        limit: z.number().optional().default(20)
    },
    async ({ session_id, limit }) => {
        try {
            const response = await client.listActivities(session_id, limit);
            const activities = response.activities || [];
            const text = activities.map(formatActivity).join('\n');
            return {
                content: [{ type: "text", text: `Activities for ${session_id}:\n${text}` }]
            };
        } catch (err) {
            return { isError: true, content: [{ type: "text", text: `Error: ${(err as Error).message}` }] };
        }
    }
);

server.tool(
    "jules_get_activity",
    "Get details of a specific activity.",
    {
        session_id: z.string().describe("The Session ID."),
        activity_id: z.string().describe("The Activity ID.")
    },
    async ({ session_id, activity_id }) => {
        try {
            const activity = await client.getActivity(session_id, activity_id);
            return {
                content: [{ type: "text", text: JSON.stringify(activity, null, 2) }]
            };
        } catch (err) {
            return { isError: true, content: [{ type: "text", text: `Error: ${(err as Error).message}` }] };
        }
    }
);

server.tool(
    "jules_send_message",
    "Send a message to the session (intervention or feedback).",
    {
        session_id: z.string().describe("The Session ID."),
        message: z.string().describe("The message content.")
    },
    async ({ session_id, message }) => {
        try {
            await client.sendMessage(session_id, message);
            return {
                content: [{ type: "text", text: `Message sent to ${session_id}.` }]
            };
        } catch (err) {
            return { isError: true, content: [{ type: "text", text: `Error: ${(err as Error).message}` }] };
        }
    }
);

server.tool(
    "jules_approve_plan",
    "Approve a plan that is awaiting approval.",
    {
        session_id: z.string().describe("The Session ID.")
    },
    async ({ session_id }) => {
        try {
            await client.approvePlan(session_id);
            return {
                content: [{ type: "text", text: `Plan approved for ${session_id}.` }]
            };
        } catch (err) {
            return { isError: true, content: [{ type: "text", text: `Error: ${(err as Error).message}` }] };
        }
    }
);

server.tool(
    "jules_delete_session",
    "Delete a session.",
    {
        session_id: z.string().describe("The Session ID.")
    },
    async ({ session_id }) => {
        try {
            await client.deleteSession(session_id);
            return {
                content: [{ type: "text", text: `Session ${session_id} deleted.` }]
            };
        } catch (err) {
             return { isError: true, content: [{ type: "text", text: `Error: ${(err as Error).message}` }] };
        }
    }
);

server.tool(
    "jules_list_sources",
    "List connected source repositories.",
    {
        limit: z.number().optional().default(10),
        filter: z.string().optional().describe("Filter expression (e.g. name=sources/foo)")
    },
    async ({ limit, filter }) => {
        try {
            const response = await client.listSources(limit, undefined, filter);
            const sources = response.sources || [];
            const text = sources.map(s => `- [${s.id}] ${s.name} (Repo: ${s.githubRepo?.owner}/${s.githubRepo?.repo})`).join('\n');
            return {
                content: [{ type: "text", text: `Sources:\n${text}` }]
            };
        } catch (err) {
             return { isError: true, content: [{ type: "text", text: `Error: ${(err as Error).message}` }] };
        }
    }
);

server.tool(
    "jules_get_source",
    "Get details of a specific source.",
    {
        source_id: z.string().describe("The Source ID.")
    },
    async ({ source_id }) => {
        try {
            const source = await client.getSource(source_id);
             return {
                content: [{ type: "text", text: JSON.stringify(source, null, 2) }]
            };
        } catch (err) {
             return { isError: true, content: [{ type: "text", text: `Error: ${(err as Error).message}` }] };
        }
    }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
