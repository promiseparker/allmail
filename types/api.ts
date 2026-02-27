// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  total?: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}

// ============================================================
// PLAN LIMITS
// ============================================================

export type Plan = "free" | "pro" | "enterprise";

export const PLAN_LIMITS = {
  free: {
    connectedAccounts: 2,
    syncIntervalMinutes: 15,
    conflictLookbackDays: 1,
    analyticsEnabled: false,
    smartSchedulingEnabled: false,
    mirrorCalendarEnabled: false,
    burnoutDetectionEnabled: false,
  },
  pro: {
    connectedAccounts: Infinity,
    syncIntervalMinutes: 5,
    conflictLookbackDays: 90,
    analyticsEnabled: true,
    smartSchedulingEnabled: true,
    mirrorCalendarEnabled: true,
    burnoutDetectionEnabled: true,
  },
  enterprise: {
    connectedAccounts: Infinity,
    syncIntervalMinutes: 1,
    conflictLookbackDays: 365,
    analyticsEnabled: true,
    smartSchedulingEnabled: true,
    mirrorCalendarEnabled: true,
    burnoutDetectionEnabled: true,
  },
} as const satisfies Record<Plan, PlanLimits>;

export interface PlanLimits {
  connectedAccounts: number;
  syncIntervalMinutes: number;
  conflictLookbackDays: number;
  analyticsEnabled: boolean;
  smartSchedulingEnabled: boolean;
  mirrorCalendarEnabled: boolean;
  burnoutDetectionEnabled: boolean;
}

// ============================================================
// ERROR CODES
// ============================================================

export const ERROR_CODES = {
  UNAUTHORIZED: "unauthorized",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "not_found",
  PLAN_LIMIT_REACHED: "plan_limit_reached",
  PROVIDER_ERROR: "provider_error",
  TOKEN_EXPIRED: "token_expired",
  TOKEN_REVOKED: "token_revoked",
  SYNC_IN_PROGRESS: "sync_in_progress",
  RATE_LIMITED: "rate_limited",
  VALIDATION_ERROR: "validation_error",
  INTERNAL_ERROR: "internal_error",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
