# Code Review: Project Athena - Cloud Identity Attack Path Detection Platform

## Review Outcome

This review was re-validated against source and then remediated in code.

## Findings and Fix Status

### 1. Hardcoded admin bootstrap credentials (`CRITICAL`) - Fixed
- Original issue: predictable startup admin credentials in `backend/core/auth.py`.
- Fix:
  - Removed hardcoded `admin / athena-admin-2026`.
  - Added optional bootstrap via env vars:
    - `ATHENA_BOOTSTRAP_ADMIN_USERNAME`
    - `ATHENA_BOOTSTRAP_ADMIN_PASSWORD`

### 2. JWT secret hardcoded fallback (`HIGH`) - Fixed
- Original issue: predictable default secret in `backend/config.py`.
- Fix:
  - Removed static fallback secret.
  - `JWT_SECRET` is now required when `USE_MOCK_DATA=false`.
  - In mock mode only, an ephemeral random secret is generated at startup.

### 3. Missing input validation and abuse controls on registration (`HIGH`) - Fixed
- Original issue: `/api/auth/register` accepted unchecked username/password.
- Fix in `backend/api/routes.py`:
  - Added `RegisterRequest` model validation.
  - Enforced username policy (`[A-Za-z0-9_.-]`, 3-32 chars).
  - Enforced password complexity (min length + upper/lower/number/special).
  - Added in-memory IP-based rate limiting for register/login.

### 4. Sensitive endpoints lacked authorization (`HIGH`) - Fixed
- Original issue: response/audit read endpoints were public.
- Fix:
  - Added admin guard to:
    - `/api/response/pending`
    - `/api/response/history`
    - `/api/audit/logs`

### 5. Response execution endpoints not admin-restricted (`HIGH`) - Fixed
- Original issue: any authenticated user could approve/reject/execute/rollback response plans.
- Fix:
  - Added admin guard to:
    - `/api/response/approve/{plan_id}`
    - `/api/response/reject/{plan_id}`
    - `/api/response/execute/{plan_id}`
    - `/api/response/rollback/{action_id}`

### 6. Circular import coupling (`MEDIUM`) - Fixed
- Original issue: detection imported response runtime handler directly.
- Fix:
  - Replaced runtime import with injected handler:
    - `DetectionEngine.set_response_plan_handler(...)`
  - Wiring performed in `backend/api/routes.py`.

### 7. Runtime-only state loss (`MEDIUM`) - Fixed
- Original issue: alerts/response plans/audit logs lost on restart.
- Fix:
  - Added JSON persistence and reload for:
    - `backend/core/detection.py` -> `backend/detected_paths.json`
    - `backend/core/response.py` -> `backend/response_state.json`
    - `backend/core/audit.py` -> `backend/audit_logs.json`

### 8. Overbroad exception handling in policy parsing (`MEDIUM`) - Improved
- Original issue: broad `except Exception` masked parsing failure causes.
- Fix in `backend/core/aws_ingester.py`:
  - Replaced with specific exception handling (`ClientError`, decode/type/key/value errors).
  - Added basic retry path for transient AWS throttling/service errors.

### 9. Magic numbers (`LOW`) - Improved
- Added named constants for core thresholds:
  - Detection defaults (`DEFAULT_MIN_PRIVILEGE_DELTA`, `LOW_PRIVILEGE_THRESHOLD`, `MAX_RECOMMENDATIONS`).
  - Graph privilege bounds (`PRIVILEGE_MIN`, `PRIVILEGE_MAX`).

## Corrected Prior Review Notes

- FastAPI Swagger was not missing. API docs are available at `/docs`.
- CI/CD now runs backend lint + pytest and frontend type-check + build.

## Testing Status

- Static verification was performed by code inspection and patch validation.
- Backend runtime tests were executed via `python -m pytest --tb=short` with 3 passing tests.
