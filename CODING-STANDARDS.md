# CODING-STANDARDS.md — {{PROJECT_NAME}}
# ================================================================
# These standards are enforced by the pre-MR checklist.
# Any change to this file must go through the normal MR process
# with minimum {{MR_APPROVERS}} approvals.
# Changes take effect immediately after merge.
# ================================================================
#
# ---------------------------------------------------------------
# LICENSE NOTICE
# Copyright © Bizcircle Technologies Ltd. All rights reserved.
# Licensed to: {{CUSTOMER_NAME}}
# License Key: {{LICENSE_KEY}}
# Installed: {{INSTALL_DATE}}
# ---------------------------------------------------------------

---

## 1. NAMING CONVENTIONS

| Type | Convention | Example |
|---|---|---|
| Variables | camelCase (JS/TS) / snake_case (Python) | `userName` / `user_name` |
| Functions | camelCase (JS/TS) / snake_case (Python) | `getUserById` / `get_user_by_id` |
| Classes | PascalCase | `UserService` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Files | kebab-case | `user-service.ts` |
| Database tables | snake_case, plural | `user_sessions` |
| Environment variables | UPPER_SNAKE_CASE | `DATABASE_URL` |

---

## 2. CODE STRUCTURE

- One function — one job. Keep functions small and focused.
- Maximum function length: 50 lines. If longer, break it up.
- Maximum file length: 300 lines. If longer, split into modules.
- No duplicate code — extract reusable logic into shared functions.
- No deeply nested code — maximum 3 levels of nesting.
- Keep business logic out of UI components and route handlers.

---

## 3. COMMENTS

- Default: write no comments.
- Only comment when the WHY is non-obvious: a hidden constraint, a workaround, a subtle invariant.
- Never explain WHAT the code does — well-named identifiers do that.
- No multi-line comment blocks.
- No commented-out code — delete it, git has history.

---

## 4. ERROR HANDLING

- Every failure path must be handled — no silent errors.
- Never show raw error messages, stack traces, or database errors to users.
- Show user-friendly messages in the UI.
- Log detailed errors server-side only.
- Handle all edge cases: empty input, wrong types, network failures, missing data.

---

## 5. SECURITY STANDARDS

- Never hardcode secrets, API keys, passwords, or tokens — ever.
- Always read sensitive config from environment variables.
- Validate and sanitise all user input on the server side.
- Use parameterised queries — never string concatenation for SQL.
- Sanitise all output rendered to the browser.
- Never log personal data, tokens, or credentials.

---

## 6. TESTING STANDARDS

- Unit test every new function.
- Test happy path, edge cases, and error cases.
- Test names must describe what they test: `should return 404 when user not found`.
- No test should depend on another test's state.
- Mocks must reflect real behaviour — no mocks that mask real failures.

---

## 7. DEPENDENCY STANDARDS

- Before adding any library: check it is actively maintained, widely used, and free of known critical vulnerabilities.
- Never use deprecated or abandoned packages.
- Every new dependency must be added to the dependency log in CLAUDE.md.
- Run `npm audit` / `pip-audit` after every dependency change.

---

## 8. ENVIRONMENT STANDARDS

- All environment-specific config in `.env.development` or `.env.production` — never in code.
- `.env.*` files never committed to git.
- `.env.example` always committed and kept up to date.
- Debug mode off in production.
- Verbose logging off in production.

---

## 9. GIT STANDARDS

- Commit messages: clear and descriptive.
  - ✅ `feat: add password reset flow`
  - ❌ `fix stuff`
- Never commit broken code.
- Never commit `.env` files.
- Keep commits focused — one logical change per commit.

---

## 10. AMENDMENTS LOG
> Record every change to these standards here.

| Date | Changed by | What changed | MR link |
|---|---|---|---|
| {{CREATED_DATE}} | {{OWNER_NAMES}} | Initial standards | — |

---

*Any change to this file requires {{MR_APPROVERS}} approvals via MR.*
*Last updated: {{LAST_UPDATED_DATE}}*
