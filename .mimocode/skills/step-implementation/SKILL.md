---
name: step-implementation
description: Implement a numbered step from an implementation plan using plan-mode then systematic execution
---

# Step Implementation

Implement a single step from a numbered implementation plan (e.g., "Шаг 8. Рейтинг") by first planning in plan-mode, then executing task-by-task.

## When to use

- User gives a step from an implementation plan (e.g., "реализуй 8й шаг", "implement step 8")
- User says "сделай шаг N" or "выполни шаг N"
- Work follows a `DOC/implementation-plan.md` or similar roadmap document

## Procedure

### Phase 1: Orientation (before plan mode)

1. **Read the implementation plan** — locate and read the full plan to understand the step's requirements
2. **Explore existing code** — check what's already implemented for this step:
   - Search for related files (`glob` for feature names)
   - Read existing models, APIs, and pages that relate to this step
   - Identify patterns used by completed steps (API handler style, middleware, components)
3. **Assess complexity** — report to the user:
   - What's already done vs what remains
   - Estimated complexity (low/medium/high)
   - Any risks or dependencies
   - Whether you can handle it

### Phase 2: Plan (in plan mode)

4. **Enter plan mode** — write a structured plan to `.mimocode/plans/`
5. **Plan contents:**
   - Complexity assessment
   - What already exists (with file paths)
   - What needs to be created (file path + purpose for each)
   - Implementation details for each file
   - Verification steps

### Phase 3: Execute (task-by-task)

6. **Break into tasks** — use the task tool to create one task per deliverable
7. **Implement sequentially** — for each task:
   - Mark task as started
   - Write the file following established patterns
   - Mark task as done
8. **Verify** — run `npm run build` to check for TypeScript errors
9. **Report results** — summarize what was created and how to test

## Key patterns to follow

- **API routes:** `import { apiHandler, success } from '@/lib/apiHandler'` + middleware wrappers
- **Middleware stack:** `withAuth` → `withRole('role')` → handler
- **Error handling:** throw `NotFound`, `Forbidden`, `BadRequest` etc.
- **Response format:** `{ success: true, data: ... }` or `{ success: false, error: "..." }`
- **DB models:** in `DB/models/`, import via `@db/models`
- **Client pages:** `useEffect` + `fetch` + `useState`, role check via `getCookie('mp_role')`
- **CSS:** CSS Modules + global variables, no Tailwind

## Notes

- Always check what's already implemented before writing new code
- Match existing code style exactly (imports, formatting, patterns)
- If the step mentions cron/scheduling, note that local dev uses `node-cron` but production may differ
- For Next.js Pages Router: API routes in `src/pages/api/`, pages in `src/pages/`
