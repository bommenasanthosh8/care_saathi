# SPEC.md — CareSaathi AI Project Audit, Remediation & Verification

> **Status**: `FINALIZED`
>
> ⚠️ **Planning Lock**: Requirements finalized. Implementation authorized per user approval.

## Vision
CareSaathi AI is an AI-powered healthcare cost, care, and scheme navigation platform for India. This specification governs a comprehensive repository-wide security, correctness, reliability, performance, and documentation overhaul. It eliminates fabricated outputs, secures payments and authentication, resolves React hook errors, fixes route duplications and database path indeterminism, aligns privacy documentation with actual data flows, and establishes automated regression verification.

## Goals
1. **Critical Payment & OTP Security**: Completely isolate sandbox payment behaviors from production; enforce cryptographic signature checks; persist payment orders and transactions in SQLite; remove hardcoded OTP shortcuts and client-side verification; implement server-side OTP challenges with rate-limiting, expiration, and attempt limits.
2. **Authentication, CORS & Route Integrity**: Remove hardcoded fallback JWT secrets and mandate strong secrets in production; restrict CORS origins; consolidate duplicate API routes (`/api/action-plan/generate`); secure payment and appointment access.
3. **Clinical Truthfulness & Privacy Integrity**: Eliminate fabricated sample OCR prescription responses based on file names; return authentic failure/review-needed states; correct all misleading "Zero PII" retention claims in documentation to accurately reflect actual account, comparison, and booking data flows.
4. **Frontend React Architecture & State Integrity**: Fix conditional React hook executions in `BookingModal.tsx` and `HospitalDetailModal.tsx`; resolve stale closures, race conditions, and missing dependencies in `DashboardPage.tsx`.
5. **Deterministic Persistence & Resilience**: Guarantee deterministic SQLite database path resolution across any working directory; preserve existing databases (`caresaathi.db`); protect optional dependency imports (`pillow-heif`, `fitz`) from crashing backend startup.
6. **Verification & Clean Tooling**: Fix dependencies in `backend/requirements.txt`; pass `npm run build`, `npm run lint` (or eliminate critical errors), and Python test suites with regression tests.

## Non-Goals (Out of Scope)
- Breaking existing API schemas or changing established client-facing contracts.
- Introducing paid external services, paid models, or recurring costs.
- Deleting database files or dropping user tables without explicit authorization.
- Sending real SMS messages, real OTPs, or making real financial payment charges during testing.
- Overwriting the frontend design system or replacing vanilla CSS with TailwindCSS.

## Constraints
- **Platform**: Windows OS execution using PowerShell commands (single command per invocation, no unescaped `&&`).
- **Runtime**: Python 3.14+ backend with FastAPI, Node.js 24+ with React 19 / Vite.
- **Data Safety**: All tests must use mock credentials and test data; real patient data or payment secrets must never be committed.

## Success Criteria
- [ ] React conditional hook errors in `BookingModal.tsx` and `HospitalDetailModal.tsx` eliminated.
- [ ] `DashboardPage.tsx` search and filter effects react properly to query changes without race conditions.
- [ ] Production payments require valid Razorpay credentials and HMAC-SHA256 signature verification; demo payments are explicitly marked and restricted to sandbox/demo environments.
- [ ] OTP verification operates via backend endpoints with rate-limiting, TTL, and attempt limits; arbitrary or client-side OTP bypass removed.
- [ ] Insecure fallback JWT secret eliminated; production startup verifies strong secret presence.
- [ ] CORS origins restricted and disallows wildcard origins with credentials.
- [ ] Duplicate `/api/action-plan/generate` endpoint consolidated into a single authoritative route.
- [ ] OCR service returns truthful review-required/failure responses when unreadable without filename-based medical fabrication.
- [ ] SQLite database path resolves deterministically regardless of execution directory.
- [ ] Documentation (`README.md`, `TECH_STACK.md`, `.env.example`, `frontend/.env.example`) reflects authentic system behaviors, honest privacy disclaimers, and sanitized placeholders.
- [ ] Automated regression tests added and passing; frontend build succeeds.

## Technical Requirements & Priorities

