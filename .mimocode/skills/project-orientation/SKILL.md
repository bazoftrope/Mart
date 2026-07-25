---
name: project-orientation
description: Orient to a project by exploring structure, reading docs, and assessing current implementation status
---

# Project Orientation

Systematically explore an unfamiliar or partially-known project to build context before starting work.

## When to use

- First session in a new project
- After a long gap between sessions
- When resuming work on a partially-implemented project
- User says "ознакомься с проектом", "explore the project", "get familiar with the project"

## Procedure

1. **Read project memory** — check `<project>/.mimocode/` for existing plans, and memory files for durable context
2. **Explore directory structure** — read the root, `src/`, `DB/`, `DOC/` (or equivalent) to understand layout
3. **Identify tech stack** — read `package.json` (or `Cargo.toml`, `requirements.txt`, `go.mod`, etc.)
4. **Read implementation plan** — if `DOC/implementation-plan.md` or similar exists, read it fully to understand the roadmap
5. **Check what's implemented** — look for completed markers `[v]` in the plan, or examine existing source files
6. **Assess current state** — summarize:
   - What's done
   - What's in progress
   - What's next
   - Any blockers or gaps
7. **Check git state** — branches, recent commits, uncommitted changes

## Output format

Present findings to the user in their language with:

- **Tech stack summary** (1-2 lines)
- **Implementation progress** (which steps done, which pending)
- **Current state** (branch, uncommitted work, running processes)
- **Recommended next action**

## Notes

- Adapt exploration depth to project size — for large projects, focus on the area the user asks about
- For Next.js projects: check Pages Router vs App Router, CSS approach, ORM
- For API projects: understand auth pattern, error handling, response format
- Store durable findings in project memory for future sessions
