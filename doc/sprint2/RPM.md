# Release Plan
**Release Name:** Vers. 0.02

---

## Release Objectives

**Mutual Fund Article Pipeline**
By end of Sprint 2, have mutual fund articles scraped, chunked, embedded, and queryable by the AI chat system.

**Email-Based Authentication with Verification**
By end of Sprint 2, users register and log in with email/password, and can't access the platform until their email is verified.

**Vector Database Setup**
By end of Sprint 2, vector database is live, populated with mutual fund content, and wired into the AI chat prompt pipeline.

**Profile Interface Update**
By end of Sprint 2, the profile questionnaire has more questions and the frontend reflects those changes.

**Plaid Integration Research**
By end of Sprint 2, we have a clear written summary of what Plaid can and can't do for fetching mutual fund and ETF data, and a recommendation on how to approach it next sprint.

---

## Specific Goals

**Upgrade Authentication**
Move from basic login to email/password with email verification. Unverified users can't get in.

**Build the Mutual Fund Data Pipeline**
Research sources, scrape articles, chunk and embed them, store in vector DB. This is what powers mutual fund answers in the AI chat.

**Expand User Profile**
Add more questions to capture better financial context. Update the frontend to match.

**Research Plaid**
Figure out if and how Plaid can pull mutual fund and ETF data. Write up what we find.

---

## Metrics for Measurement

**Email Authentication**
- Verification email delivery rate: % of users who get the verification email within 60 seconds
- Verification completion rate: % of users who actually click and verify
- Login success rate: % of successful logins for verified accounts

**Mutual Fund Pipeline**
- Scraping success rate: % of target sources scraped without errors
- Embedding success rate: % of chunks successfully embedded and stored
- Retrieval relevance: % of chat queries that pull back at least one relevant chunk

**Vector Database**
- Total chunks ingested by end of sprint
- Average query response time (target: under 500ms)

**Profile Update**
- Form completion rate: % of users who finish the updated questionnaire without errors
- Data storage success rate: % of responses correctly saved to the database

**Plaid Research**
- One written findings doc covering what Plaid supports, how auth works, data format, and a recommendation for next steps

---

## Release Scope

### Included Features

**Email/Password Login with Verification**
Users register with email and password. They get a verification email and can't log in until confirmed. Replaces Sprint 1 basic login.

**Mutual Fund Web Scraping**
Scrape mutual fund articles from identified sources to feed the embedding pipeline.

**Vector Database with Embedded Articles**
Chunk and embed the scraped articles, store them in a vector DB, and hook it into the AI chat so it can pull relevant content when answering questions.

**Profile Interface Update**
More questions added to the profile form to capture better financial context. Frontend updated accordingly.

**Plaid Research Report**
Plain-text writeup on Plaid's API — what data it exposes, how authentication works, known limitations, and whether we should integrate it in Sprint 3.

### Excluded Features
- Actual Plaid integration (research only this sprint)
- ETF article pipeline (comes after Plaid research)
- Portfolio creation/editing UI
- Any advanced chat features (summarization, long-term memory, etc.)

### Bug Fixes
Sprint 1 bugs addressed as capacity allows. Nothing formally scoped.

---

## Non-Functional Requirements

**Performance**
- Vector DB queries under 500ms on average
- Verification emails delivered within 60 seconds of registration
- AI response time stays within the Sprint 1 benchmark of 3 seconds, even with retrieval added

**Security**
- Unverified users can't access any protected routes
- Verification tokens are single-use and expire after a set time
- No credentials or financial data exposed in logs or API responses

**Usability**
- Verification flow has clear instructions and feedback at each step
- New profile questions fit naturally into the existing UI
- Auth errors tell users specifically what went wrong

**Reliability**
- Email delivery failures show a retry prompt, not a silent error
- Vector DB stays stable during chat sessions
- Profile updates show immediately in both UI and database

---

## Dependencies and Limitations

### External Dependencies
- Email delivery service (SendGrid, Resend, etc.) — outages affect verification
- Plaid developer sandbox — needed for research
- Vector database service (Pinecone, pgvector, etc.) — needed for embedding pipeline
- Target websites for scraping — structure changes can break scrapers
- LLM embedding API — rate limits can slow ingestion

### Known Limitations
- No live Plaid integration this sprint, research only
- ETF data pipeline not included
- Vector retrieval is basic, no ranking or relevance tuning yet
- Profile context improves answers but AI still doesn't adapt dynamically over time
- No re-send flow for expired verification emails if we run out of time
