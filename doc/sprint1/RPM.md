# Release Plan

**Release Name:** Version 0.01

## Release Objectives
Detail the primary goals for the sprint N release. Each objective should be Specific, Measurable, Achievable, Relevant, and Time-bound (SMART).

### User Authentication (Login / Logout)
By the end of Sprint 1, implement and test secure login and logout functionality, ensuring users can successfully authenticate and terminate sessions with persistent authentication across page refreshes.

### Pre-screen Questionnaire
By the end of Sprint 1, enable users to complete a required pre-screen questionnaire, store their responses, and include this financial context in all AI chat prompts.

### Basic AI Chat Functionality
By the end of Sprint 1, deliver a functional AI chat interface using an LLM wrapper that allows users to send messages and receive responses within acceptable response times in the development environment.

### Chat History Persistence
By the end of Sprint 1, persist AI chat histories for authenticated users and allow conversations to be correctly reloaded and displayed in chronological order.

---

## Specific Goals

### Establish Secure User Access
Enable users to securely access the web application through login and logout functionality, ensuring that only authenticated users can interact with the AI financial advisor.

### Capture Initial User Financial Context
Provide a pre-screen questionnaire that gathers essential user financial information required to contextualize and personalize AI-generated financial advice.

### Enable Core AI Advisor Interaction
Allow users to engage in basic conversational interactions with the AI-powered financial advisor through a web-based chat interface, serving as the foundational AI wrapper for future enhancements.

### Support Conversation Continuity
Ensure user conversations with the AI advisor are stored and retrievable, allowing users to view previous messages and maintain continuity within a session.

---

## Metrics for Measurement

### User Authentication (Login / Logout)
*   **Login success rate:** Percentage of successful login attempts out of total login attempts recorded by the system.
*   **Logout success rate:** Percentage of user sessions successfully terminated when a logout action is initiated.
*   **Session persistence accuracy:** Percentage of authenticated sessions that remain valid across page refreshes and navigation events.

### Pre-screen Questionnaire
*   **Pre-screen completion rate:** Percentage of authenticated users who complete all required pre-screen questions before accessing the AI chat.
*   **Data storage success rate:** Percentage of completed pre-screen questionnaires that are correctly stored and retrievable from the database.
*   **Prompt injection consistency:** Percentage of AI chat sessions where pre-screen data is successfully included in the prompt sent to the LLM.

### Basic AI Chat Functionality
*   **Message delivery success rate:** Percentage of user messages that receive an AI-generated response without system errors.
*   **Average AI response time:** Mean time (in seconds) between user message submission and AI response generation, measured through application logs.
*   **Session stability:** Number of chat sessions completed without crashes, timeouts, or unhandled exceptions.

### Chat History Persistence
*   **Message persistence rate:** Percentage of user and AI messages successfully stored in the database after being sent or generated.
*   **Chat reload accuracy:** Percentage of sessions where full chat history is correctly reloaded after a page refresh or user re-login.
*   **Message ordering accuracy:** Percentage of sessions where messages are displayed in the correct chronological order.

---

## Release Scope
Outline what is included in and excluded from the release, detailing key features or improvements, bug fixes, non-functional requirements, etc.

### Included Features
*   **Login / Logout / Register**
    *   User should be able to create an account and log in to start chatting
*   **Questionnaire**
    *   Users should be able to complete a 3-questioned sheet for profile and portfolio info to get customized answers.
*   **Profile info / portfolio information**
    *   User should be able to edit the profile information, and create a portfolio
*   **Chat with AI** (basic functionality at this point)

### Excluded Features
All other features that are not included. We believe that those features should be done in the next few sprints due to time constraints.

### Bug Fixes
*   List major bug fixes included in the release.
*   Prioritize them based on impact and urgency.
*   **N/A**

---

## Non-Functional Requirements

### Performance Requirements
*   **AI response latency:** The system shall return AI-generated responses within **3 seconds on average** in the development environment under normal usage.
*   **Page load time:** Authentication, pre-screen, and chat pages shall load within **2 seconds** on a standard desktop browser.
*   **Chat history retrieval time:** Previously stored chat messages shall be retrieved and displayed within **1 second** after page refresh or user re-login.

### Security Requirements
*   **Authenticated access control:** Only authenticated users shall be able to access the pre-screen questionnaire, AI chat, and chat history.
*   **Session security:** User sessions shall expire upon logout and prevent access to protected resources without re-authentication.
*   **Sensitive data protection:** User credentials and pre-screen financial data shall not be exposed in client-side logs or network responses.

### Usability Requirements
*   **User flow completeness:** Users shall be able to complete the flow **login → pre-screen → AI chat** without encountering blocking errors.
*   **Error feedback clarity:** Authentication and chat errors shall display clear, user-readable error messages indicating the issue.
*   **Conversation readability:** Chat messages shall be clearly differentiated between user and AI responses and displayed in chronological order.

### Reliability Requirements
*   **System stability:** The application shall support continuous chat interaction without crashing during normal usage.
*   **Data consistency:** Messages displayed in the chat UI shall match the messages stored in the database.
*   **Graceful failure handling:** Temporary AI service failures shall result in informative error messages rather than application crashes.

---

## Dependencies and Limitations

### External Dependencies
*   **Third-Party LLM API Availability:** The AI chat functionality depends on the availability and stability of an external large language model (LLM) API. Service outages, rate limits, or latency from the provider may affect response times or system availability.
*   **Authentication Services:** User authentication relies on external authentication libraries or services. Changes in these services or unexpected downtime may impact login and logout functionality.
*   **Database Infrastructure:** Chat history and pre-screen data persistence depend on the availability and performance of the database service. Database outages or connection issues may affect data storage and retrieval.
*   **Network Connectivity:** Stable internet connectivity is required for API communication between the web application, backend services, and external AI providers.

### Known Limitations of the Current Release
*   **Limited AI Intelligence:** The AI advisor is implemented as a basic wrapper around an existing LLM and does not include fine-tuning, domain-specific reasoning, or advanced financial validation.
*   **No Real Financial Advice Validation:** AI responses are not verified against real-time market data, regulatory requirements, or certified financial guidelines.
*   **Basic Personalization:** Personalization is limited to pre-screen questionnaire data and does not yet adapt dynamically based on ongoing user behavior.
*   **Single-Session Focus:** Chat history is maintained at a basic level and does not yet support advanced features such as conversation summarization, cross-session analytics, or long-term memory.
*   **Limited Error Recovery:** The system provides basic error handling but does not include advanced retry mechanisms or fallback AI models.

---

## Organizational Implementation Thoughts
*The following sections are thoughts on how to complete the operational requirements for an organizational setting:*

*   **Detailed Instruction - Steps to Carry Out the Deployment**
*   **PIV (Post Implementation Verification) Instruction**
*   **Post Deployment Monitoring**
*   **Roll Back Strategy**