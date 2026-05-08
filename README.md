# FinWise — AI-Powered Mutual Fund & ETF Advisor

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB%20Atlas-Vector%20Search-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/products/platform/atlas-vector-search)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-RAG-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![MUI](https://img.shields.io/badge/MUI-7-007FFF?logo=mui&logoColor=white)](https://mui.com)
[![Jest](https://img.shields.io/badge/Jest-tested-C21325?logo=jest&logoColor=white)](https://jestjs.io)
[![Vitest](https://img.shields.io/badge/Vitest-tested-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev)
[![Cypress](https://img.shields.io/badge/Cypress-E2E-17202C?logo=cypress&logoColor=white)](https://www.cypress.io)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![CI](https://img.shields.io/badge/GitHub%20Actions-CI%2FCD-2088FF?logo=githubactions&logoColor=white)](https://github.com/features/actions)

> 🔗 **Live demo:** https://finwise-frontend-7qbw.onrender.com/

---

## 📖 Overview

**FinWise** is a full-stack web application that helps Canadian retail investors make better decisions about **mutual funds and ETFs**. Users complete a financial-profile questionnaire, optionally import their holdings from major Canadian banks via CSV (TD, RBC, BMO, Scotiabank, CIBC), and then chat with a Retrieval-Augmented Generation (RAG) assistant that grounds every answer in curated financial articles plus a live database of fund and ETF data — instead of hallucinating numbers like a vanilla LLM would.

The problem: most consumer-grade LLMs happily invent MERs, returns, and fund codes. The goal of FinWise was to design a constrained, profile-aware, source-cited financial assistant that is *actually safe to put in front of a user making investment decisions*.

---

## ✨ Key Features

- **Personalized AI chat** that grounds answers in retrieved articles and live mutual-fund / ETF tables — never on the model's pretraining when context is provided.
- **Two-stage retrieval pipeline:** a lightweight **Gemini classifier** decides what data sources a query needs (`is_allowed`, `needs_articles`, `needs_funds`, `needs_etfs`, `needs_distribution_mutual_funds`, `is_continuation`), then a generator model answers using only the assembled context.
- **Vector search RAG** over financial articles using MongoDB Atlas `$vectorSearch` with 3072-dim Gemini `gemini-embedding-001` vectors and a configurable similarity threshold.
- **Server-Sent Events (SSE) streaming** of assistant responses with a custom holdback buffer so internal `RECOMMENDATIONS` / `SOURCES` JSON metadata blocks **never leak** to the client mid-stream.
- **Recommendation enrichment:** model emits `{ "MAW104": "reason" }` JSON; the backend hydrates each symbol with real fund/ETF metadata (NAV, MER, returns, dividend yield, holdings) before returning to the UI.
- **Conversation continuity service** that reconstructs context from prior AI messages in a session — re-using their cited chunks/funds/ETFs instead of re-running expensive vector search on follow-up questions like *"and what about its fees?"*.
- **Multi-bank portfolio import** — drop in a CSV from TD, RBC, BMO, Scotiabank, or CIBC and FinWise auto-detects the format and asset class (mutual fund vs. ETF) using a Strategy-pattern parser router.
- **Risk- and budget-aware fund filtering:** Mongo aggregation filters funds by the user's stated risk tolerance and `savings_balance` vs. each fund's `minimum_investment` (handled with `$expr` + `$convert` to tolerate string/number variance in the dataset).
- **Auth:** Google OAuth (`@react-oauth/google`), JWT sessions, bcrypt password hashing, and email verification via Mailtrap.
- **Scope guard** that politely refuses off-topic queries (weather, coding homework, etc.) at the classifier layer instead of the generator.
- **Dockerized + CI/CD on GitHub Actions** — lint → unit tests → `npm audit` → multi-stage Docker image build & push, deployed on Render.

---

## 🛠️ Tech Stack

**Frontend**
- React 19, React Router 7, Vite 7
- Material UI 7 (`@mui/material`, `@mui/icons-material`, `@mui/x-data-grid`)
- `react-markdown` + `remark-gfm` (GitHub-flavoured markdown rendering for AI replies)
- `react-hot-toast` (notifications), `@react-oauth/google` (Google sign-in)
- Vitest + React Testing Library (unit/integration), Cypress (E2E), ESLint 9

**Backend**
- Node.js 20, Express 5, ES modules
- MongoDB Atlas + Mongoose 9 (with `$vectorSearch` aggregation stage)
- Google Gemini API: `generateContent` + `streamGenerateContent` (SSE), `gemini-embedding-001` for embeddings
- `bcrypt` / `bcryptjs`, `jsonwebtoken`, `express-session`, `cors`
- `multer` + `csv-parse` for CSV uploads, `mailtrap` for transactional email
- `yahoo-finance2` for live ETF data
- Jest + Supertest + `mongodb-memory-server` for unit/integration/security tests, ESLint 10

**Data ingestion (Python)**
- `requests`, `lxml`, `pymongo` — scrapers for RBC, BMO, CIBC, and TD mutual-fund pages, plus an ETF dataset extractor

**Infrastructure & DevOps**
- Docker + Docker Compose (multi-stage builds; nginx-served SPA in production)
- GitHub Actions: parallel lint, test, `npm audit`, then Buildx → Docker Hub
- Render (frontend static + backend web service)

---

## 🏗️ Architecture & Design Decisions

```
┌──────────────────────────┐        ┌──────────────────────────────────────────────┐
│       React 19 SPA       │  HTTPS │              Express 5 API                    │
│  (Vite, MUI, Router)     │ ─────► │  /api/users  /api/profile  /api/chat          │
│                          │        │  /api/assets /api/email                       │
│  • OAuth + session       │        │                                               │
│  • Streaming chat (SSE)  │        │  ┌────────────────────────────────────────┐   │
│  • Markdown renderer     │        │  │  Chat pipeline                          │   │
│  • Recommendation panel  │        │  │   1. Classifier (Gemini, low temp)     │   │
│  • CSV upload            │        │  │   2. Continuity reconstruction OR      │   │
└──────────────────────────┘        │  │      fresh vector search + DB lookup   │   │
                                    │  │   3. Prompt assembly (general/narrow)  │   │
                                    │  │   4. Generator (Gemini stream)         │   │
                                    │  │   5. parseAIResponse → enrichment      │   │
                                    │  └────────────────────────────────────────┘   │
                                    └──────────────┬───────────────────────────────┘
                                                   │
                  ┌────────────────────────────────┼─────────────────────────────────┐
                  ▼                                ▼                                 ▼
        ┌──────────────────┐            ┌──────────────────────┐         ┌─────────────────────┐
        │  MongoDB Atlas   │            │  Google Gemini API   │         │  Yahoo Finance API  │
        │  • Accounts      │            │  • Embeddings (3072d)│         │  • Live ETF prices  │
        │  • Profiles      │            │  • Classifier model  │         │  • YTD / 1y returns │
        │  • Assets        │            │  • Generator (SSE)   │         └─────────────────────┘
        │  • Mutual Funds  │            └──────────────────────┘
        │  • Chunks (vec)  │            ┌──────────────────────┐
        │  • Sources       │            │  Python scrapers     │ ──► seeds Mutual Funds collection
        │  • Messages      │            │  RBC / BMO / CIBC/TD │
        └──────────────────┘            └──────────────────────┘
```

**Notable design decisions and *why*:**

- **Two-pass LLM (classifier → generator) instead of one big prompt.** Routing is done by a low-temperature classifier that returns a strict JSON schema. This makes retrieval cheap and explainable, and lets the system *cheaply refuse* off-topic queries before paying for vector search or a long-context generation. Fallback to "articles only" on classifier error keeps the system available.
- **Two prompt modes — `general` vs. `narrow`.** General mode is article-backed educational guidance (no live product tables, more chunks allowed); narrow mode is strict source-grounded with fund/ETF tables and a `RECOMMENDATIONS` JSON tail. This avoids the model recommending specific tickers when the user only asked a conceptual question, and removes a whole class of hallucinated-symbol bugs.
- **Strategy pattern for multi-bank CSV imports.** `BankCsvParser` is an abstract base that defines `requiredHeaders`, `canParse(headers)`, and `parse()`; each bank gets a concrete subclass (`TDParser`, `RBCParser`, `BMOParser`, `ScotiabankParser`, `CIBCParser`). `CsvParserRouter` iterates them and dispatches based on the first header match. New brokerages can be added without touching the router or upstream controllers.
- **Dependency injection in services.** Services like `createChatService(deps)` accept their `MutualFund`, `Chunk`, `Profile`, `Message`, AI client, and even `mongooseLib` as parameters. This makes the entire chat pipeline testable with `mongodb-memory-server` and pure stubs — no module mocking required.
- **Routers as factories (`createChatRouter(controller)`).** Each route file exports a factory that takes a controller, allowing the integration tests to swap in fakes and the production app to inject real ones from `createApp(...)` in `app.js`.
- **Continuity over re-retrieval.** Vector search is the most expensive step in the pipeline. When the classifier flags `is_continuation: true`, `continuityService` re-parses the most recent AI messages' embedded `RECOMMENDATIONS` / `SOURCES` JSON, fetches just those fund codes / chunk IDs from Mongo, and reuses them — turning a 3-stage pipeline into a single generator call.
- **CI as a quality gate, not a checkbox.** GitHub Actions runs lint and unit tests on **every branch and PR**, then runs `npm audit --audit-level=moderate` on `main` pushes, and only then builds and pushes Docker images. This caught real issues before they ever hit Render.

---

## 🔬 Technical Challenges

### 1. Streaming an AI response *without* leaking machine-readable metadata

Gemini's streaming endpoint emits SSE events with partial JSON, and our prompt asks the model to append two structured blocks at the very end of every reply:

```
RECOMMENDATIONS:
{ "MAW104": "low-cost balanced fund matching your risk profile" }

SOURCES:
{ "65a1b2c3d4e5f6789012345a": 1 }
```

Naively forwarding chunks to the browser meant users would see `RECOMMENDATIONS:` and a half-formed JSON object flash into their chat bubble before disappearing. Worse, `RECOMMENDATIONS` could split across two SSE chunks (`...RECOMMEND` / `ATIONS:...`), defeating naive substring filtering.

The solution lives in `aiClient.js` (custom SSE parser) and `chatService.sendMessageStream` (visibility logic):

- A hand-rolled SSE reader that buffers across `read()` boundaries, accumulates `data:` lines until a blank-line terminator, and yields concatenated text from `candidates[0].content.parts[*].text`.
- A **rolling holdback** of 48 characters in the streaming layer: we only flush text up to `aiResponse.length - 48`, ensuring no partial header like `RECOMMEND` is ever sent.
- A regex (`/(?:^|\n)\s*(RECOMMENDATIONS|SOURCES)\s*:/i`) that finds the structured-block boundary as soon as it appears, after which we stop streaming entirely and parse the metadata server-side via a **balanced-brace JSON extractor** (`extractBalancedJsonSlice` in `responseParser.js`) that tolerates strings, escapes, and multiple consecutive `SOURCES:` objects emitted by some Gemini revisions.
- A non-stream fallback if the SSE transport yields no body, so the client never sees an empty bubble.

The result: clean visible prose to the user, perfect JSON to the server, and recommendations + cited sources hydrated into the UI panel after the message lands.

### 2. Reliable asset-class detection across five inconsistent bank CSV formats

The five Canadian banks' brokerage CSV exports disagree on almost everything: column names, ticker suffixes (`-TC`, `-VC`, `:CA`, `.UN-TC`, `/PA-TC`), whether they label assets at all, and how they encode quantities. A naive "if `securityType === 'ETF'` else mutual fund" rule was wrong on roughly a quarter of real exports we tested.

The decision tree in `BankCsvParser.determineAssetClass(...)` layers five signals to break ties:

1. **Suffix translation** — `cleanTicker` rewrites BMO's `XEQT-TC` → `XEQT.TO`, `.UN-TC` → `.UN`, etc., so downstream regex matching works uniformly.
2. **Explicit metadata** — if the CSV has a `securityType` column and it contains "etf" or "mutual fund", trust it.
3. **Ticker shape regex** — `^[A-Z]{3,4}\d{3,5}(\.[A-Z]{1,2})?$` matches Canadian mutual-fund codes (e.g. `MAW104`, `TDB161`); `^[A-Z]{1,4}(\.TO|\.V|:CA|:US)?$` matches TSX-style ETF tickers.
4. **Description fallback** — descriptions like *"BMO ETF Portfolio"* combined with a mutual-fund-shaped ticker still resolve to mutual fund (these are wrap products).
5. **Volumetric precision tie-breaker** — if the regex is ambiguous, check the share quantity: ≥ 3 decimal places almost always means a mutual fund (banks accept fractional shares to the thousandths there) versus integer/whole-share ETF holdings.

This single class is unit-tested with fixtures from each bank, and adding a sixth brokerage is an isolated change: subclass `BankCsvParser`, declare `requiredHeaders`, implement `parse`, add to `CsvParserRouter`. No churn anywhere else in the system.

---

## 🖼️ Screenshots / Demo

> 🔗 **Live demo:** https://finwise-frontend-7qbw.onrender.com/

> _Screenshots:_
> - 🏠 Landing page
> - 📋 Profile questionnaire
> - 💬 AI chat with streamed response + recommendation panel
> - 📊 Portfolio dashboard with imported holdings
>
> *Add image links here, e.g.* `![Chat](docs/screenshots/chat.png)`

---

## 🚀 Getting Started

### Prerequisites
- Node.js **20+** and npm
- A MongoDB Atlas cluster with a vector search index on the `Chunks` collection
- Google Gemini API key(s) — one for embeddings, one for generation
- *(Optional)* Python 3.10+ if you want to re-run the mutual-fund scrapers
- *(Optional)* Docker + Docker Compose for containerized local dev

### 1. Clone

```sh
git clone https://github.com/<your-username>/finwise.git
cd finwise
```

### 2. Configure environment variables

**`server/.env`** (see `render.env.example` for every key):

```env
NODE_ENV=development
PORT=9000
CLIENT_URL_DEVELOPMENT=http://localhost:5173
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/FinWise
SESSION_SECRET_KEY=<random-string>
JWT_SECRET=<random-string>
OAUTH_CLIENT_ID=<google-oauth-client-id>
OAUTH_SECRET_KEY=<google-oauth-client-secret>
MAILTRAP_API_TOKEN=<mailtrap-token>
```

**`client/.env`**:

```env
VITE_SERVER_URL_DEVELOPMENT=http://localhost:9000
VITE_OAUTH_CLIENT_ID=<google-oauth-client-id>
VITE_CHAT_RESPONSE_MODE=streaming
```

### 3. Install & run (two terminals)

```sh
# Terminal 1 — backend
cd server
npm install
npm run dev      # nodemon + dotenv on port 9000
```

```sh
# Terminal 2 — frontend
cd client
npm install
npm run dev      # Vite on port 5173
```

Open the URL Vite prints (default http://localhost:5173).

### 4. Run with Docker (optional)

```sh
docker compose up --build
# Frontend: http://localhost:5173 (nginx-served SPA)
# Backend:  http://localhost:9000
```

### 5. Tests

```sh
# Frontend
cd client
npm run test:unit            # Vitest, unit only
npm run test:integration     # Vitest, integration suites
npm run test:coverage        # full coverage report
npx cypress open             # E2E

# Backend
cd server
npm run test:unit            # Jest unit
npm run test:integration     # Jest + Supertest + mongodb-memory-server
npm run test:security        # security-focused config (jest.config.security.js)
```

### 6. Refresh the mutual-fund dataset (optional)

```sh
cd server/scrapper
pip install -r requirements.txt
python fetch_all.py          # scrapes 40 funds across RBC/BMO/CIBC/TD
python upload.py             # uploads to MongoDB FinWise.mutual-funds
```

---

## 🔮 Future Improvements

1. **Real Plaid integration.** The `PlaidConnectPage` and connection card UI are wired up but the handler is currently a placeholder. Replacing it with Plaid Link + an `/api/plaid/exchange` route would let users sync holdings automatically instead of uploading CSVs, and would unlock things like balance-aware rebalancing suggestions.
2. **Per-user article personalization.** Today, vector retrieval mixes the user's profile into the embedding query (`buildArticleRetrievalQuery`) but the corpus is global. Adding a *re-ranker* (e.g. cross-encoder over the top 50 candidates) and per-user feedback ("this article was helpful") would meaningfully improve answer quality on long-tail questions.
3. **TypeScript migration + a shared `@finwise/contracts` package.** The classifier output, `parseAIResponse` shape, and chat API responses are already documented with JSDoc, but moving to TS and sharing types between `client` and `server` would eliminate a class of "I changed the field name in the backend" bugs and make onboarding new contributors faster.
4. **Observability.** Structured logging (pino) with request IDs, plus Gemini token-usage and vector-search latency metrics, would make the streaming path much easier to debug in production. The CI pipeline already gates on `npm audit`; the next step is runtime SLOs.

---

## 🗒️ Notes

This project was originally developed as a team capstone for one of my SWE course and is presented here as part of my engineering portfolio.
