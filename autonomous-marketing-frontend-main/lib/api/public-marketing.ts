const base = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export async function submitPublicForm<T>(path: "contact" | "newsletter", data: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${base}/public/${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data), signal: AbortSignal.timeout(15000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.success !== true) {
    throw new Error(typeof result?.detail === "string" ? result.detail : "Could not save your request. Please try again or contact support by email.");
  }
  return result as T;
}
