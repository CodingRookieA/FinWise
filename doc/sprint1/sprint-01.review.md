# Finwise - Iteration 1 Review & Retrospect

**When:** Feb 15, 2026  
**Where:** ONLINE

---

## Process - Reflection

### Introduction
FinWise is a Canadian-focused AI financial agent designed to give users personalized, practical guidance based on their real situation. Users can either log in or continue as a guest, then build a profile through a short questionnaire (income, goals, risk tolerance, etc.) and optionally add their investment portfolio (stocks, ETFs, mutual funds). Using these two sources of information—your personal profile and your holdings—FinWise tailors its responses and explanations to you, and supports recommendations by searching trusted, authoritative articles so the answers are grounded and transparent.

### Decisions that turned out well

1.  **Splitting features by frontend and backend together**  
    This reduced integration surprises (e.g., mismatched API routes/response shapes) and let us demo real progress sooner. For example, the questionnaire/profile workflow was built end-to-end: backend meta endpoint → dynamic field rendering → save via PATCH, which made testing and debugging much faster.

2.  **Standardizing the UI with a shared `theme.js` and MUI components**  
    This improved consistency and speed: instead of redesigning styles per page, we reused the same typography, spacing, and component styles. As a result, pages look cohesive, and it’s easier to maintain UI changes (one theme update affects the whole app).

3.  **Frequent small commits and regular pushes for version control**  
    Small commits made it easier to review changes, isolate bugs, and roll back safely when something broke. It also improved team collaboration by reducing merge conflicts and keeping the branch history understandable.

### Decisions that did not turn out as well as we hoped

1.  **Failure to agree early on a canonical user key (UserId vs. Email)**  
    This resulted in back-and-forth changes and uncertainty when wiring profile documents to accounts. It also made testing harder because different parts of the system assumed different identifiers.

2.  **Lack of "done" criteria for UI polish vs. functionality**  
    We spent time tuning layout/styling (grid columns, sidebar width, component spacing) while some feature-level tasks still needed decisions. We should’ve timeboxed UI refinements until core flows were stable.

### Planned Changes
*   **None**

---

## Product - Review

### Goals and/or tasks that were met/completed:
*Refer to release plan:*
*   **User Authentication** (Login / Logout)
*   **Pre-screen Questionnaire**
*   **Basic AI Chat Functionality**
*   **Chat History Persistence**
*   **Profile feature**
*   **Portfolio feature**

### Goals and/or tasks that were planned but not met/completed:
*   **None**

---

## Meeting Highlights

Going into the next iteration, our main insights are:

1.  **Ground answers in trustworthy sources via a vector database**  
    We should store and index authorized articles in a vector database so the agent can retrieve relevant passages and cite them when responding. This will make answers more reliable, reduce hallucinations, and keep the product aligned with our “transparent + grounded” goal.

2.  **Improve UI consistency and polish across the app**  
    We should continue standardizing components and layout (using MUI + `theme.js`) so profile, questionnaire, portfolio, and chat feel like one cohesive product. Consistent spacing, typography, and reusable components will also speed up future feature development.
    