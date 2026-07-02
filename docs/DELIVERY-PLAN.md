# dMAT Platform — Phase-Wise Delivery Plan

Based on **BRD v3.0** (June 30, 2026). Each phase has exit criteria that must be met before the next phase starts.

---

## Repository Map

| App / Package | Port | Phase | BRD Section |
|---------------|------|-------|-------------|
| `apps/web-public` | 3100 | 1a | §5.1 Public Website |
| `apps/web-candidate` | 3200 | 1a | §5.2 Candidate Portal |
| `apps/exam-player` | 3300 | 1b | §5.3 Exam Delivery Engine |
| `apps/proctor-console` | 3400 | 1c | §5.4 Proctoring Engine |
| `apps/test-center` | 3500 | 1a/1c | §5.6 Test Center Portal |
| `apps/admin` | 3600 | 1d | §5.6 Administrator Dashboard |
| `apps/api` | 3000 | 0+ | All backend services |
| `packages/database` | — | 0+ | Prisma schema & migrations |
| `packages/auth` | — | 0 | RBAC, JWT, role guards |
| `packages/types` | — | 0 | Shared domain types |
| `packages/ui` | — | 0+ | Shared React components |

---

## Phase 0 — Foundation (Weeks 1–4)

**Goal:** Runnable monorepo, auth, data model, local infra, CI.

### Deliverables

- [x] Monorepo scaffold (pnpm + Turborepo)
- [x] Prisma schema with phase-aligned entities
- [x] Docker Compose (Postgres, Redis, MinIO) — optional; local dev uses SQLite instead
- [ ] JWT auth module with role-based guards (`candidate`, `proctor`, `grader`, `admin`, …)
- [ ] Audit log middleware on all mutating API calls
- [ ] i18n skeleton (English + one additional language)
- [ ] Region-aware data residency flag on `User` / `CandidateProfile`
- [ ] CI pipeline: install, typecheck, build

### Exit Criteria

- All apps start locally via `pnpm dev`
- API health check returns 200
- Database migrations apply cleanly
- Role-based route protection demonstrated on at least one endpoint per role group

### Working Assumptions to Validate

- **A2** — Data retention & residency (legal review in parallel)
- **A5** — 500 concurrent sessions (inform infra sizing doc)

---

## Phase 1a — Public Site + Candidate Portal (Weeks 5–10)

**Goal:** Candidates can register, book an exam, and see status. Public site is CMS-ready.

### Deliverables

