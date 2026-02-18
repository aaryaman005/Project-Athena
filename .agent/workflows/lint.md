---
description: Lint the backend with Ruff and type-check the frontend with TypeScript
---

## Backend — Ruff Lint

1. Install Ruff if not already installed.
// turbo
2. Run `pip install ruff` in `c:\Users\aarya\Desktop\Project-Athena\backend`.

3. Run the linter.
// turbo
4. Run `ruff check .` in `c:\Users\aarya\Desktop\Project-Athena\backend`.

5. If there are lint errors, report them to the user and offer to auto-fix with `ruff check --fix .`.

## Frontend — TypeScript Type-check

6. Ensure Node dependencies are installed.
// turbo
7. Run `npm install` in `c:\Users\aarya\Desktop\Project-Athena\frontend` (only if `node_modules` is missing).

8. Run the TypeScript compiler in check-only mode.
// turbo
9. Run `npx tsc --noEmit` in `c:\Users\aarya\Desktop\Project-Athena\frontend`.

10. Report all errors and warnings to the user. If there are none, confirm that both backend and frontend are clean.
