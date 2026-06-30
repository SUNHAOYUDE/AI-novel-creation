# Debug Session: mysql-auth-failure

- Status: OPEN
- Started At: 2026-06-29
- Symptom: Backend process compiles, but NestJS does not finish listening on `:3000`; frontend shows `Network Error`.
- Scope: `backend` startup path, Prisma initialization, MySQL authentication.

## Runtime Evidence

- `startup-status.log` shows `mysqlPortOpen=True`, `backendAlive=True`, `backendHttp=False`.
- `backend.stdout.log` shows Nest modules and routes are mapped successfully.
- `backend.stderr.log` shows `PrismaClientInitializationError` with `P1000 Authentication failed`.

## Hypotheses

1. `backend/.env` contains an invalid MySQL username or password for the local instance.
2. `DATABASE_URL` points to the right host and port, but targets a MySQL auth plugin/account combination unsupported by the provided credentials.
3. The backend process is loading a different environment value than expected, causing Prisma to connect with stale credentials.
4. The MySQL service is reachable, but the specified database user lacks permission to access `ai_novel_creation`.

## Next Steps

1. Verify the effective `DATABASE_URL` source and current `.env` value shape.
2. Validate whether the configured MySQL credentials can authenticate outside Prisma.
3. Only after evidence confirms the mismatch, apply the minimal fix and re-run startup verification.

## Progress Update

- Confirmed config source: Prisma reads `DATABASE_URL` from environment via `schema.prisma`, and app boot loads `.env` through `dotenv/config`.
- Confirmed mismatch evidence: current runtime logs show MySQL port is reachable, but Prisma fails with `P1000 Authentication failed` for user `root`.
- Applied minimal config fix: updated `backend/.env` password from placeholder `password` to the user-provided value.
- Second-stage evidence after restart: Prisma moved past authentication and now fails with `P1003 Database does not exist`, which confirms the password fix is effective.
- Applied minimal startup fix: `scripts/setup.ps1` now runs `npx prisma db push --skip-generate` so development startup can auto-create/sync the local schema when credentials are valid.
- Verification pending: local restart is still required to confirm whether `http://localhost:3000/api/books` responds after schema sync.
