# FinWise — Iteration 3 Review & Retrospect

**When:** March 22, 2026  
**Where:** Online  

---

## Process — Reflection

### Introduction
FinWise is a Canadian-focused AI financial agent designed to give users personalized, practical guidance based on their real situation. Users can log in or continue as a guest, build a profile (income, goals, risk tolerance), and optionally upload their investment portfolio (stocks, ETFs, mutual funds).  

The system tailors responses using this data and supports recommendations with trusted external sources.

---

## Decisions That Turned Out Well

### 1. Simplified Profile Page
Removed ETF and mutual fund subsections, replacing them with a single preference question.  
➡️ Result: clearer, more user-friendly experience.

### 2. Added Chat Memory
Implemented memory of previous conversations.  
➡️ Result: improved context and response quality.

### 3. Portfolio Uploads
Enabled CSV uploads from banks.  
➡️ Result: more accurate, personalized AI responses.

### 4. Expanded Test Coverage
Added:
- Unit tests
- Integration tests
- End-to-end tests  

➡️ Result: improved reliability and quality.

### 5. Formatted Chat Replies
Added Markdown rendering in frontend.  
➡️ Result: cleaner, more readable responses.

---

## Decisions That Didn’t Go Well

### 1. Plaid Integration
- Too many setup steps  
- Users hesitant due to privacy concerns  

➡️ Decision: removed Plaid, switched to CSV uploads.

### 2. Too Many Profile Fields
- Overly detailed ETF/mutual fund questions  
- Confusing for beginner users  

➡️ Result: reduced clarity → later simplified.

---

## Planned Changes
None.

---

## Product — Review

### Completed Goals
- ETF article research and curation  
- ETF API integration and expiration handling  
- Backend pipeline updates for ETF context  
- Portfolio frontend updates for ETFs  
- Chat history deletion  
- Stock input validation  
- AI response formatting  
- Frontend testing (unit + integration)  
- Backend testing (unit + integration)  
- End-to-end testing  

---

### Incomplete Goals

**Chat History Injection**
- Not completed due to time constraints and testing effort.

---

## Meeting Highlights / Next Iteration Focus

### 1. Chat History Injection
Implement conversation history in AI prompts:
- Maintain context across messages  
- Reduce repetition  
- Improve personalization  

### 2. Better Data Sources
- Identify authoritative financial sources  
- Reduce bias and improve accuracy  

### 3. Improve RAG Pipeline
- Add re-ranking  
- Optimize context usage  
➡️ Goal: higher-quality AI responses