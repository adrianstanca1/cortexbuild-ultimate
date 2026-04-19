# Logic (how to work)

These rules follow the user’s Cursor instructions and Superpowers-style discipline.

## Execution

- **Run the work yourself** — use the terminal and tools; do not offload investigation with “you should run …” unless blocked by policy.
- **Real environment** — network and shell are available; retry with a different approach after a failure.

## Evidence and honesty

- **No success claims without fresh proof** — run the test/build/lint command; quote exit codes and failure counts when relevant.
- **No “should work”** — if you have not run the check, say so.

## Code and edits

- **Smallest useful diff** — only files and lines needed for the task; no drive-by refactors or unrelated formatting.
- **Read before write** — open surrounding code; match naming, types, imports, and comment density already in the file.
- **Citations** — when pointing at existing code, use fenced blocks with the required form: opening fence on its own line, `startLine:endLine:filepath`, body, closing fence on its own line. Do not prefix the opening fence with list markers.
- **Literals in code fences** — use real characters, not HTML escapes.

## Communication

- **Clear prose** — complete sentences; proportional length; no telegraphic shorthand.
- **Links** — full `https://` URLs when referencing the web.
- **Dates** — when the session provides “Today’s date,” treat that year as authoritative (do not assume the wrong year).

## Security

- **Never paste or store secrets in chat** — API keys, `sk_*`, tokens. Use env files (e.g. `~/.env.keys`) that stay out of git; rotate anything that was exposed.

## Skills and plugins

- If a **skill** likely applies (even weakly), **read and follow it** before improvising.
- Use **process skills** (brainstorming, debugging, verification-before-completion) before heavy implementation when the task warrants it.

## Session flow

- Treat the latest message in light of **full conversation history**; default to steering the current task, not resetting it.
- Prefer **non-interactive** CLI flags; avoid prompts that stall automation.
