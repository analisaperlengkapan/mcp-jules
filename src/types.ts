
/**
 * Jules API Type Definitions
 * Based on https://jules.google/docs/api/reference/types
 */

export interface Session {
  name: string; // e.g. "sessions/1234567"
  id: string;
  prompt: string;
  title?: string;
  state: SessionState;
  url: string;
  sourceContext?: SourceContext;
  requirePlanApproval?: boolean;
  automationMode?: AutomationMode;
  outputs?: SessionOutput;
  createTime: string;
  updateTime: string;
}

export type SessionState =
  | 'STATE_UNSPECIFIED'
  | 'QUEUED'
  | 'PLANNING'
  | 'AWAITING_PLAN_APPROVAL'
  | 'AWAITING_USER_FEEDBACK'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'FAILED'
  | 'COMPLETED';

export type AutomationMode =
  | 'AUTOMATION_MODE_UNSPECIFIED'
  | 'AUTO_CREATE_PR';

export interface SourceContext {
  source: string; // e.g. "sources/github-owner-repo"
  githubRepoContext?: GitHubRepoContext;
}

export interface GitHubRepoContext {
  startingBranch: string;
}

export interface Source {
  name: string;
  id: string;
  githubRepo?: GitHubRepo;
}

export interface GitHubRepo {
  owner: string;
  repo: string;
  isPrivate: boolean;
  defaultBranch?: GitHubBranch;
  branches?: GitHubBranch[];
}

export interface GitHubBranch {
  displayName: string;
}

export interface SessionOutput {
  pullRequest?: PullRequest;
}

export interface PullRequest {
  url: string;
  number: number;
}

// Activity Types

export interface Activity {
  name: string;
  id: string;
  originator: 'user' | 'agent' | 'system';
  description: string;
  createTime: string;
  planGenerated?: PlanGenerated;
  planApproved?: PlanApproved;
  userMessaged?: UserMessaged;
  agentMessaged?: AgentMessaged;
  progressUpdated?: ProgressUpdated;
  sessionCompleted?: SessionCompleted;
  sessionFailed?: SessionFailed;
}

export interface PlanGenerated {
  plan: Plan;
}

export interface Plan {
  id: string;
  steps: PlanStep[];
  createTime: string;
}

export interface PlanStep {
  id: string;
  index: number;
  title: string;
  description: string;
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

export interface SessionCompleted {}

export interface SessionFailed {
  reason: string;
}

// API Request/Response Interfaces

export interface CreateSessionRequest {
  prompt: string;
  title?: string;
  sourceContext?: SourceContext;
  requirePlanApproval?: boolean;
  automationMode?: AutomationMode;
}

export interface ListSessionsResponse {
  sessions: Session[];
  nextPageToken?: string;
}

export interface ListSourcesResponse {
  sources: Source[];
  nextPageToken?: string;
}

export interface ListActivitiesResponse {
  activities: Activity[];
  nextPageToken?: string;
}

export interface SendMessageRequest {
  prompt: string;
}

export interface CreateSessionResponse extends Session {}
export interface SendMessageResponse {}
export interface ApprovePlanResponse {}

export interface JulesError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}