| Requirement | Priority | Target Component | Notes |
|-------------|----------|------------------|-------|
| SEC-01: Payment Sandbox Isolation & Verification | Critical | `payment_service.py`, `main.py`, `BookingModal.tsx` | DB-backed orders, server verification, reject unverified prod payments |
| SEC-02: Server-side OTP Verification | Critical | `auth_service.py` / `otp_service.py`, `BookingModal.tsx` | Challenge binding, rate-limiting, cooldown, no hardcoded bypass |
| SEC-03: Production JWT Secret Hardening | Critical | `auth_service.py`, `config.py` | Strict check in prod, dev fallback with warning, .env docs |
| SEC-04: CORS Policy Hardening | High | `main.py`, `config.py` | No wildcard + credentials, explicit origin list |
| COR-01: React Hook Ordering Fixes | High | `BookingModal.tsx`, `HospitalDetailModal.tsx` | Remove conditional returns before hooks |
| COR-02: Dashboard Race Conditions & Deps | High | `DashboardPage.tsx` | Exhaustive deps, async race guard |
| COR-03: Duplicate Route Consolidation | High | `main.py` | Remove duplicate `/api/action-plan/generate` registration |
| COR-04: Truthful OCR Fallback | High | `ocr_service.py` | Eliminate filename-based clinical fabrication |
| REL-01: Deterministic Database Path | High | `config.py`, `database.py` | Resolve absolute path anchored to project root |
| REL-02: Resilient Image Import Handling | Medium | `image_preprocessor.py` | Catch missing `pillow-heif` without crashing backend startup |
| DOC-01: Privacy & PII Retention Accuracy | Medium | `README.md` | Clarify what is collected (name, phone, booking) vs zero diagnostic records |
| CHR-01: Dependency Formatting & Example Env | Low | `backend/requirements.txt`, `.env.example`, `frontend/.env.example` | Fix indentation, replace live Supabase keys with placeholders |

---

## Health Card Hospital Finder Specification (Phase 6)

### Objective
Provide an end-to-end, production-ready healthcare discovery system allowing patients across Telangana and India to identify verified network hospitals where their specific health card or insurance covers their required procedure or surgery.

### Supported Schemes & Insurers
1. **Ayushman Bharat PM-JAY** (National Health Authority, ₹5 Lakhs cashless coverage)
2. **Telangana Rajiv Aarogyasri** (Aarogyasri Health Care Trust, ₹10 Lakhs cashless coverage)
3. **Telangana Employees Health Scheme (EHS)** (State Government Employees & Pensioners, Cashless Quota)
4. **Central Government Health Scheme (CGHS)** (Central Govt Employees, Empanelled Hospital Gazetted Tariffs)
5. **Employees' State Insurance (ESIC)** (ESI Act insured workers & dependents)
6. **Private Health Insurance Networks & TPAs** (Star Health, HDFC ERGO, ICICI Lombard, Care Health, Niva Bupa)
7. **Extensible Scheme Architecture** for state schemes across India (MJPJAY Maharashtra, Arogya Karnataka, etc.)

### Multi-Tier Verification States
To maintain medical accuracy without misleading patients:
- **`verified_procedure`**: Reliable evidence confirms hospital is empanelled under the scheme AND specifically verified for the selected procedure package.
- **`scheme_verified_procedure_unconfirmed`**: Hospital is verified as empanelled for the scheme, but coverage for the specific treatment requires pre-admission TPA/helpdesk confirmation.
- **`needs_confirmation`**: Data is incomplete, outdated, or pending directory re-verification.
- **`not_matched`**: Hospital is not listed as an empanelled provider under current verified records.

### Coverage & Out-of-Pocket Cost Engine
- Pulls from official statutory packages (Aarogyasri codes like `S4.1.1`, PM-JAY `HBP 2.2`, CGHS Gazette tariffs).
- Computes estimated gross tariff, scheme package coverage, and estimated out-of-pocket expenses (non-medical consumables, copay, or room rent differentials).
- Explains known package exclusions and limits truthfully without fabricating numbers.

