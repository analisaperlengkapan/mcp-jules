/**
 * Jules API Type Definitions
 * Based on https://jules.google/docs/api/reference/types
 */

// ============================================================================
// Enums
// ============================================================================

export enum SessionState {
  STATE_UNSPECIFIED = "STATE_UNSPECIFIED",
  QUEUED = "QUEUED",
  PLANNING = "PLANNING",
  AWAITING_PLAN_APPROVAL = "AWAITING_PLAN_APPROVAL",
  AWAITING_USER_FEEDBACK = "AWAITING_USER_FEEDBACK",
  IN_PROGRESS = "IN_PROGRESS",
  PAUSED = "PAUSED",
  FAILED = "FAILED",
  COMPLETED = "COMPLETED",
}

export enum AutomationMode {
  AUTOMATION_MODE_UNSPECIFIED = "AUTOMATION_MODE_UNSPECIFIED",
  AUTO_CREATE_PR = "AUTO_CREATE_PR",
}

export enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json",
}

// ============================================================================
// GitHub Types
// ============================================================================

export interface GitHubBranch {
  displayName: string;
}

export interface GitHubRepo {
  owner: string;
  repo: string;
  isPrivate: boolean;
  defaultBranch: GitHubBranch;
  branches: GitHubBranch[];
}

export interface GitHubRepoContext {
  startingBranch: string;
}

// ============================================================================
// Source Types
// ============================================================================

export interface Source {
  name: string;
  id: string;
  githubRepo?: GitHubRepo;
}

export interface SourceContext {
  source: string;
  githubRepoContext?: GitHubRepoContext;
}

// ============================================================================
// Plan Types
// ============================================================================

export interface PlanStep {
  id: string;
  index: number;
  title: string;
  description: string;
}

export interface Plan {
  id: string;
  steps: PlanStep[];
  createTime: string;
}

// ============================================================================
// Artifact Types
// ============================================================================

export interface GitPatch {
  baseCommitId: string;
  unidiffPatch: string;
  suggestedCommitMessage: string;
}

export interface ChangeSet {
  source: string;
  gitPatch: GitPatch;
}

export interface BashOutput {
  command: string;
  output: string;
  exitCode: number;
}

export interface Media {
  mimeType: string;
  data: string;
}

export interface Artifact {
  changeSet?: ChangeSet;
  bashOutput?: BashOutput;
  media?: Media;
}

// ============================================================================
// Activity Event Types
// ============================================================================

export interface PlanGenerated {
  plan: Plan;
}

export interface PlanApproved {
  planId: string;
}

export interface UserMessaged {
  userMessage: string;
}

export interface AgentMessaged {
  agentMessage: string;
}

export interface ProgressUpdated {
  title: string;
  description: string;
}

export type SessionCompleted = Record<string, never>;

export interface SessionFailed {
  reason: string;
}

// ============================================================================
// Activity Type
// ============================================================================

export interface Activity {
  name: string;
  id: string;
  originator: "user" | "agent" | "system";
  description: string;
  createTime: string;
  artifacts?: Artifact[];
  planGenerated?: PlanGenerated;
  planApproved?: PlanApproved;
  userMessaged?: UserMessaged;
  agentMessaged?: AgentMessaged;
  progressUpdated?: ProgressUpdated;
  sessionCompleted?: SessionCompleted;
  sessionFailed?: SessionFailed;
}

// ============================================================================
// Output Types
// ============================================================================

export interface PullRequest {
  url: string;
  title: string;
  description: string;
}

export interface SessionOutput {
  pullRequest?: PullRequest;
}

// ============================================================================
// Session Type
// ============================================================================

export interface Session {
  name: string;
  id: string;
  prompt: string;
  title?: string;
  state: SessionState;
  url: string;
  sourceContext?: SourceContext;
  requirePlanApproval?: boolean;
  automationMode?: AutomationMode;
  outputs?: SessionOutput[];
  createTime: string;
  updateTime: string;
}

// ============================================================================
// Request Types
// ============================================================================

export interface CreateSessionRequest {
  prompt: string;
  title?: string;
  sourceContext: SourceContext;
  requirePlanApproval?: boolean;
  automationMode?: AutomationMode;
}

export interface SendMessageRequest {
  prompt: string;
}

export type ApprovePlanRequest = Record<string, never>;

// ============================================================================
// Response Types
// ============================================================================

export interface ListSessionsResponse {
  sessions: Session[];
  nextPageToken?: string;
}

export interface ListActivitiesResponse {
  activities: Activity[];
  nextPageToken?: string;
}

export interface ListSourcesResponse {
  sources: Source[];
  nextPageToken?: string;
}

export type SendMessageResponse = Record<string, never>;

export type ApprovePlanResponse = Record<string, never>;

// ============================================================================
// API Error Types
// ============================================================================

export interface ApiError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}
