import { getAuthorizationHeader } from "@/lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(
    status: number,
    detail: string,
  ) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function parseApiResponse(
  response: Response,
): Promise<unknown> {
  // 204 No Content responses intentionally have no body.
  if (response.status === 204) {
    return null;
  }

  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const text = await response.text();

    // Prevent JSON.parse() from failing on an empty body.
    if (!text.trim()) {
      return null;
    }

    return JSON.parse(text);
  }

  return response.text();
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const authorization =
    getAuthorizationHeader();

  const headers = new Headers(
    options.headers,
  );

  const isFormDataBody =
    typeof FormData !== "undefined" &&
    options.body instanceof FormData;

  // Do not set JSON Content-Type for FormData uploads.
  if (
    !headers.has("Content-Type") &&
    !isFormDataBody
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  if (authorization) {
    headers.set(
      "Authorization",
      authorization,
    );
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers,
    },
  );

  const data =
    await parseApiResponse(response);

  if (!response.ok) {
    let detail =
      "An unexpected error occurred.";

    if (
      typeof data === "object" &&
      data !== null &&
      "detail" in data
    ) {
      const value = (
        data as {
          detail?: unknown;
        }
      ).detail;

      if (typeof value === "string") {
        detail = value;
      } else if (Array.isArray(value)) {
        detail = value
          .map((item) => {
            if (
              typeof item === "object" &&
              item !== null &&
              "msg" in item
            ) {
              return String(
                (
                  item as {
                    msg?: unknown;
                  }
                ).msg ??
                  "Validation error",
              );
            }

            return String(item);
          })
          .join(", ");
      }
    } else if (
      typeof data === "string" &&
      data.trim()
    ) {
      detail = data;
    }

    throw new ApiError(
      response.status,
      detail,
    );
  }

  return data as T;
}