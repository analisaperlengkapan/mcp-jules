/**
 * Jules MCP Server Constants
 */

// API Configuration
export const JULES_API_BASE_URL = "https://jules.googleapis.com/v1alpha";
export const API_KEY_ENV_VAR = "JULES_API_KEY";

// Pagination Defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Character Limits
export const CHARACTER_LIMIT = 50000;

// Session States (for filtering)
export const ACTIVE_STATES = [
  "QUEUED",
  "PLANNING",
  "AWAITING_PLAN_APPROVAL",
  "AWAITING_USER_FEEDBACK",
  "IN_PROGRESS",
  "PAUSED",
];

export const COMPLETED_STATES = ["COMPLETED", "FAILED"];
