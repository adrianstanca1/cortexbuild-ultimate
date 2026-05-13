/**
 * Lightweight structured JSON logger — zero-dependency alternative to pino.
 * Writes newline-delimited JSON (NDJSON) to stdout/stderr.
 * Compatible with pino destinations if upgraded later.
 */

const LOG_LEVEL = (process.env.LOG_LEVEL || "info").toLowerCase();
const LEVELS = { trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60 };
const CURRENT = LEVELS[LOG_LEVEL] ?? 30;

function log(level, msg, extra = {}) {
  if ((LEVELS[level] ?? 30) < CURRENT) return;
  const entry = {
    level,
    time: Date.now(),
    msg,
    pid: process.pid,
    hostname: require("os").hostname(),
    ...extra,
  };
  const out = level === "error" || level === "fatal" ? process.stderr : process.stdout;
  out.write(JSON.stringify(entry) + "\n");
}

const logger = {
  trace: (msg, extra) => log("trace", msg, extra),
  debug: (msg, extra) => log("debug", msg, extra),
  info: (msg, extra) => log("info", msg, extra),
  warn: (msg, extra) => log("warn", msg, extra),
  error: (msg, extra) => log("error", msg, extra),
  fatal: (msg, extra) => log("fatal", msg, extra),
};

module.exports = logger;
