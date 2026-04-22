# sarthy_coding_standards.md — {{PROJECT_NAME}}
# ================================================================
# Enforced by pre-MR checklist.
# Changes require MR with {{MR_APPROVERS}} approvals.
# ================================================================
# Licensed to: {{CUSTOMER_NAME}} | Key: {{LICENSE_KEY}}
# Copyright © Bizcircle Technologies Ltd. All rights reserved.
# ---------------------------------------------------------------

---

## 1. NAMING CONVENTIONS

| Type | Convention | Example |
|---|---|---|
| Variables | camelCase (JS/TS) / snake_case (Python) | `userName` / `user_name` |
| Functions | camelCase (JS/TS) / snake_case (Python) | `getUserById` |
| Classes | PascalCase | `UserService` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Files | kebab-case | `user-service.ts` |
| DB tables | snake_case, plural | `user_sessions` |
| Env vars | UPPER_SNAKE_CASE | `DATABASE_URL` |

---

## 2. CODE STRUCTURE
- One function — one job
- Max function length: 50 lines
- Max file length: 300 lines
- Max nesting depth: 3 levels
- No duplicate code — extract shared logic
- Business logic out of UI and route handlers

---

## 3. COMMENTS
- Default: write no comments
- Only comment when the WHY is non-obvious
- Never explain WHAT — well-named identifiers do that
- No commented-out code — delete it, git has history

---

## 4. ERROR HANDLING
- Every failure path handled — no silent errors
- User-friendly messages in UI
- Detailed errors server-side only
- Handle: empty input, wrong types, network failures, missing data

---

## 5. SECURITY
- Never hardcode secrets — use environment variables
- Validate and sanitise all user input server-side
- Parameterised queries only — no string SQL concatenation
- Never log personal data, tokens, or credentials

---

## 6. TESTING
- Unit test every new function
- Test: happy path, edge cases, error cases
- Test names describe what they test
- No test depends on another test's state

---

## 7. DEPENDENCIES
- Check: actively maintained, widely used, no critical vulnerabilities
- Never use deprecated packages
- Add every new dependency to SARTHY.md dependency log
- Run npm audit / pip-audit after every dependency change

---

## 8. ENVIRONMENT
- All config in .env.development or .env.production — never in code
- .env.* never committed to git
- .env.example always committed and kept up to date

---

## 9. AMENDMENTS LOG
| Date | Changed by | What changed | MR link |
|---|---|---|---|
| {{CREATED_DATE}} | {{OWNER_NAMES}} | Initial standards | — |

---
*Changes require {{MR_APPROVERS}} approvals via MR. Last updated: {{LAST_UPDATED_DATE}}*
