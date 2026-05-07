/**
 * Formatters Service
 * Handles formatting of Jules API responses to markdown and JSON
 */

import { CHARACTER_LIMIT } from "../constants.js";
import type {
  Session,
  Activity,
  Source,
  Plan,
  Artifact,
  SessionState,
} from "../types.js";

/**
 * Format a session to markdown
 */
export function formatSessionMarkdown(session: Session): string {
  const lines: string[] = [];

  lines.push(`## Session: ${session.title || session.id}`);
  lines.push("");
  lines.push(`**ID:** ${session.id}`);
  lines.push(`**State:** ${formatState(session.state)}`);
  lines.push(`**Prompt:** ${session.prompt}`);
  lines.push(`**URL:** ${session.url}`);
  lines.push("");
  lines.push(`**Created:** ${formatDateTime(session.createTime)}`);
  lines.push(`**Updated:** ${formatDateTime(session.updateTime)}`);

  if (session.sourceContext) {
    lines.push("");
    lines.push(`**Source:** ${session.sourceContext.source}`);
    if (session.sourceContext.githubRepoContext?.startingBranch) {
      lines.push(
        `**Branch:** ${session.sourceContext.githubRepoContext.startingBranch}`
      );
    }
  }

  if (session.outputs && session.outputs.length > 0) {
    lines.push("");
    lines.push("### Outputs");
    for (const output of session.outputs) {
      if (output.pullRequest) {
        lines.push("");
        lines.push(
          `**Pull Request:** [${output.pullRequest.title}](${output.pullRequest.url})`
        );
        if (output.pullRequest.description) {
          lines.push(`> ${output.pullRequest.description}`);
        }
      }
    }
  }

  return lines.join("\n");
}

/**
 * Format a list of sessions to markdown
 */
export function formatSessionsListMarkdown(
  sessions: Session[],
  total: number,
  hasMore: boolean,
  nextPageToken?: string
): string {
  const lines: string[] = [];

  lines.push(`# Sessions (${sessions.length} of ${total})`);
  lines.push("");

  if (sessions.length === 0) {
    lines.push("*No sessions found*");
    return lines.join("\n");
  }

  for (const session of sessions) {
    const stateEmoji = getStateEmoji(session.state);
    lines.push(
      `${stateEmoji} **${session.title || session.id}** - ${session.state}`
    );
    lines.push(
      `   ID: \`${session.id}\` | Created: ${formatDateTime(session.createTime)}`
    );
    lines.push("");
  }

  if (hasMore && nextPageToken) {
    lines.push("---");
    lines.push(`*More results available. Use pageToken: \`${nextPageToken}\`*`);
  }

  return lines.join("\n");
}

/**
 * Format an activity to markdown
 */
export function formatActivityMarkdown(activity: Activity): string {
  const lines: string[] = [];

  lines.push(`## Activity: ${activity.id}`);
  lines.push("");
  lines.push(`**Originator:** ${activity.originator}`);
  lines.push(`**Description:** ${activity.description}`);
  lines.push(`**Created:** ${formatDateTime(activity.createTime)}`);

  // Format event-specific content
  if (activity.planGenerated) {
    lines.push("");
    lines.push("### Plan Generated");
    lines.push(formatPlanMarkdown(activity.planGenerated.plan));
  }

  if (activity.planApproved) {
    lines.push("");
    lines.push(`### Plan Approved`);
    lines.push(`Plan ID: ${activity.planApproved.planId}`);
  }

  if (activity.userMessaged) {
    lines.push("");
    lines.push("### User Message");
    lines.push(`> ${activity.userMessaged.userMessage}`);
  }

  if (activity.agentMessaged) {
    lines.push("");
    lines.push("### Agent Message");
    lines.push(`> ${activity.agentMessaged.agentMessage}`);
  }

  if (activity.progressUpdated) {
    lines.push("");
    lines.push("### Progress Update");
    lines.push(`**${activity.progressUpdated.title}**`);
    lines.push(activity.progressUpdated.description);
  }

  if (activity.sessionCompleted) {
    lines.push("");
    lines.push("### ✅ Session Completed");
  }

  if (activity.sessionFailed) {
    lines.push("");
    lines.push("### ❌ Session Failed");
    lines.push(`Reason: ${activity.sessionFailed.reason}`);
  }

  // Format artifacts
  if (activity.artifacts && activity.artifacts.length > 0) {
    lines.push("");
    lines.push("### Artifacts");
    for (const artifact of activity.artifacts) {
      lines.push(formatArtifactMarkdown(artifact));
    }
  }

  return lines.join("\n");
}

/**
 * Format a list of activities to markdown
 */
export function formatActivitiesListMarkdown(
  activities: Activity[],
  hasMore: boolean,
  nextPageToken?: string
): string {
  const lines: string[] = [];

  lines.push(`# Activities (${activities.length})`);
  lines.push("");

  if (activities.length === 0) {
    lines.push("*No activities found*");
    return lines.join("\n");
  }

  for (const activity of activities) {
    const emoji = getActivityEmoji(activity);
    lines.push(`${emoji} **${activity.description}** (${activity.originator})`);
    lines.push(
      `   ID: \`${activity.id}\` | ${formatDateTime(activity.createTime)}`
    );
    lines.push("");
  }

  if (hasMore && nextPageToken) {
    lines.push("---");
    lines.push(`*More results available. Use pageToken: \`${nextPageToken}\`*`);
  }

  return lines.join("\n");
}

/**
 * Format a source to markdown
 */
