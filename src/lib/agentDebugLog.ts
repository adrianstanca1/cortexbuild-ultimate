/** POSTs to Vite `/__agent-debug` so the dev/preview server can append NDJSON logs. */
const SESSION = "82d802";

function isPrivateLanHost(hostname: string): boolean {
  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  const m = /^172\.(\d+)\./.exec(hostname);
  if (m) {
    const oct = Number(m[1]);
    return oct >= 16 && oct <= 31;
  }
  return false;
}

function agentDebugEligibleHost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "[::1]" ||
    isPrivateLanHost(h)
  );
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
  // Preview / prod bundles use DEV=false; allow loopback + RFC1918 LAN, or explicit flag.
  const force =
    import.meta.env.VITE_AGENT_DEBUG === "true" ||
    import.meta.env.VITE_AGENT_DEBUG === "1";
  if (!import.meta.env.DEV && !force && !agentDebugEligibleHost()) return;
  // #region agent log
  const body = JSON.stringify({
    sessionId: SESSION,
    ...entry,
    timestamp: Date.now(),
  });
  void (async () => {
    if (typeof fetch !== "function") return;
    try {
      const r = await fetch("/api/agent-debug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": SESSION,
        },
        body,
        credentials: "include",
      });
      if (r.ok) return;
    } catch {
      /* fall through */
    }
    void Promise.resolve(
      fetch("/__agent-debug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": SESSION,
        },
        body,
      }),
    ).catch(() => {});
  })();
  // #endregion
}
