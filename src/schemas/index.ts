/**
 * Zod Schemas for Jules MCP Server
 * Input validation for all tools
 */

import { z } from "zod";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants.js";

// ============================================================================
// Common Schemas
// ============================================================================

export const ResponseFormatSchema = z
  .enum(["markdown", "json"])
  .default("markdown")
  .describe(
    "Output format: 'markdown' for human-readable or 'json' for structured data"
  );

export const PageSizeSchema = z
  .number()
  .int()
  .min(1)
  .max(MAX_PAGE_SIZE)
  .default(DEFAULT_PAGE_SIZE)
  .describe(`Number of results to return (1-${MAX_PAGE_SIZE})`);

export const PageTokenSchema = z
  .string()
  .optional()
  .describe("Page token from previous response for pagination");

// ============================================================================
// Session Schemas
// ============================================================================

export const GitHubRepoContextSchema = z
  .object({
    startingBranch: z
      .string()
      .min(1)
      .describe(
        "The branch to start the session from (e.g., 'main', 'develop')"
      ),
  })
  .strict();

export const SourceContextSchema = z
  .object({
    source: z
      .string()
      .min(1)
      .describe("The source resource name (e.g., 'sources/github-owner-repo')"),
    githubRepoContext: GitHubRepoContextSchema.optional().describe(
      "Context for GitHub repositories"
    ),
  })
  .strict();

export const AutomationModeSchema = z
  .enum(["AUTOMATION_MODE_UNSPECIFIED", "AUTO_CREATE_PR"])
  .optional()
  .describe("Automation mode: 'AUTO_CREATE_PR' to auto-create PRs when ready");

// Create Session Input
export const CreateSessionInputSchema = z
  .object({
    prompt: z
      .string()
      .min(1)
      .max(10000)
      .describe("The task description for Jules to execute"),
    title: z
      .string()
      .max(200)
      .optional()
      .describe("Optional title for the session"),
    sourceContext: SourceContextSchema.describe(
      "The source repository and branch context"
    ),
    requirePlanApproval: z
      .boolean()
      .optional()
      .describe("If true, plans require explicit approval before execution"),
    automationMode: AutomationModeSchema,
    response_format: ResponseFormatSchema,
  })
  .strict();

export type CreateSessionInput = z.infer<typeof CreateSessionInputSchema>;

// List Sessions Input
export const ListSessionsInputSchema = z
  .object({
    pageSize: PageSizeSchema,
    pageToken: PageTokenSchema,
    response_format: ResponseFormatSchema,
  })
  .strict();

export type ListSessionsInput = z.infer<typeof ListSessionsInputSchema>;

// Get Session Input
export const GetSessionInputSchema = z
  .object({
    sessionId: z.string().min(1).describe("The session ID (e.g., '1234567')"),
    response_format: ResponseFormatSchema,
  })
  .strict();

export type GetSessionInput = z.infer<typeof GetSessionInputSchema>;

// Delete Session Input
export const DeleteSessionInputSchema = z
  .object({
    sessionId: z.string().min(1).describe("The session ID to delete"),
  })
  .strict();

export type DeleteSessionInput = z.infer<typeof DeleteSessionInputSchema>;

// Send Message Input
export const SendMessageInputSchema = z
  .object({
    sessionId: z
      .string()
      .min(1)
      .describe("The session ID to send the message to"),
    prompt: z
      .string()
      .min(1)
      .max(10000)
      .describe("The message to send to the session"),
  })
  .strict();

export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;

// Approve Plan Input
export const ApprovePlanInputSchema = z
  .object({
    sessionId: z
      .string()
      .min(1)
      .describe("The session ID with the plan to approve"),
  })
  .strict();

export type ApprovePlanInput = z.infer<typeof ApprovePlanInputSchema>;

// ============================================================================
// Activity Schemas
// ============================================================================

// List Activities Input
export const ListActivitiesInputSchema = z
  .object({
    sessionId: z
      .string()
      .min(1)
      .describe("The session ID to list activities for"),
    pageSize: PageSizeSchema,
    pageToken: PageTokenSchema,
    response_format: ResponseFormatSchema,
  })
  .strict();

export type ListActivitiesInput = z.infer<typeof ListActivitiesInputSchema>;

// Get Activity Input
export const GetActivityInputSchema = z
  .object({
    sessionId: z.string().min(1).describe("The session ID"),
    activityId: z.string().min(1).describe("The activity ID"),
    response_format: ResponseFormatSchema,
  })
  .strict();

export type GetActivityInput = z.infer<typeof GetActivityInputSchema>;

// ============================================================================
// Source Schemas
// ============================================================================

// List Sources Input
export const ListSourcesInputSchema = z
  .object({
    pageSize: PageSizeSchema,
    pageToken: PageTokenSchema,
    filter: z
      .string()
      .optional()
      .describe("Filter expression (e.g., 'name=sources/github-owner-repo')"),
    response_format: ResponseFormatSchema,
  })
  .strict();

export type ListSourcesInput = z.infer<typeof ListSourcesInputSchema>;

// Get Source Input
export const GetSourceInputSchema = z
  .object({
    sourceId: z
      .string()
      .min(1)
      .describe("The source ID (e.g., 'github-owner-repo')"),
    response_format: ResponseFormatSchema,
  })
  .strict();

export type GetSourceInput = z.infer<typeof GetSourceInputSchema>;
