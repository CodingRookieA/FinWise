# Finwise — Iteration 2: Review & Retrospect

- **When:** March 8, 2026
- **Where:** Online

---

## Introduction

FinWise is a Canadian-focused AI financial agent designed to give users personalized, practical guidance based on their real situation. Users can either log in or continue as a guest, then build a profile through a short questionnaire (income, goals, risk tolerance, etc.) and optionally add their investment portfolio (stocks, ETFs, mutual funds). Using these two sources of information — personal profile and holdings — FinWise tailors its responses and explanations to the user, and supports recommendations by searching trusted, authoritative articles so answers are grounded and transparent.

---

## Process — Reflection

### What Went Well

**1. Strategic Sprint Segmentation for Mutual Funds & ETFs**
We split Mutual Funds and ETFs into separate sprints to allow for better focus. This sprint prioritized Mutual Funds, enabling each team member to develop a deeper understanding of the asset class and contribute relevant articles to our database infrastructure.

**2. Vector Database Implementation for Article Storage**
We implemented a vector database to store chunked and tokenized article content. This improves search efficiency and relevance compared to storing raw text in MongoDB.

**3. Improved UI Consistency & Design**
We enhanced visual consistency across the platform — homepage, login, and profile/portfolio pages — resulting in a more polished and cohesive interface.

**4. Prompt Engineering Pipeline**
Established the prompt-building pipeline using our article and mutual funds knowledge bases. Key decisions:
- Similarity vector search to retrieve the top 5 most relevant chunks (saves tokens, improves relevance)
- Pre-screening mutual fund data to filter funds by the user's risk tolerance and minimum investment amount, ensuring personalization and token efficiency

### What Didn't Go as Planned

**1. Canadian Mutual Funds Data Sourcing**
We underestimated the complexity of sourcing comprehensive Canadian mutual fund data. No free API provides complete coverage, leaving us with two options: manually research and hardcode fund information (extremely labor-intensive) or find alternative solutions. This highlighted the need for earlier API research and data availability assessment.

**2. AI Model Selection & Limitations**
We transitioned from Perplexity AI to Claude after policy changes made Perplexity unsuitable for our use case. Perplexity also lacked image input support, which conflicted with our requirements. Claude is the more appropriate choice going forward.

### Planned Changes
None.

---

## Product — Review

### Completed

- Researched and curated mutual fund articles
- Implemented a vector database to store, chunk, and embed articles for semantic search
- Developed web scraping solutions to collect mutual fund data (temporary solution)
- Implemented email/password authentication with email verification
- Enhanced profile interface with expanded questionnaire
- Enhanced portfolio interface with expanded mutual funds options

### Not Completed

**Plaid Connection**
Due to an unforeseen capacity change, the Plaid integration could not be completed. Currently only the frontend (visual representation) is built — functionality will be wired in a later sprint. Further research into the Plaid API is still needed.

---

## Meeting Highlights — Going into Sprint 3

**1. Expand Asset Coverage to ETFs**
Research and integrate ETF data sources, including reliable APIs. Process and embed ETF data into the vector database alongside mutual fund content so the AI can provide recommendations across both asset classes.

**2. Enhance Knowledge Base Quality**
Identify and integrate more non-biased, authoritative financial articles. Prioritize editorial quality and financial accuracy to reduce potential bias in AI responses.

**3. Complete Plaid Integration**
Wire the existing Plaid frontend with actual API functionality. Investigate how the completed integration can feed into the existing AI chat pipeline.
