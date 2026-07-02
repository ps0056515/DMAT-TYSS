# dMAT Platform

Full-stack digital assessment platform with exam delivery, hybrid proctoring, grading, and certification.

## Prerequisites

- Node.js ≥ 20
- pnpm 9

No Docker required — local dev uses **SQLite** (a single file database).

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm setup    # generate client, create DB, seed demo data
pnpm dev
```

Or step by step:

```bash
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

## Demo accounts (password: `password123`)

| Role | Email |
|------|-------|
| Candidate | alex@example.com |
| Proctor | proctor@dmat.de |
| Grader | grader@dmat.de |
| Test center staff | staff@dmat.de |
| Admin | admin@dmat.de |

## End-to-end demo flow

1. **Candidate** — http://localhost:3200/login → dashboard → system check → start exam
2. **Exam** — opens from dashboard (or http://localhost:3300/?session=SESSION_ID)
3. **Proctor** — http://localhost:3400 → dismiss flags → resolve session
4. **Grader** — http://localhost:3600/grading → score free-text
5. **Certificate** — http://localhost:3200/certificate after grading completes
6. **Test center** — http://localhost:3500 (staff@dmat.de)
7. **Admin** — http://localhost:3600 (admin@dmat.de)

## What's implemented

- JWT auth + RBAC (all roles)
- Audit logging on mutating API calls
- Candidate registration, booking, system check
- Exam player: MCQ / figure / free-text views, debounced auto-save, submit, objective auto-grading
- Server-authoritative countdown timer with heartbeat sync + auto-submit on expiry
- Web lockdown mode: copy/cut/paste + context-menu blocking, tab-switch & fullscreen-exit detection (logged as proctoring flags), fullscreen on start
- Offline sync buffer: answers queue in localStorage while offline and sync on reconnect
- Webcam capture tile in exam player (denial reported as high-severity flag)
- Question randomization/pooling per session (balanced by question type)
- Question authoring + bulk JSON import in admin (http://localhost:3600/questions)
- Proctoring flag queue (dismiss / warn / escalate)
- Test-center check-in + incident logging
- Grading queue with rubric scoring
- Certificate issuance on completion
- Admin program overview (live KPIs)

## Database

- **Local dev:** SQLite at `packages/database/prisma/dev.db` (created by `pnpm setup`)
- **Production:** switch `provider` in `schema.prisma` to `postgresql` and set `DATABASE_URL` accordingly

Optional `docker-compose.yml` is available if you prefer Postgres/Redis/MinIO locally — not required.

## Not yet production-grade

- Real WebRTC video streaming / AI proctoring models (player captures webcam locally only)
- OS-level browser lockdown (current lockdown is web-based; a kiosk/Electron shell is needed to block Alt-Tab etc.)
- Email notifications, PDF generation, payment
- Multi-region deployment

See [docs/DELIVERY-PLAN.md](./docs/DELIVERY-PLAN.md) for phase roadmap.