| Module | Location | Features |
|--------|----------|----------|
| Public pages | `web-public` | Home, structure, preparation, taking-the-exam, country pages, legal |
| CMS integration | `web-public` + API | Headless CMS for non-technical content updates (BRD §5.7) |
| Registration & login | `web-candidate` + API | Account creation, secure login, password reset |
| Exam booking | `web-candidate` + API | Physical center vs remote pathway, reschedule/cancel |
| System check | `web-candidate` | Webcam/mic/browser test, ID upload placeholder |
| Dashboard | `web-candidate` | Registration, upcoming exam, grading status |
| Notifications | API | Email for confirmations, reminders, results |
| Consent capture | `web-candidate` | Recording & biometric consent log (BRD §5.2 #15) |
| Test center portal | `test-center` | Session list, check-in, seat assignment (basic) |

### Exit Criteria

- End-to-end: register → book (both pathways) → view confirmation
- Public site pages match IA from BRD §7
- WCAG 2.1 AA audit started on public site
- Consent record stored with timestamp before remote booking completes

### Dependencies

- Phase 0 auth and database complete
- CMS vendor selected (or lightweight markdown fallback for pilot)

---

## Phase 1b — Exam Delivery Engine (Weeks 8–14, overlaps 1a)

**Goal:** Secure browser-based exam player with all three question types.

> Stand up question authoring/import early (BRD Step 50) — it unblocks exam engine testing and Phase 1d grading.

### Deliverables

| Module | Location | Features |
|--------|----------|----------|
| Question import tool | API + admin | MCQ keys, figure rules, free-text rubrics |
| Secure exam player | `exam-player` | Lockdown mode, tab/copy prevention |
| Question rendering | `exam-player` | MCQ, figure/image, free-text |
| Timer | `exam-player` + API | Exam/section/question timers, auto-submit |
| Auto-save | `exam-player` + API | Short-interval persistence, offline buffer |
| Section sequencing | `exam-player` | Module breaks, randomization/pooling |
| Objective auto-grade | API | MCQ + rule-based figure scoring on submit |

### Exit Criteria

- Pilot exam (mixed question types) completable end-to-end in lockdown player
- Auto-save survives simulated network drop (sync on reconnect)
- Objective items scored immediately on submission
- Published browser/OS support matrix enforced at session start

### Dependencies

- Sample question bank from SMEs (out of scope for platform build, required for testing)
- Lockdown strategy decided (extension vs. kiosk vs. custom Electron shell)

---

## Phase 1c — Proctoring Engine (Weeks 12–20)

**Goal:** Hybrid AI + human proctoring for remote sessions; lighter mode for test centers.

### Deliverables

| Module | Location | Features |
|--------|----------|----------|
| Identity verification | API + candidate | ID capture, liveness, face-match |
| AV/screen capture | `exam-player` + infra | Webcam, mic, screen streaming |
| AI anomaly detection | API / service | Face/gaze, apps, objects, audio flags |
| Live proctor console | `proctor-console` | Multi-session dashboard, warn/pause/terminate |
| Post-session review | `proctor-console` | Timestamped clip queue, confirm/dismiss/escalate |
| Incident audit trail | API | Every flag, decision, actor, rationale |
| Test center mode | `test-center` | Check-in console, incident logging |
| Appeals workflow | API + admin | 14-day appeal window, 10-day SLA (A3) |
| Build vs buy decision | docs | AI model evaluation documented (BRD Step 48) |

### Exit Criteria

- Remote session: identity check → capture → AI flag → human intervention → adjudication
- Proctor console supports 1:25 ratio (A1) with configurable policy
- Recordings encrypted at rest and in transit
- No AI flag affects result without human confirmation

### Infrastructure (sized to A5)

- Target: **500 concurrent remote sessions** at peak
- Real-time video pipeline (WebRTC or managed service)
- Object storage for recordings with 12-month retention policy (A2)
- EU and India region deployment paths

---

## Phase 1d — Grading + Certificates (Weeks 16–22)

**Goal:** Free-text grading, score aggregation, certificate issuance.

### Deliverables

| Module | Location | Features |
|--------|----------|----------|
| Grading queue | API + admin | Dual-grader assignment (A4) |
| Rubric scoring | grader UI | Per-question rubric, comments |
| Dispute resolution | API | Tolerance band → senior grader adjudication |
| Score aggregation | API | Raw → scaled score + percentile |
| Certificate PDF | API + candidate | Module breakdown, integration-ready fields (A9) |
| Final release gate | API | Certificate blocked until proctoring + grading complete |
| Admin reporting | `admin` | Volume, flag rates, grading throughput |

### Exit Criteria

- Free-text item: two graders → auto-average or senior adjudication
- Certificate generated only when session status = `certified`
- Certificate data model includes APS-ready fields
- Admin dashboard shows live metrics for at least one intake window

---

## Cross-Phase Workstreams

These run in parallel across all phases:

| Workstream | Owner (BRD §4.1) | Timing |
|------------|------------------|--------|
| Stakeholder validation of Assumptions A1–A9 | Product Owner | Week 1–2 |
| Legal review (biometrics, GDPR, India DPDP) | DPO / Legal | Weeks 1–6 |
| Proctor/grader staffing plan | Proctoring Ops Lead | Weeks 4–8 |
| Infrastructure cost estimate | Engineering Lead | Weeks 4–6 |
| Accessibility (WCAG 2.1 AA) | Engineering + Legal | Ongoing from 1a |
| Security penetration test | Engineering | Pre go-live |

---

## Suggested Timeline (22 weeks to Phase 1 go-live)

```
Week  1–4   ████ Phase 0 — Foundation
Week  5–10  ██████ Phase 1a — Public + Candidate
Week  8–14  ██████ Phase 1b — Exam Engine (overlap)
Week 12–20  ████████ Phase 1c — Proctoring
Week 16–22  ██████ Phase 1d — Grading + Certificates
Week 20–22  ██ Hardening, load test (500 concurrent), legal sign-off
```

---

## Local Development

No Docker required. Uses SQLite (`packages/database/prisma/dev.db`).

```bash
cp .env.example .env
pnpm install
pnpm setup
pnpm dev
```

| Service | URL |
|---------|-----|
| API | http://localhost:3001/api/v1/health |
| Public site | http://localhost:3100 |
| Candidate portal | http://localhost:3200 |
| Exam player | http://localhost:3300 |
| Proctor console | http://localhost:3400 |
| Test center | http://localhost:3500 |
| Admin | http://localhost:3600 |

---

## Out of Scope (Phase 1)

Per BRD §3.2:

- Exam question bank authoring (SME-supplied; platform provides import tool)
- Payment gateway (Assumption A6)
- Native mobile apps
- Test center hardware provisioning
- External APS integration at launch (Assumption A9 — data model ready only)
