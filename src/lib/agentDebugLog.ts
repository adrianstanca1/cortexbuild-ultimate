/** Dev-only: same-origin POST so Vite can append NDJSON to `.cursor/debug-82d802.log`. */
const SESSION = "82d802";

export function agentDebugLog(entry: {
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  runId?: string;
}): void {
  // Never run during Vitest: fetch is mocked and debug POSTs steal mockResolvedValueOnce order.
  if (import.meta.env.VITEST || import.meta.env.MODE === "test") return;
  if (!import.meta.env.DEV) return;
  // #region agent log
  void Promise.resolve(
    typeof fetch === "function"
      ? fetch("/__agent-debug", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": SESSION,
          },
          body: JSON.stringify({
            sessionId: SESSION,
            ...entry,
            timestamp: Date.now(),
          }),
        })
      : null,
  ).catch(() => {});
  // #endregion
}
