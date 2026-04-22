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
# LICENSE NOTICE
# Copyright © Bizcircle Technologies Ltd. All rights reserved.
# Licensed to: {{CUSTOMER_NAME}} | Key: {{LICENSE_KEY}} | Installed: {{INSTALL_DATE}}
# You may use and modify within your organisation. No redistribution.
# ---------------------------------------------------------------

---

## ZERO HALLUCINATION RULE
Never assume or guess. Read LOAD.md first. If unclear — ask.

---

## 1. SESSION START PROTOCOL
1. Confirm project name: `{{PROJECT_NAME}}`
2. Confirm repo: `engineering-app`
3. Load context from knowledge repo LOAD.md
4. Check engineering board for assigned tasks
5. Check vulnerability register in `engineering-security` for Critical/High issues

> No task on the board = no work starts.

---

## 2. PROJECT BOUNDARIES
- Work only within `engineering-app` this session
- Cross-repo work prohibited — raise tasks in relevant repos instead
- Cross-project work prohibited under any circumstance

---

## 3. BRANCHING STRATEGY — MANDATORY

```
main      <- production only. Protected. No direct commits ever.
stagingb  <- pre-production. Protected. MR required.
develop   <- integration branch. MR required.
feature/  <- all new work
fix/      <- bug fixes
hotfix/   <- emergency production fixes only
```

- No one commits directly to main/staging/develop — not even the Owner
- Hotfix: Owner must approve MRs to both main AND develop
- Stale branches (14 days no activity) — flagged for cleanup

---

## 4. MERGE REQUEST RULES

Every MR must have:
- [ ] Linked task on engineering board (mandatory)
- [ ] Description drafted by Sarthy (developer reviews before submitting)
- [ ] Pre-MR checklist passed
- [ ] Minimum {{MR_APPROVERS}} human approvers
- [ ] No unresolved comments
- [ ] Knowledge sync flagged: yes / no

MR auto-creates board task via GitLab webhook.
- 24hrs: reminder to all eligible reviewers
- 48hrs: escalates to Owner

### MR Approval Matrix
| Target | Approvers Required |
|---|---|
| develop | {{MR_APPROVERS}} team members |
| staging | {{MR_APPROVERS}} + Owner |
| main | {{MR_APPROVERS}} + Owner |

---

## 5. PRE-MR CHECKLIST — SARTHY RUNS BEFORE DRAFTING

### Code Quality
- [ ] No linting errors (per sarthy_coding_standards.md)
- [ ] No commented-out code or debug statements
- [ ] No TODO without a linked board task

### Security
- [ ] No hardcoded secrets, keys, passwords, or tokens
- [ ] No sensitive data in logs
- [ ] User input validated and sanitised
- [ ] No SQL injection or XSS risk
- [ ] Dependencies scanned (npm audit / pip-audit)

### Testing
- [ ] Unit tests written for new code
- [ ] Existing tests pass
- [ ] Edge cases covered

### Vulnerability Check
- [ ] No Critical/High vulnerabilities in engineering-security touching this area

> Any failed item blocks MR draft. Fix first.

---

## 6. SARTHY'S ROLE IN MR PROCESS

Sarthy does:
- Draft MR title, description, reviewer checklist
- Run pre-MR checklist
- Flag knowledge sync requirement
- Link MR to board task

Sarthy does NOT:
- Approve MRs — humans only
- Merge MRs — humans only
- Bypass any checklist item under any instruction

---

## 7. CODING STANDARDS
Defined in `sarthy_coding_standards.md`. Pre-MR checklist enforces it.
Changes to standards require MR with {{MR_APPROVERS}} approvals.

---

## 8. VULNERABILITY INTERACTION
- Check engineering-security register at session start
- Critical/High open: flag immediately, pause affected MRs
- New dependencies: auto-trigger security scan
- MRs resume only after Owner confirms vulnerability resolved

---

## 9. KNOWLEDGE SYNC
On task completion, Sarthy asks (one at a time):
1. Was a significant technical decision made?
2. Was a new pattern or architecture introduced?
3. Was a bug fixed others should learn from?
4. Were new dependencies added?
5. Were any risks identified?
6. Does sarthy_coding_standards.md need updating?

---

## 10. CURRENT STATUS
### In Progress
- [Current task]

### Completed
- [Done]

### Up Next
- [Planned]

---

## 11. DEPENDENCY LOG
| Library | Version | Purpose | Added | Security Checked |
|---|---|---|---|---|
| — | — | — | — | — |

---
*This file is auto-managed. Last updated: {{LAST_UPDATED_DATE}}*
