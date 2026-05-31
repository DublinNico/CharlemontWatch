# BUG-017 — Vitest Picked Up Playwright E2E Spec Files

| Field | Detail |
|---|---|
| **Date** | 31/05/26 |
| **Status** | Fixed |
| **Severity** | Low |
| **Area** | Frontend / Test Infrastructure |

## Description

After adding Playwright E2E tests in `frontend/e2e/*.spec.ts`, running `npm test` (Vitest) in the frontend directory caused all E2E spec files to be included in the Vitest run. Vitest does not understand Playwright's `test` / `expect` globals and failed immediately on every E2E file.

## Steps to Reproduce

1. Add Playwright spec files to `frontend/e2e/`
2. Run `npm test` in `frontend/`
3. Observe Vitest attempting to run `e2e/*.spec.ts` and failing on `browserType.launch`

## Root Cause

Vitest's default `testMatch` pattern (`**/*.{test,spec}.{ts,tsx,...}`) matched both `src/test/*.test.tsx` (unit tests) and `e2e/*.spec.ts` (Playwright tests). No `include` pattern was set to restrict Vitest to the unit test directory.

## Fix Applied

Added an explicit `include` pattern to the Vitest config in `vite.config.ts`:

```ts
test: {
  include: ['src/test/**/*.{test,spec}.{ts,tsx}'],
  ...
}
```

## Files Changed

- `frontend/vite.config.ts`

## Discovered By

Observed during E2E test setup (31/05/26)
