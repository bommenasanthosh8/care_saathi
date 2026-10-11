---
milestone: Audit, Remediation & Verification
version: 1.0.0
updated: 2026-10-11T15:15:00+05:30
---

# Roadmap — CareSaathi AI Remediation

> **Current Phase:** Phase 2 — Critical Security & Payment Correctness
> **Status:** executing

## Must-Haves (from SPEC)
- [ ] React conditional-hook violations resolved (`BookingModal.tsx`, `HospitalDetailModal.tsx`)
- [ ] Dashboard stale data, race conditions, and effect dependencies resolved (`DashboardPage.tsx`)
- [ ] Payment verification and sandbox isolation secured (`payment_service.py`, `main.py`, `BookingModal.tsx`)
- [ ] OTP verification bypass replaced with secure server-side verification
- [ ] JWT secret configuration hardened against missing/weak secrets in production
- [ ] CORS wildcard origin with credentials replaced with explicit origin configuration
- [ ] Deterministic SQLite database path resolution across directories
- [ ] Duplicate API route `/api/action-plan/generate` eliminated
- [ ] OCR fabricated medical data fallback removed and replaced with authentic error states
- [ ] Backend requirements, environment examples, and documentation truthful and clean
- [ ] Full verification suite passing (build, lint, regression tests)

---

## Phases

### Phase 1: Inspection, Inventory & Planning Lock
**Status:** 🔄 In Progress (Awaiting User Approval)
**Objective:** Map repository, investigate all findings, produce categorized issue inventory, prepare SPEC.md & ROADMAP.md, and obtain user approval before executing code changes.

---

### Phase 2: Critical Security & Payment Correctness (Wave 1)
**Status:** ⬜ Not Started
**Objective:** Resolve high-risk security flaws.
- **Task 2.1**: Implement DB-persisted payment orders and server-side verification with strict sandbox vs production separation (`payment_service.py`, `database.py`, `main.py`).
- **Task 2.2**: Implement backend OTP service with challenge binding, rate limiting, and expiration; update frontend `BookingModal.tsx` to communicate with the service.
- **Task 2.3**: Remove hardcoded fallback JWT secret, mandate strict secret in production, and validate on startup (`auth_service.py`, `config.py`).
- **Task 2.4**: Harden CORS configuration in `main.py` and `config.py` with explicit allowed origins.
- **Task 2.5**: Remove filename-based fabricated clinical data in `ocr_service.py` and implement truthful unreadable/review responses.

---

### Phase 3: Application Correctness & State Integrity (Wave 2)
**Status:** ⬜ Not Started
**Objective:** Fix React hook ordering, dashboard data flows, routing conflicts, and database pathing.
- **Task 3.1**: Refactor `BookingModal.tsx` and `HospitalDetailModal.tsx` to eliminate early conditional returns before hooks.
- **Task 3.2**: Resolve effect dependency issues, stale closures, and race conditions in `DashboardPage.tsx`.
- **Task 3.3**: Consolidate duplicate `/api/action-plan/generate` route in `main.py`.
- **Task 3.4**: Make SQLite `DATABASE_PATH` deterministic and absolute in `config.py` and `database.py`.

---

### Phase 4: Reliability, Privacy Alignment & Cleanup (Wave 3)
**Status:** ⬜ Not Started
**Objective:** Harden runtime imports, sanitize configuration templates, and align documentation.
- **Task 4.1**: Make `pillow-heif` import optional with graceful fallback in `image_preprocessor.py`.
- **Task 4.2**: Normalize formatting in `backend/requirements.txt`.
- **Task 4.3**: Sanitize `.env.example` and `frontend/.env.example` (remove real Supabase tokens, add JWT_SECRET).
- **Task 4.4**: Correct `README.md` and `TECH_STACK.md` regarding PII retention and data storage.

---

### Phase 5: Verification & Regression Testing (Wave 4)
**Status:** ✅ Completed
**Objective:** Empirically validate all changes across frontend and backend.
- **Task 5.1**: Run `npm run build` and `npm run lint` (0 errors verified).
- **Task 5.2**: Add regression test suite covering payments, OTP, JWT, CORS, duplicate routes, database pathing, and OCR (18 tests passing).
- **Task 5.3**: Run backend test suite with Python (100% passing across all 11 test suites).
- **Task 5.4**: Generate final comprehensive audit report.

---

### Phase 6: Health Card Hospital Finder (Full-Stack Implementation)
**Status:** ✅ Complete
**Objective:** Build production-quality Health Card & Insurance Hospital Finder with verified procedure empanelment, package rates, and transparent out-of-pocket estimates.
- [x] **Task 6.1**: Implement backend data model and SQLite tables (`health_card_schemes`, `health_card_packages`, `hospital_scheme_empanelments`).
- [x] **Task 6.2**: Seed verified hospital empanelment records (PM-JAY, Aarogyasri, Telangana EHS, CGHS, ESIC, Private Insurance TPAs) with official source URLs and dates.
- [x] **Task 6.3**: Implement backend service layer (`health_card_service.py`) and API endpoints in `main.py`.
- [x] **Task 6.4**: Integrate coverage and expense estimator engine with canonical treatments and statutory package codes.
- [x] **Task 6.5**: Implement authenticated admin verification update endpoint.
- [x] **Task 6.6**: Implement frontend `HealthCardFinderPage.tsx`, search steps, verified badges, and `HealthCardHospitalModal.tsx`.
- [x] **Task 6.7**: Integrate navigation in `Sidebar.tsx`, `App.tsx`, and Landing Page.
- [x] **Task 6.8**: Add regression test suite (`tests/test_health_card_finder.py`) and verify frontend build & linting.

---

### Phase 7: Problem Statement 2 — Out-of-Pocket Expenditure Prediction & Reduction
**Status:** ✅ Complete
**Objective:** End-to-end completion and verification of healthcare cost prediction and reduction platform.
- [x] **Task 7.1**: Expand itemized cost decomposition and checklists to non-surgical diagnostics (MRI magnet time/radiologist sign-off, pathology automated analyzers/vacutainers, hemodialysis dialyzers).
- [x] **Task 7.2**: Eliminate hardcoded Nizampet GPS / PIN 500001 fallback; preserve coordinates and locality labels without `undefined` artifacts.
- [x] **Task 7.3**: Reject numeric list artifacts ('1.', '2', '3)') in prescription OCR; deduplicate duplicate extractions (Dolo 650).
- [x] **Task 7.4**: Implement Patient Out-of-Pocket Comparison Workflow on `CostEstimatorPage.tsx` with applicable schemes and nearby facility comparisons.
- [x] **Task 7.5**: Implement transparent, explainable recommendations based on department match, distance, and verified empanelments.
- [x] **Task 7.6**: Implement Admin Data Quality & Provenance Report (`/api/admin/data-quality-report`).
- [x] **Task 7.7**: Add automated acceptance test suite (`tests/test_problem_statement_2_acceptance.py`) with 100% passing tests.

---

## Progress Summary

| Phase | Status | Tasks | Complete |
|-------|--------|-------|----------|
| 1: Inspect & Plan | ✅ | 1/1 | 100% |
| 2: Security & Payments | ✅ | 5/5 | 100% |
| 3: Correctness & Hooks | ✅ | 4/4 | 100% |
| 4: Reliability & Privacy | ✅ | 4/4 | 100% |
| 5: Verification & Tests | ✅ | 4/4 | 100% |
| 6: Health Card Hospital Finder | ✅ | 8/8 | 100% |
| 7: Out-of-Pocket Expenditure Platform | ✅ | 7/7 | 100% |


