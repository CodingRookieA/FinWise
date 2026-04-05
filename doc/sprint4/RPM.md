# Release Plan
## Release Name: V 0.04

---

## Release Objectives

### AI General Advisory Enhancement
By the end of Sprint 4, improve the AI chat to handle general financial questions more thoroughly by modifying the classifier to distinguish general from personalized requests, implementing a dedicated prompting pipeline for general mode, and embedding new article content covering different life stages and age groups.

### UI & Transparency Improvements
By the end of Sprint 4, improve the user-facing recommendation experience by making the recommendation table collapsible and adding a sources table to general advice responses so users can manage information density and verify the content they receive.

### Deployment Infrastructure
By the end of Sprint 4, establish a complete CI/CD pipeline including unit testing, linting, and security scanning on every push; Dockerize both the backend and frontend with automated image publishing to Docker Hub; configure the run environment to draw from the latest Docker images; and implement canary release smoke testing before any production promotion.

### Presentation
By the end of Sprint 4, produce a presentation deck that effectively showcases FinWise's features and progress for the final demo.

---

## Specific Goals

### Improve AI General Advisory Quality
Extend the AI advisor beyond personalized portfolio-based responses to handle general financial questions across a range of topics. This involves classifier changes, a new prompting strategy for general mode, and embedding new article content covering different age groups and life stages.

### Increase UI Transparency and Usability
Allow users to collapse the recommendation table to reduce visual clutter, and surface sources alongside general advice responses so users can explore and verify the information they receive.

### Establish a Production-Grade CI/CD Pipeline
Move from manual testing and deployment to a fully automated pipeline. Every push should trigger unit tests, linting, and security scanning. Docker images for both services should be built and published automatically, and canary releases should be validated with smoke tests before reaching production.

### Deliver a Demo Presentation
Prepare clear, concise slides that walk through FinWise's core features and demo flow for stakeholders.

---

## Metrics for Measurement

### AI General Advisory
- **General request classification accuracy:** Percentage of general financial queries correctly identified by the updated classifier.
- **Article retrieval rate:** Percentage of general mode responses that successfully surface at least one embedded article as a source.
- **Response thoroughness:** Qualitative assessment of general mode response depth compared to personalized mode.

### UI & Transparency
- **Collapsible table adoption:** Percentage of sessions where users interact with the collapse/expand toggle.
- **Sources table display rate:** Percentage of general advice responses accompanied by a populated sources table.

### CI/CD & Deployment
- **Pipeline pass rate:** Percentage of pushes where all CI checks (unit tests, linting, security scan) pass.
- **Image publish success rate:** Percentage of pushes that result in a successfully built and published Docker image to Docker Hub.
- **Canary smoke test pass rate:** Percentage of canary releases that pass all smoke tests before production promotion.
- **Security scan coverage:** Percentage of pushes where security scanning completes and produces a result.

---

## Release Scope

### Included Features

| Feature | Description |
|---|---|
| **AI Classifier Update** | Modify the intent classifier to distinguish between general financial questions and personalized advice requests, routing each to the appropriate prompting pipeline. |
| **General Mode Prompting** | Implement a separate system prompt and prompting strategy for general mode, enabling more thorough and educational responses. |
| **Article Embedding for General Advice** | Source, chunk, and embed new financial articles covering diverse life stages and age groups for retrieval during general advisory sessions. |
| **Collapsible Recommendation Table** | Add a collapse/expand toggle to the recommendation table so users can manage information density on screen. |
| **Sources Table for General Advice** | Display a sources table alongside general advice responses, showing article title, publication, and link where available. |
| **CI: Unit Testing and Linting** | Configure the CI pipeline to run unit tests and linting on every push, blocking merges on failure. |
| **CI: Security Testing** | Add automated security scanning (dependency audit and/or SAST) to the CI pipeline on every push, with pipeline failure on high or critical findings. |
| **Dockerfiles and CI Image Publishing** | Write Dockerfiles for both backend and frontend; configure CI to build and push the latest images to Docker Hub on every successful push, tagged with both `latest` and the commit SHA. |
| **Run Environment: Docker Image Pull** | Configure the run environment to always pull from the latest Docker Hub images for both backend and frontend, with no hardcoded versions. |
| **CD: Canary Smoke Tests** | Implement a canary release stage in the CD pipeline; smoke tests must pass against the canary environment before promotion to production. |
| **Demo Presentation Deck** | Create slides covering core features, a live demo flow outline, and a visually consistent layout ready for the demo date. |

### Excluded Features
All features not listed above are deferred to future sprints. This includes advanced portfolio analytics, real-time market data streaming, multi-currency support, mobile-native applications, and expanded Plaid integration beyond what was delivered in Sprint 3.

### Bug Fixes
To be identified during sprint execution and testing phases.

---

## Non-Functional Requirements

### Performance Requirements
| Requirement | Target |
|---|---|
| AI response latency | ≤ 3 seconds on average under normal load, including general mode with article retrieval |
| Page load time | ≤ 2 seconds on a standard desktop browser |
| Docker image build time | Within a reasonable bound to avoid blocking developer workflows |
| Canary promotion time | Smoke tests shall complete within 5 minutes of deployment |

### Security Requirements
- **CI security scanning:** All pushes shall be scanned for high and critical vulnerabilities; findings shall block the pipeline until resolved.
- **Authenticated access control:** All portfolio, chat, and advisory endpoints shall require valid session authentication.
- **Docker image integrity:** Images pushed to Docker Hub shall be tagged with the commit SHA to ensure traceability and prevent unintended overwrites.
- **Input validation:** All user inputs shall continue to be validated server-side.

### Usability Requirements
- **Response readability:** All AI responses in both personalized and general mode shall be parsed and formatted before display; no raw LLM output visible to users.
- **Source attribution:** General advice responses shall always be accompanied by a sources table when article content is retrieved.
- **Collapsible UI:** The recommendation table shall preserve its collapsed or expanded state within a session.
- **Validation feedback:** Invalid inputs shall display clear, user-readable error messages.

### Reliability Requirements
- **CI pipeline stability:** The CI pipeline shall produce consistent, reproducible results across equivalent commits.
- **Canary safety gate:** No release shall reach production without passing smoke tests in the canary environment.
- **Docker fallback:** If the latest Docker image cannot be pulled, the run environment shall surface a clear error rather than silently falling back to a stale image.
- **Regression coverage:** All Sprint 1, Sprint 2, and Sprint 3 functionality shall continue to pass automated tests after Sprint 4 changes.

---

## Dependencies and Limitations

### External Dependencies
| Dependency | Notes |
|---|---|
| **Third-Party LLM API** | General mode responses depend on the external LLM provider. Context window limits may constrain how much article content can be injected per request. |
| **Article Sources** | Embedded article content is limited to publicly available sources; paywalled or proprietary research is excluded. |
| **Docker Hub** | Image publishing depends on Docker Hub availability and valid CI credentials configured in repository secrets. |
| **CI/CD Platform** | Pipeline execution depends on the availability of the chosen CI platform (e.g. GitHub Actions). |

### Known Limitations of Sprint 4
- General mode classification accuracy may require iterative tuning as edge cases between general and personalized requests are discovered during testing.
- Article embedding coverage is limited to sources available and ingested during the sprint; broader coverage is deferred to future sprints.
- Canary smoke tests will cover core user flows only; exhaustive end-to-end coverage is deferred to a future sprint.
- The demo presentation covers Sprint 4 deliverables and selected prior features; a full product walkthrough is out of scope for this sprint.