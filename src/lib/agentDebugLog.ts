/** POSTs to Vite `/__agent-debug` so the dev/preview server can append NDJSON logs. */
const SESSION = "82d802";

function agentDebugEligibleHost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

export function agentDebugLog(entry: {
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  runId?: string;
}): void {
  // Never run during Vitest: fetch is mocked and debug POSTs steal mockResolvedValueOnce order.
  if (import.meta.env.VITEST || import.meta.env.MODE === "test") return;
  // `vite preview` and other local prod bundles set DEV=false — still want logs on loopback.
  if (!import.meta.env.DEV && !agentDebugEligibleHost()) return;
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