export function formatSourceMarkdown(source: Source): string {
  const lines: string[] = [];

  lines.push(`## Source: ${source.id}`);
  lines.push("");
  lines.push(`**Name:** ${source.name}`);

  if (source.githubRepo) {
    const repo = source.githubRepo;
    lines.push("");
    lines.push("### GitHub Repository");
    lines.push(`**Owner:** ${repo.owner}`);
    lines.push(`**Repo:** ${repo.repo}`);
    lines.push(`**Private:** ${repo.isPrivate ? "Yes" : "No"}`);
    lines.push(`**Default Branch:** ${repo.defaultBranch.displayName}`);

    if (repo.branches && repo.branches.length > 0) {
      lines.push("");
      lines.push("**Branches:**");
      for (const branch of repo.branches) {
        const isDefault = branch.displayName === repo.defaultBranch.displayName;
        lines.push(`- ${branch.displayName}${isDefault ? " (default)" : ""}`);
      }
    }
  }

  return lines.join("\n");
}

/**
 * Format a list of sources to markdown
 */
export function formatSourcesListMarkdown(
  sources: Source[],
  hasMore: boolean,
  nextPageToken?: string
): string {
  const lines: string[] = [];

  lines.push(`# Sources (${sources.length})`);
  lines.push("");

  if (sources.length === 0) {
    lines.push("*No sources found*");
    return lines.join("\n");
  }

  for (const source of sources) {
    if (source.githubRepo) {
      const repo = source.githubRepo;
      const visibility = repo.isPrivate ? "🔒" : "🌐";
      lines.push(`${visibility} **${repo.owner}/${repo.repo}**`);
      lines.push(
        `   Name: \`${source.name}\` | Default: ${repo.defaultBranch.displayName}`
      );
    } else {
      lines.push(`📁 **${source.id}**`);
      lines.push(`   Name: \`${source.name}\``);
    }
    lines.push("");
  }

  if (hasMore && nextPageToken) {
    lines.push("---");
    lines.push(`*More results available. Use pageToken: \`${nextPageToken}\`*`);
  }

  return lines.join("\n");
}

/**
 * Format a plan to markdown
 */
function formatPlanMarkdown(plan: Plan): string {
  const lines: string[] = [];

  lines.push(`**Plan ID:** ${plan.id}`);
  lines.push(`**Created:** ${formatDateTime(plan.createTime)}`);
  lines.push("");
  lines.push("**Steps:**");

  for (const step of plan.steps) {
    lines.push(`${step.index + 1}. **${step.title}**`);
    lines.push(`   ${step.description}`);
  }

  return lines.join("\n");
}

/**
 * Format an artifact to markdown
 */
function formatArtifactMarkdown(artifact: Artifact): string {
  const lines: string[] = [];

  if (artifact.changeSet) {
    lines.push("");
    lines.push("#### Code Changes");
    lines.push(`Source: ${artifact.changeSet.source}`);
    if (artifact.changeSet.gitPatch) {
      const patch = artifact.changeSet.gitPatch;
      lines.push(`Base Commit: ${patch.baseCommitId}`);
      lines.push(`Commit Message: ${patch.suggestedCommitMessage}`);
      lines.push("");
      lines.push("```diff");
      // Truncate patch if too long
      const patchContent = truncateContent(patch.unidiffPatch, 5000);
      lines.push(patchContent);
      lines.push("```");
    }
  }

  if (artifact.bashOutput) {
    lines.push("");
    lines.push("#### Bash Output");
    lines.push(`Command: \`${artifact.bashOutput.command}\``);
    lines.push(`Exit Code: ${artifact.bashOutput.exitCode}`);
    lines.push("");
    lines.push("```");
    const output = truncateContent(artifact.bashOutput.output, 2000);
    lines.push(output);
    lines.push("```");
  }

  if (artifact.media) {
    lines.push("");
    lines.push("#### Media");
    lines.push(`Type: ${artifact.media.mimeType}`);
    lines.push(`*[Base64 data omitted]*`);
  }

  return lines.join("\n");
}

/**
 * Format session state with emoji
 */
function formatState(state: SessionState): string {
  return `${getStateEmoji(state)} ${state}`;
}

/**
 * Get emoji for session state
 */
function getStateEmoji(state: SessionState | string): string {
  const emojis: Record<string, string> = {
    QUEUED: "⏳",
    PLANNING: "🔍",
    AWAITING_PLAN_APPROVAL: "⏸️",
    AWAITING_USER_FEEDBACK: "💬",
    IN_PROGRESS: "🚀",
    PAUSED: "⏸️",
    COMPLETED: "✅",
    FAILED: "❌",
    STATE_UNSPECIFIED: "❓",
  };
  return emojis[state] || "❓";
}

/**
 * Get emoji for activity type
 */
function getActivityEmoji(activity: Activity): string {
  if (activity.planGenerated) return "📋";
  if (activity.planApproved) return "✓";
  if (activity.userMessaged) return "👤";
  if (activity.agentMessaged) return "🤖";
  if (activity.progressUpdated) return "📈";
  if (activity.sessionCompleted) return "✅";
  if (activity.sessionFailed) return "❌";
  return "📌";
}

/**
 * Format datetime string to human-readable format
 */
function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

/**
 * Truncate content if it exceeds the limit
 */
export function truncateContent(
  content: string,
  limit: number = CHARACTER_LIMIT
): string {
  if (content.length <= limit) {
    return content;
  }
  return content.substring(0, limit) + "\n... [truncated]";
}
