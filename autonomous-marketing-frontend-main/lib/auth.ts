const ACCESS_TOKEN_KEY = "marketing_system_access_token";
const TOKEN_TYPE_KEY = "marketing_system_token_type";
const TENANT_ID_KEY = "marketing_system_tenant_id";
const BUSINESS_ACCOUNT_ID_KEY =
  "marketing_system_business_account_id";

/**
 * Save authentication credentials.
 *
 * If the token belongs to a different login session, the previous
 * tenant/business context is removed first.
 *
 * This prevents User B from inheriting User A's workspace.
 */
export function saveAuthToken(
  accessToken: string,
  tokenType: string = "bearer",
): void {
  if (typeof window === "undefined") {
    return;
  }

  const previousToken = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (previousToken && previousToken !== accessToken) {
    clearTenantContext();
  }

  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    accessToken,
  );

  localStorage.setItem(
    TOKEN_TYPE_KEY,
    tokenType,
  );
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(
    ACCESS_TOKEN_KEY,
  );
}

export function getTokenType(): string {
  if (typeof window === "undefined") {
    return "bearer";
  }

  return (
    localStorage.getItem(
      TOKEN_TYPE_KEY,
    ) || "bearer"
  );
}

export function getAuthorizationHeader(): string | null {
  const token = getAuthToken();

  if (!token) {
    return null;
  }

  return `${getTokenType()} ${token}`;
}

/**
 * Save the currently selected tenant/workspace.
 */
export function saveTenantContext(
  tenantId: string,
  businessAccountId: number,
): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!tenantId) {
    throw new Error("Tenant ID is required.");
  }

  if (
    !Number.isInteger(businessAccountId) ||
    businessAccountId <= 0
  ) {
    throw new Error("A valid business account ID is required.");
  }

  localStorage.setItem(
    TENANT_ID_KEY,
    tenantId,
  );

  localStorage.setItem(
    BUSINESS_ACCOUNT_ID_KEY,
    String(businessAccountId),
  );
}

export function getTenantId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(
    TENANT_ID_KEY,
  );
}

export function getBusinessAccountId(): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = localStorage.getItem(
    BUSINESS_ACCOUNT_ID_KEY,
  );

  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    return null;
  }

  return parsed;
}

const USER_NAME_KEY = "marketing_system_user_name";
const USER_EMAIL_KEY = "marketing_system_user_email";

/**
 * Remove only the current workspace context.
 *
 * Useful when switching between businesses without logging out.
 */
export function clearTenantContext(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(TENANT_ID_KEY);
  localStorage.removeItem(
    BUSINESS_ACCOUNT_ID_KEY,
  );
}

/**
 * Save user profile metadata (name, email) for display.
 */
export function saveUserMeta(name: string, email: string): void {
  if (typeof window === "undefined") {
    return;
  }

  if (name) {
    localStorage.setItem(USER_NAME_KEY, name);
  }
  if (email) {
    localStorage.setItem(USER_EMAIL_KEY, email);
  }
}

/**
 * Get user profile metadata.
 */
export function getUserMeta(): { name: string; email: string } {
  if (typeof window === "undefined") {
    return { name: "", email: "" };
  }

  return {
    name: localStorage.getItem(USER_NAME_KEY) || "",
    email: localStorage.getItem(USER_EMAIL_KEY) || "",
  };
}

/**
 * Completely clear the current authentication session.
 */
export function clearAuth(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    ACCESS_TOKEN_KEY,
  );

  localStorage.removeItem(
    TOKEN_TYPE_KEY,
  );

  localStorage.removeItem(
    USER_NAME_KEY,
  );

  localStorage.removeItem(
    USER_EMAIL_KEY,
  );

  clearTenantContext();
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthToken());
}