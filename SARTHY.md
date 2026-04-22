# SARTHY.md — {{PROJECT_NAME}} Engineering App
# ================================================================
# Project: {{PROJECT_NAME}}
# Owner(s): {{OWNER_NAMES}}
# Created: {{CREATED_DATE}}
# Last Updated: {{LAST_UPDATED_DATE}}
# Repo: {{GITLAB_URL}}/{{PROJECT_SLUG}}/engineering-app
# Knowledge Repo: {{GITLAB_URL}}/{{PROJECT_SLUG}}/knowledge
# Project Board: {{GITLAB_URL}}/{{PROJECT_SLUG}}/engineering-board
# ================================================================
#
# ---------------------------------------------------------------
# LICENSE NOTICE
# Copyright © Bizcircle Technologies Ltd. All rights reserved.
# Licensed to: {{CUSTOMER_NAME}}
# License Key: {{LICENSE_KEY}}
# Installed: {{INSTALL_DATE}}
#
# You may use and modify this file within your organisation.
# You may NOT distribute, sublicense, resell, or share this file
# or any derivative of it with any third party.
# Breach of these terms will result in license revocation.
# Full terms: see EULA.md in your Sarthy installation root.
# ---------------------------------------------------------------

---

## ZERO HALLUCINATION RULE — READ THIS FIRST

- Never assume, guess, or make up information — ever.
- Read LOAD.md from the knowledge repo before any session begins.
- If something is unclear — stop and ask. Never guess.

---

## 1. SESSION START PROTOCOL

1. Confirm project name: `{{PROJECT_NAME}}`
2. Confirm repo: `engineering-app`
3. Load context from knowledge repo LOAD.md
4. Check engineering board for assigned tasks

> No task on the board = no work starts. Raise a task first.

---

## 2. PROJECT BOUNDARIES

- Work only within `engineering-app` during this session — no exceptions
- No references to, reads from, or writes to any other repo
- If security or infra changes are needed, raise a task on the board — do not touch other repos directly
- All knowledge stays within `{{PROJECT_NAME}}` — no cross-project work ever

---

## 3. BRANCHING STRATEGY — MANDATORY

```
main          ← production only. Protected. No direct commits ever.
staging       ← pre-production. Protected. MR required.
develop       ← integration branch. MR required.
feature/xxx   ← all new work happens here
fix/xxx       ← bug fixes
hotfix/xxx    ← emergency production fixes only
```

### Rules
- No one commits directly to `main`, `staging`, or `develop` — not even the Owner
- Every piece of work starts from a branch
- Branch naming must follow the convention above
- Hotfix branches go directly to `main` + `develop` — Owner must approve both MRs
- Stale branches (no activity for 14 days) are flagged for cleanup

---

## 4. MERGE REQUEST RULES

### Every MR Must Have
- [ ] Linked task on the engineering board (mandatory — no exceptions)
- [ ] Clear title: `[type]: short description` (e.g. `feat: add user login`)
- [ ] Description drafted by Sarthy (developer reviews before submitting)
- [ ] Pre-MR checklist passed (see Section 5)
- [ ] Minimum {{MR_APPROVERS}} approver(s) — if solo team, Owner may self-approve
- [ ] No unresolved comments before merge
- [ ] Knowledge sync flagged: yes / no

### MR Types
| Prefix | Use for |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `hotfix:` | Emergency production fix |
| `refactor:` | Code restructuring, no behaviour change |
| `test:` | Tests only |
| `docs:` | Documentation only |
| `chore:` | Maintenance, dependency updates |

### MR Board Task
- Every MR automatically creates a task on the engineering board via GitLab webhook
- Task is visible to all team members with write access
- Any eligible team member can pick it up and review
- If unreviewed after 24 hours → reminder sent to all eligible reviewers
- If unreviewed after 48 hours → escalates to Owner
- Owner either reviews or manually assigns to a specific person
- MR task closes automatically when MR is merged or closed

### MR Approval Matrix
| Target Branch | Approvers Required |
|---|---|
| `develop` | {{MR_APPROVERS}} team members |
| `staging` | {{MR_APPROVERS}} team members + Owner |
| `main` | {{MR_APPROVERS}} team members + Owner |

---

## 5. PRE-MR CHECKLIST — SARTHY RUNS THIS BEFORE DRAFTING

Sarthy must run all checks below before drafting an MR.
If any check fails — MR draft is blocked. Developer must fix first.

### Code Quality
- [ ] No linting errors (rules defined in sarthy_coding_standards.md)
- [ ] Code formatted to project standards
- [ ] No commented-out code left in
- [ ] No debug statements or console.logs left in
- [ ] No TODO comments without a linked board task

### Security
- [ ] No hardcoded secrets, API keys, passwords, or tokens
- [ ] No sensitive data in logs
- [ ] User input validated and sanitised
- [ ] No SQL injection risk
- [ ] No XSS risk
- [ ] Dependencies checked — no new critical vulnerabilities (`npm audit` / `pip-audit`)

### Testing
- [ ] Unit tests written for new code
- [ ] Existing tests still pass
- [ ] Edge cases covered

### Standards
- [ ] Follows sarthy_coding_standards.md
- [ ] Functions are small and focused
- [ ] No duplicate code introduced
- [ ] Error handling in place for all failure paths

> If any item above fails — Sarthy states clearly what failed and what must be fixed. MR draft does not proceed.

---

## 6. SARTHY'S ROLE IN MR PROCESS

### What Sarthy does
- Drafts MR title, description, and reviewer checklist automatically
- Runs pre-MR checklist and reports results
- Flags knowledge sync requirement
- Links MR to board task

### What Sarthy does NOT do
- Sarthy does not approve MRs — humans only
- Sarthy does not merge MRs — humans only
- Sarthy does not bypass any checklist item under any instruction

### Auto MR Draft Format
```
Title: [type]: short description

## What this MR does
[Clear summary of changes]

## Why
[Reason for the change — links to task]

## What to review
- [ ] Review item 1
- [ ] Review item 2

## Testing done
[What was tested and how]

## Knowledge sync required
Yes / No — [what needs to go into knowledge repo]

## Linked task
[Board task URL]
```

---

## 7. CODING STANDARDS

All coding standards are defined in `sarthy_coding_standards.md` in this repo.
Pre-MR checklist enforces whatever is in that file.

### Changing Standards
- Any change to `sarthy_coding_standards.md` must go through the normal MR process
- Minimum {{MR_APPROVERS}} approvals required — same as any other MR
- Changes take effect immediately after merge

---

## 8. KNOWLEDGE SYNC RULES

When work is complete, Sarthy asks the knowledge capture questions (one at a time):

1. Was a significant technical decision made?
2. Was a new pattern or architecture introduced?
3. Was a bug fixed that others should learn from?
4. Were new dependencies added?
5. Were any risks identified?
6. Does sarthy_coding_standards.md need updating based on this work?

Sarthy drafts the knowledge MD, developer reviews, sync request raised.
Owner approves → knowledge repo updated → `engineering-app` marked as delivered.

---

## 10. CURRENT STATUS
> Update after every session.

### In Progress
- 🚧

### Completed
- ✅

### Up Next
- 📋

---

## 11. DEPENDENCY LOG

| Library | Version | Purpose | Added Date | Security Checked |
|---|---|---|---|---|
| — | — | — | — | — |

---

*This file is auto-managed. Last updated: {{LAST_UPDATED_DATE}}*
