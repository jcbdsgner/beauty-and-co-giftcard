---
name: token-efficiency
description: Token optimization habits for cost-effective Claude Code usage on this project — efficient file reading, command filtering, and output handling. Use by default on every task unless the user explicitly asks for full/verbose output. Adapted from Delphine-L/claude_global's token-efficiency skill for this project's tool conventions (Edit/Read stay the default for code — see "Scope" below).
---

# Token Efficiency

Default assumption: keep responses and tool calls lean unless the user asks for verbose output or full file contents.

Adapted from [Delphine-L/claude_global](https://github.com/Delphine-L/claude_global/blob/main/skills/claude-meta/token-efficiency/SKILL.md) — trimmed to this project's stack (no bioinformatics-specific content) and rewritten to match this repo's own tool rules, which take priority whenever the two disagree (see `Scope-based tool selection` below).

## Scope-based tool selection (read this before "quick reference")

This project's own conventions already require **Edit/Read/Write over Bash equivalents (sed/awk/heredocs) for anything under version control** — diffs stay reviewable and Edit fails loudly on a bad match instead of silently corrupting a file. That rule is not relaxed by this skill. Token efficiency here comes from *what* you read and run, not from swapping Edit for sed.

| Situation | Preferred tool | Why |
|---|---|---|
| Editing a source file (`.tsx`, `.ts`, `.css`, `.json` config, `SKILL.md`, etc.) | **Read once, then Edit** | Reviewable diff; Edit errors on a non-unique/missing match instead of mangling the file. |
| Creating a new file | **Write** | One round-trip; no benefit from a bash heredoc. |
| Read-only inspection of large/generated data (logs, `.next/` build output, big JSON/CSV, `node_modules` metadata) | `grep`, `head`/`tail`, `jq`, `wc -l` | Nothing here needs a diff; filtering avoids paying for content you'll never act on. |
| Pure file-system ops with no content change (copy, move, list, count) | `cp`, `mv`, `find`, `wc -l` | No token benefit to Read+Write when nothing is being read or reasoned about. |

## Quick reference

1. **Filter before reading.** `grep`, `head -n`, `tail -n`, or `wc -l` first on anything that might be long (logs, `npm install`/`next build` output, `git diff` on a big file) — don't `Read` a whole log to find one error.
2. **Check lightweight signals first.** `git status --short`, `package.json`, a directory listing — before opening large files to answer a question they might already answer.
3. **Use quiet flags.** `curl -s`, `git -q`, `--silent` — verbose output only when the user is debugging that command specifically.
4. **Search, don't scan.** Use `grep`/`Grep` for "does X exist / where is X" instead of reading whole files top to bottom.
5. **Read with limits on large files.** Use `offset`/`limit` on `Read`, or `wc -l` first to decide whether a full read is even reasonable.
6. **Delegate broad exploration.** For "find every place X is used" or open-ended codebase surveys spanning many files, use the `Explore` agent instead of reading files one by one in the main conversation — it keeps the raw search noise out of this context.
7. **Summarize, don't dump.** Report structure and findings, not raw command output, unless the user is actively debugging that exact output.
8. **Small files are cheap — don't over-optimize.** A 40-line component or config file is not worth a `head`/`grep` dance; just `Read` it.

## When to override

Read the full thing, verbatim, when:
- The user explicitly asks ("show me the whole file", "read all of it").
- A filtered view would strip context needed to actually understand the problem (e.g. an error references a line number outside the tail you grabbed).
- The file is already small (well under ~200 lines) — filtering it first just adds a round-trip.

## Model selection

Not applicable here — the model for this session is fixed by the user's Claude Code settings (`/fast`, plan tier), not something a skill can switch mid-session. Don't attempt to instruct a model change from within a task.
