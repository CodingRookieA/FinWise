# FinWise — Iteration 4: Review & Retrospect

- **When:** April 4th
- **Where:** Online

---

## Introduction

FinWise is a Canadian-focused AI financial agent designed to give users personalized, practical guidance based on their real situation. Users can either log in or continue as a guest, then build a profile through a short questionnaire (income, goals, risk tolerance, etc.) and optionally add their investment portfolio (stocks, ETFs, mutual funds).

Using these two sources of information — your personal profile and your holdings — FinWise tailors its responses and explanations to you, and supports recommendations by searching trusted, authoritative articles so the answers are grounded and transparent.

---

## Process — Reflection

### Decisions That Turned Out Well

**1. New Features to Chat**
When the chat recommends stocks, it now displays them in a table so users can directly add selected stocks to their portfolio. We also added a reference table that is only shown when the user chooses to view it, which keeps the interface clean and focused.

**2. Early CI/CD Deployment**
We deployed the application to the cloud early, instead of keeping it local-only. This turned out to be a good decision because our workflow is large and complex, and early deployment helped us identify and resolve integration issues sooner.

---

### Decisions That Did Not Turn Out as Well as We Hoped

**1. Express Session Issues (Login Not Working on Mobile)**
Using Express sessions caused login issues on mobile devices, which affected reliability for some users.

**2. Late Improvement to General Response Quality**
We did not identify early enough that the system's general answers needed to be more thorough. This led to a late-sprint change, which could have introduced deployment risks. Fortunately, no major deployment issues occurred.

---

### Planned Changes
None.

---

## Product — Review

### Goals and Tasks Completed

> Refer to the release plan for full context.

- [x] Modify classifier behavior so it can identify when a request is general.
- [x] Set up a separate prompting strategy for general mode so the AI can provide more thorough answers.
- [x] Chunk and embed new articles for general advising, covering different age groups and life stages.
- [x] Improve the recommendation table by making it collapsible.
- [x] Add a sources table for general advice responses.
- [x] Deployment: set up CI to run unit tests and lint checks on every push.
- [x] Deployment: set up CI to run security testing on every push.
- [x] Deployment: finalize Dockerfiles for backend and frontend, and integrate them into CI so the latest images are pushed to Docker Hub on every push.
- [x] Deployment: configure runtime to pull the latest Docker images and run them.
- [x] Deployment (CD): run smoke tests on canary releases before promoting to production.
- [x] Presentation: create slides for the demo presentation.

### Goals and Tasks Planned but Not Completed
None.

---

## Meeting Highlights

Going into the next iteration, our main insights are:

1. **Polish UI** for pitching to potential funders.
2. **Refine general chat behaviours** so that answers to general questions are more concise, structured, and reliable.
3. **Add follow-up flashcards** to keep users engaged with the application.
4. **Continue refining** the application overall.