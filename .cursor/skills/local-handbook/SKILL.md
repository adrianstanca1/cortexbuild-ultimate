---
name: local-handbook
description: >-
  Personal playbook for this machine. Before substantial edits, debugging, or
  ambiguous requests, read logic.md (how to work) and memory.md (facts to
  preserve). User’s explicit Cursor instructions override this skill when they
  conflict. Update memory.md when the user states a durable preference or
  corrects you.
---

# Local handbook

## Files in this skill

| File        | Purpose                                                                |
| ----------- | ---------------------------------------------------------------------- |
| `logic.md`  | How you should reason, verify, and behave on tasks.                    |
| `memory.md` | Stable facts, preferences, and context worth carrying across sessions. |

## When to use

- Non-trivial implementation, refactors, or multi-step plans.
- Conflicting requirements or missing constraints.
- After the user corrects a mistake: capture the fix in `memory.md` if it should persist.

## Maintenance

- Keep `memory.md` short and factual; move long narratives to a project `AGENTS.md` or `CLAUDE.md` if the work is repo-specific.
- Keep `logic.md` about process and quality bars, not secrets or one-off task notes.
