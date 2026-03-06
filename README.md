# Candidate Chat Interview Feedback

A minimal full stack app:
- Candidate logs in
- Completes a 5-question chat interview
- Submits answers
- Receives 3 skill scores (0 to 100) with simple explanations
- Can revisit chat history and feedback securely

## Tech
- Frontend: React + TypeScript + Vite
- Backend: NestJS + MongoDB (Mongoose)
- Auth: JWT (Bearer token) + bcrypt password hashing
- Tests: Jest e2e tests (mongodb-memory-server)
- Containers: Docker Compose (mongo + api + web)

## Quick start (Docker)
1) From repo root:
   - docker compose up --build

2) Open:
   - http://localhost:8080

Backend is reachable at:
- http://localhost:3000/api

## Local development (no Docker)
1) Start MongoDB locally
2) Backend:
   - cd api
   - cp .env.example .env
   - npm install
   - npm run start:dev

3) Frontend:
   - cd web
   - cp .env.example .env
   - npm install
   - npm run dev
   - open http://localhost:5173

Note:
- For local dev, set VITE_API_BASE=http://localhost:3000/api in web/.env

## API overview
- POST /api/auth/register { email, password } -> { token }
- POST /api/auth/login { email, password } -> { token }
- GET /api/auth/me (Bearer) -> { id, email }

- POST /api/sessions (Bearer) -> creates a session with 5 questions
- GET /api/sessions (Bearer) -> list sessions
- GET /api/sessions/:id (Bearer) -> session details, including feedback
- PUT /api/sessions/:id/answers (Bearer) { answers: string[5] } -> saves progress
- POST /api/sessions/:id/submit (Bearer) -> stores feedback and marks submitted

## Architecture notes
- Sessions store:
  - userId
  - questions[5]
  - answers[5]
  - status: in_progress or submitted
  - feedback: skills[] + overallSummary
- Scoring is deterministic and lives in ScoringService.
  In a real system it would call an external AI service and store the response.

## Ethical and data considerations
- Privacy:
  - Avoid storing more PII than needed (email only).
  - Treat interview answers as sensitive content. Add retention policies and encryption at rest in production.
- Bias:
  - Any automated scoring can be biased by language, culture, disability, or communication style.
  - In production: provide transparency, appeal paths, calibration, and regular audits.
- Security:
  - Passwords stored as bcrypt hashes.
  - JWT secret must be rotated and stored securely.
  - Add rate limiting and monitoring before production.

## AI coding assistant usage (fill in during your work)
Suggested template:
- Where used:
  - Used ChatGPT to scaffold initial NestJS modules and React routing.
- Prompts:
  - "Create a minimal NestJS API with JWT auth and a sessions resource stored in MongoDB."
  - "Create a Vite React TS app with login, dashboard, and a simple chat UI."
- Validation and overrides:
  - Reviewed auth flow to ensure bcrypt hashing and JWT validation are correct.
  - Adjusted scoring logic to be deterministic and testable.
  - Added e2e tests using mongodb-memory-server to avoid external dependencies.

## Running tests
Backend e2e:
- cd api
- npm install
- npm run test:e2e