### Technical Architecture
- **Data Persistence**: Tables `health_card_schemes`, `health_card_packages`, and `hospital_scheme_empanelments` in SQLite with provenance URLs and timestamps.
- **Backend Endpoints**:
  - `GET /api/health-cards/schemes`: list supported health cards / schemes / insurers
  - `GET /api/health-cards/treatments`: list supported treatments with search / synonyms
  - `POST /api/health-cards/search`: multi-criteria search by card, treatment, location, radius, and filters
  - `GET /api/health-cards/hospital/{facility_id}`: comprehensive scheme and procedure verification profile
  - `POST /api/health-cards/admin/empanelment`: authenticated administrative update of empanelment records
- **Frontend Architecture**:
  - Dedicated `HealthCardFinderPage.tsx` with responsive step-by-step search, verified badges, cost breakdown cards, and hospital detail modal.
  - Integration into `Sidebar.tsx`, `App.tsx`, and landing page discovery actions.

---

## Problem Statement 2: Out-of-Pocket Healthcare Expenditure Prediction and Reduction

### Comprehensive Specification

1. **Treatment and Diagnostic Cost Prediction**:
   - Covers all 17 canonical medical treatments and diagnostics in the catalogue:
     - Diagnostic & Imaging: MRI Brain, MRI Knee, MRI LS Spine.
     - Diagnostic & Pathology: Comprehensive Diagnostic Blood Profile (CBC, LFT, KFT, Lipid, TSH).
     - Renal Replacement: Maintenance Hemodialysis (Per session).
     - Outpatient / Chronic: Super-Specialist OPD Doctor Consultation, Comprehensive Diabetes Care.
     - Surgical & Maternity: Total Knee Replacement (TKR), Cataract Surgery (Phaco + Foldable IOL), Normal Vaginal Delivery, Caesarean Section (LSCS), Coronary Angioplasty (PTCA + DES), Laparoscopic Cholecystectomy, Appendectomy, Inguinal Hernia Repair, Inpatient Acute Febrile Illness / Dengue Care, Kidney Stone Laser Removal.
   - Itemized breakdowns strictly adapted to the procedure type (imaging magnets/radiologist interpretations for MRI; automated analyzers/pathologists for pathology; high-flux dialyzers for hemodialysis; OT/statutory implants for surgeries).
   - Zero price fabrication: unknown or unsupported queries return a 404 unavailable state with clear guidance.

2. **Accurate GPS & Hospital Discovery**:
   - Live browser geolocation and reverse geocoding without hardcoded fallback PINs (e.g., Nizampet, Hyderabad resolves to Medchal–Malkajgiri / PIN 500090).
   - Haversine and road network distance calculations preserved.
   - Never outputs `undefined` or `null` in location labels.

3. **Scheme & Insurance Navigation**:
   - Full integration of central and state health schemes (Ayushman Bharat PM-JAY, Telangana Aarogyasri, CGHS, ESIC, Private TPAs).
   - Procedure-specific verification status distinguishes `verified_procedure` from `needs_confirmation`.
   - Admin verification endpoints require Bearer authentication; unauthenticated modifications rejected with 401.

4. **Prescription OCR & Medicine Cost Analysis**:
   - Multimodal Gemini Vision (`gemini-2.5-flash`, `gemini-1.5-flash`) with resilient local fallback.
   - List numbers ('1.', '2', '3)') rejected as medicine names; duplicate medicine entries (e.g., Dolo 650) merged.
   - Equivalence matching against NPPA Pharma Sahi Daam & Jan Aushadhi generic databases.

5. **Cohesive Patient Out-of-Pocket Comparison Workflow**:
   - Transparent side-by-side facility comparison for the selected procedure.
   - Distinct display of Known Statutory Benefits, Estimated Out-of-Pocket Costs, and Potential Uncovered Surcharges.
   - Clear next steps directing patients to the hospital Aarogyamitra / Insurance TPA helpdesk.

6. **Administrative Data Quality Audit**:
   - Single canonical database path: `caresaathi.db`.
   - Dedicated `/api/admin/data-quality-report` endpoint reporting database size, GPS coverage, facility counts, package codes, verified empanelments, and data provenance.

---
*Status: COMPLETED & VERIFIED*
*Last updated: 2026-10-11*

