# FinWise System Architecture Report

## Technology Stack

### Frontend (Client)
- **Framework**: React 19.2.0 with Vite 7.2.4 build tool
- **UI Library**: Material-UI (MUI) v7 with Emotion styling
- **Routing**: React Router DOM v7
- **Authentication**: Google OAuth via @react-oauth/google
- **Runtime**: Modern JavaScript (ES Modules)

### Backend (Server)
- **Runtime**: Node.js with Express 5.2.1
- **Database**: MongoDB with Mongoose ODM 9.1.6
- **Session Management**: express-session with in-memory storage
- **External API**: Perplexity AI (sonar model) for chat functionality
- **Authentication**: Google OAuth 2.0

---

## Frontend-Backend Communication

### Protocol
REST API over HTTP/HTTPS

### Communication Details
- **Method**: Native `fetch()` API (no axios on client)
- **Content-Type**: `application/json`
- **Credentials**: `credentials: 'include'` for session cookies
- **CORS**: Configured to allow cross-origin requests from client URL

### API Endpoints Structure
```
/api/health          - Health check
/api/users/*         - Authentication (Google login, logout, checkAuth)
/api/profile/*       - User profile management
/api/chat/*          - AI chat (send, history, session messages)
/api/assets/*        - Portfolio management (CRUD operations)
```

### Environment-Based Configuration
- **Development**: Client (`http://localhost:5173`) → Server (`http://localhost:9000`)
- **Production**: URLs configured via environment variables (`VITE_SERVER_URL`, `CLIENT_URL`)

---

## Authentication Flow

1. **Client** initiates Google OAuth via `@react-oauth/google` library
2. Google redirects to `/google-redirect` with authorization code
3. **Client** sends code to **Server** (`POST /api/users/googleLogin`)
4. **Server** exchanges code for access token with Google OAuth API
5. **Server** fetches user info from Google, creates/updates MongoDB account
6. **Server** stores user data in express-session (userId, email, name, picture)
7. Session cookie sent to client for subsequent authenticated requests
8. Protected routes use session-based authentication (session.userId check)

---

## Database Architecture

### MongoDB Database
Three main collections:

#### 1. FinWise-accounts (Users)
- **Fields**: email, name, picture, timestamps
- **Authentication**: Google OAuth as sole authentication method

#### 2. Messages (Chat History)
- **Fields**: sender (ref: accounts), content, sessionId, role (user/AI)
- **Features**: 
  - reference field links AI responses to user questions
  - Grouped by sessionId for conversation threads

#### 3. FinWise-assets (Portfolio)
- **Fields**: user_id (ref: accounts), symbol, quantity, timestamps
- **Purpose**: Stores user's investment holdings

### Connection Configuration
- Auto-retry on connection failure (5-second intervals)
- Timeout: 10s server selection, 45s socket
- Write concern: majority with retry

---

## External API Integration

### Perplexity AI API
- **Model**: "sonar" (financial Q&A optimized)
- **Parameters**: Max tokens: 500, Temperature: 0.7
- **Features**: Returns citations with AI responses
- **Purpose**: Financial advisory chat feature
- **Security**: API key stored in server environment variables

### Google OAuth 2.0 APIs
- **Token endpoint**: `oauth2.googleapis.com/token`
- **User info**: `googleapis.com/oauth2/v2/userinfo`
- **Security**: Credentials stored server-side only

---

## Key System Assumptions

### Operating System
**Cross-platform** (Windows, macOS, Linux)
- Client uses Vite (Node-based, OS-agnostic)
- Server uses Node.js (cross-platform)

### Development Environment
- Node.js installed (ES Modules support required)
- npm package manager
- Two terminal instances needed (client + server)
- MongoDB Atlas or local MongoDB instance accessible

### Runtime Requirements
- Port 9000 available for server
- Port 5173 (default Vite) available for client
- Internet connectivity for:
  - Google OAuth
  - Perplexity AI API
  - MongoDB Atlas (if cloud-hosted)

### Security Assumptions
- Session secret stored in environment variables
- OAuth credentials secured server-side only
- CORS restricted to known client URL
- HTTPOnly session cookies (implicit)
- No explicit HTTPS enforcement in code (assumed at deployment)

### Data Flow
- **State management**: React hooks (no Redux/MobX)
- **Real-time updates**: None (polling/manual refresh required)
- **Error handling**: Try-catch with console logging
- **Guest users**: Can chat but no history persistence

---

## Deployment Considerations

### Required Environment Variables
```
MONGODB_URI
SESSION_SECRET_KEY
OAUTH_CLIENT_ID
OAUTH_SECRET_KEY
PERPLEXITY_API_KEY
CLIENT_URL
NODE_ENV
VITE_SERVER_URL (client)
VITE_OAUTH_CLIENT_ID (client)
```

### Build & Start Commands
- **Production build**: `npm run build` (generates static files via Vite)
- **Server start**: `node --env-file=.env index.js`
- **Development**: 
  - Server: `npm run dev` (uses nodemon)
  - Client: `npm run dev` (Vite dev server)

### Infrastructure Notes
- No containerization (Dockerfile) currently configured
- No CI/CD pipeline defined
- Session storage in-memory (will reset on server restart)
