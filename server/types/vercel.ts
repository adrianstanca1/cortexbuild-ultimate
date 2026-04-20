// Minimal type replacements for @vercel/node (Express-only project)
// These files (api-proxy.ts, auth/token.ts, auth/user.ts) are Vercel-specific
// and not mounted in the Express app, but kept for potential future deployment.

export interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string>;
  url?: string;
  connection?: { remoteAddress?: string };
}

export interface VercelResponse {
  status(code: number): this;
  setHeader(name: string, value: string): this;
  json(body: unknown): this;
  end(): this;
}
