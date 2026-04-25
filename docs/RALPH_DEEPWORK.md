# Ralph `/deepwork` triple review (oh-my-claude)

The **triple review** gate is defined in the **oh-my-claude** plugin’s `/deepwork` command. It is **not** a single npm script in this repository. It runs inside **Claude Code** (or a compatible client) with the plugin installed, because it depends on **Task subagents** and **plugin MCP tools**.

## What “triple review” means

All **three** reviewers must score the work **≥ 9.5 / 10** before the loop may complete. They are intended to run **in parallel**:

| Reviewer                 | Mechanism (per plugin `deepwork.md`)                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| GPT‑5.2 (high reasoning) | MCP: `mcp__plugin_oh-my-claude_gpt-as-mcp__codex` with `model: "gpt-5.2"` and `config: { "model_reasoning_effort": "xhigh" }` |
| Gemini 3 Pro preview     | MCP: `mcp__plugin_oh-my-claude_gemini-as-mcp__gemini` with `model: "gemini-3-pro-preview"`                                    |
| Opus-style reviewer      | `Task` tool with `subagent_type: "oh-my-claude:reviewer"`                                                                     |

The orchestration rules (delegate to agents, use MCP **only** in the review phase, etc.) live in the plugin file:

- `${CLAUDE_PLUGIN_ROOT}/prompts/orchestrator-workflow.md` (included from `/deepwork`)

Replace `CLAUDE_PLUGIN_ROOT` with your installed plugin root, e.g. under `~/.claude/plugins/cache/oh-my-claude/.../`.

## Prerequisites (cannot be satisfied from repo root alone)

1. **Claude Code** (or equivalent) with the **oh-my-claude** plugin enabled.
2. **MCP servers** bundled with or configured for that plugin (`gpt-as-mcp`, `gemini-as-mcp`), with whatever **API keys / auth** the plugin documentation requires (typically OpenAI- and Google-compatible credentials configured in the client, not in this repo).
3. **`jq`** on `PATH` for `call-tracker.sh` (used for hook JSON parsing).
4. Optional but recommended: plugin **hooks** enabled so PreToolUse/PostToolUse logging populates `/tmp/claude-calls/`.

There is **no** non-interactive “run triple review from `npm`” path unless you replicate those MCP calls yourself.

## Call tracking (`call-tracker.sh`)

The workflow expects you to **start** tracking at the beginning of a session and **`report`** before emitting the completion token.

From a shell, after `cd` to the repo you are reviewing (optional for the script itself; the script uses `/tmp` logs):

```bash
export CLAUDE_PLUGIN_ROOT="/path/to/oh-my-claude/plugin/root"
"$CLAUDE_PLUGIN_ROOT/hooks/call-tracker.sh" start
# … do work in Claude Code with hooks firing …
"$CLAUDE_PLUGIN_ROOT/hooks/call-tracker.sh" report
```

Other actions (from `orchestrator-workflow.md`): `list`, `reset`, and `report <session_id>`.

**Note:** `start`/`report` are meaningful when hooks are feeding the tracker; a manual `start` without hook-driven `pre`/`post` may produce sparse logs.

## How to run the full loop locally (intended path)

1. Open this repository in **Claude Code** with **oh-my-claude** installed.
2. Invoke the slash command **`/deepwork`** (or the command that maps to `deepwork.md` in your setup).
3. Follow the phases in the command body: todos, implementation, then **parallel** triple review with the review prompt template (task, changes, evidence, score).
4. Iterate until **all three** scores are ≥ **9.5**.
5. Run **`call-tracker.sh report`** then output exactly:

   `<promise>COMPLETE</promise>`

   only when every checklist item in the command (including all reviewer scores and the call report) is satisfied.

## Why this doc exists

CI and app builds are reproducible here with **Node** from **`.nvmrc`** and GitHub Actions **`actions/setup-node`**. The Ralph `/deepwork` triple review is **client- and plugin-bound**; this file records the **exact expectations and commands** so contributors can align local quality gates with the plugin without adding secrets to the repo.
