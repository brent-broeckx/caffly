# [PROJECT_NAME_PLACEHOLDER] — MVP Specification & Roadmap

## 1) Project Overview

### Project Name
- **Placeholder:** `[PROJECT_NAME_PLACEHOLDER]`
- **Working codename (optional):** `DevCollab` (temporary)

### Brief Description
A developer-focused communication and collaboration platform that combines **chat**, **code-aware messaging**, and a **PR/CI dashboard** in one minimal interface. It is designed to reduce context switching between chat tools, repository platforms, and CI dashboards.

### Problem It Solves
- Developers currently split work across multiple tools (chat, PR review, CI status, notifications).
- PR and CI visibility is often project-centric, not user-centric.
- Generic chat tools are not optimized for code snippets, diffs, and keyboard-driven workflows.

### Target Users
- Solo developers managing multiple repos.
- Small engineering teams that need fast project-level communication.
- Technical leads/reviewers tracking open PRs and failing pipelines.

### Why They Would Use It
- Centralized workflow: chat + code + PR + CI in one app.
- Faster decisions with contextual repo/project rooms.
- Minimal, keyboard-first UX built for engineering productivity.

---

## 2) MVP Scope

### Scope Definition
The MVP focuses on a **desktop-first experience (Electron)** with a shared **web frontend fallback**, and core integrations through **GitHub** only.

### MVP Features (Critical)
- [ ] **[CRITICAL]** User authentication via GitHub OAuth (sign in/out, token refresh, session handling)
- [ ] **[CRITICAL]** Project rooms linked to repositories
- [ ] **[CRITICAL]** Real-time chat messaging in project rooms
- [ ] **[CRITICAL]** Code-aware messages (syntax highlighting)
- [ ] **[CRITICAL]** Inline diff rendering for pasted/attached code changes
- [ ] **[CRITICAL]** User-centric open PR dashboard (only repos user can access)
- [ ] **[CRITICAL]** Compact CI/test badge panel per project
- [ ] **[CRITICAL]** Backend caching for PR and CI status (to reduce API calls)
- [ ] **[CRITICAL]** Electron shell with native notifications and persistent desktop presence
- [ ] **[CRITICAL]** Core keyboard navigation (room switch, message focus, quick actions)
- [ ] **[CRITICAL]** Basic role/security boundaries (repo access checks, room membership checks)

### MVP Features (Should Have / Optional in MVP Window)
- [ ] **[OPTIONAL-MVP]** Web fallback deployment using same React SPA
- [ ] **[OPTIONAL-MVP]** Basic global search (rooms/messages/PR title)
- [ ] **[OPTIONAL-MVP]** Snippet sandbox (Node + Python, limited execution)
- [ ] **[OPTIONAL-MVP]** Extended keyboard shortcuts (command palette style)

### Explicitly Out of MVP (Later)
- [ ] **[LATER]** GitLab integration
- [ ] **[LATER]** Azure DevOps integration
- [ ] **[LATER]** Jenkins integration
- [ ] **[LATER]** Video/voice collaboration
- [ ] **[LATER]** Real-time pair programming/cursor sharing

---

## 3) Future / Later Features

### Integration Expansion
- [ ] Add GitLab OAuth + repository/merge request adapters
- [ ] Add Azure DevOps OAuth + PR/work item adapters
- [ ] Add Jenkins pipeline status + build detail adapters
- [ ] Add Azure Pipelines and generic CI webhook adapters
- [ ] Add per-provider sync health and rate-limit monitoring

### Collaboration Enhancements
- [ ] Snippet sandbox v2 with resource quotas, templates, and shareable runs
- [ ] Pair programming mode (shared editor presence / follow mode)
- [ ] Advanced search (full-text + filters + semantic ranking)
- [ ] Video/voice room support
- [ ] Threaded discussions for PR-specific conversations

### Product Maturity Features
- [ ] Multi-workspace support
- [ ] Fine-grained notification rules (repo/room/mention/build-fail)
- [ ] Team analytics (PR aging, failed build trends, review latency)
- [ ] Offline queue + sync recovery
- [ ] Plugin/extension marketplace for internal tooling

---

## 4) Technical Stack

### Recommended Stack (MVP)

| Layer | Technology | Why This Choice |
|---|---|---|
| Frontend | React + TypeScript + Tailwind CSS | Fast iteration, component reuse, strong typing, desktop/web parity |
| Desktop Wrapper | Electron | Native notifications, tray/background presence, keyboard hooks |
| Backend API | Node.js + NestJS | Structured architecture, DI, modular boundaries, scalable integration patterns |
| Realtime Transport | WebSocket (Socket.IO or native WS) | Reliable low-latency chat and event updates |
| Database | SQLite (MVP), migration-ready | Simple solo-dev setup with low ops burden; easy local/dev/prod MVP path |
| ORM/DB Access | Prisma or TypeORM | Schema control, migrations, typed data access |
| Auth | GitHub OAuth App | Fastest path to developer identity + repo permissions |
| Code Rendering | Prism.js + CodeMirror (where editing needed) | Lightweight syntax highlighting + optional editor power |
| Diff Rendering | `diff2html` or Monaco diff model | Clear inline diff UX for code-focused messaging |
| Job Queue | BullMQ (optional for MVP), or cron workers | Async polling/sync for PR/CI caches |
| Caching | In-memory + DB cached snapshots | Reduces provider API pressure and improves dashboard speed |
| API Client Layer | Provider-specific adapters | Keeps GitHub logic isolated; enables GitLab/Azure/Jenkins later |
| Validation | Zod / class-validator | Enforces API contracts and input safety |
| Testing | Vitest/Jest + Playwright (critical flows) | Unit + integration + core E2E confidence for solo delivery |
| Packaging | Electron Builder | Desktop release pipeline for Windows/macOS/Linux |

### Environment Placeholders
- `APP_NAME=[PROJECT_NAME_PLACEHOLDER]`
- `GITHUB_CLIENT_ID=[TO_BE_SET]`
- `GITHUB_CLIENT_SECRET=[TO_BE_SET]`
- `JWT_SECRET=[TO_BE_SET]`
- `ENCRYPTION_KEY=[TO_BE_SET]`
- `DATABASE_URL=[TO_BE_SET]`
- `WEB_BASE_URL=[TO_BE_SET]`
- `ELECTRON_DEEP_LINK_SCHEME=[TO_BE_SET]`

---

## 5) Architecture & Layer Design

### High-Level Architecture

```text
Electron Shell
  └─ React SPA (shared with Web)
      └─ Backend API (NestJS)
          ├─ Auth + User Service
          ├─ Chat Service
          ├─ PR Dashboard Service
          ├─ CI Status Service
          ├─ Integration Adapter Layer
          └─ Cache + Persistence Layer (SQLite)
```

### Layered Design Rules
- **Presentation Layer (React/Electron UI):** Only UI logic, no provider-specific API logic.
- **Application Layer (NestJS services):** Orchestration, use-case workflows, policy checks.
- **Domain Layer:** Core entities (User, Room, Message, PullRequest, BuildStatus).
- **Infrastructure Layer:** DB repositories, external API clients, webhook handlers.
- **Integration Layer (Adapters):** GitHub/GitLab/Azure/Jenkins adapters behind shared interfaces.

### Integration Extensibility Strategy
Use a provider abstraction from day 1:

- `VersionControlProvider` interface:
  - `getAccessibleRepos(user)`
  - `getOpenPullRequests(user, repos)`
  - `getRepoMembers(repo)`
- `CiProvider` interface:
  - `getLatestStatuses(repo)`
  - `subscribeWebhook(payload)`
  - `normalizeBuildStatus(raw)`

Benefits:
- New providers can be added by implementing interfaces only.
- Core dashboard/chat logic stays unchanged.
- Reduced regression risk when introducing GitLab/Azure/Jenkins.

### Frontend ↔ Backend ↔ Electron Interaction
- React SPA handles user interactions and renders chat/PR/CI modules.
- Electron adds native shell capabilities (notifications, tray, shortcuts, lifecycle).
- Backend exposes REST + WebSocket endpoints consumed by both Electron and web SPA.
- Shared auth/session model supports both desktop and browser contexts.

### PR/CI Caching Guidance
- Store normalized PR/CI snapshots in DB tables with `fetchedAt` timestamps.
- Use stale-while-revalidate strategy:
  - return cached data quickly,
  - refresh in background based on TTL.
- Track API rate limits and backoff/retry policy per provider.
- Invalidate cache on webhook events for near-real-time updates.

### User-Centric Dashboard Logic
- Dashboard is scoped to:
  - repos user has access to,
  - rooms user is a member of,
  - PRs relevant to that user (author/reviewer/mentioned).
- Prioritize signals:
  - PRs awaiting user review,
  - failing CI on user-related PRs,
  - blocked/aging PRs.

### Security Considerations
- Encrypt OAuth tokens at rest.
- Use scoped OAuth permissions (least privilege).
- Validate webhook signatures.
- Enforce room/repo authorization on every read/write.
- Apply rate limiting + request validation on API endpoints.
- Sanitize rendered code content to prevent XSS.
- Sandbox snippet execution (resource/time limits, network isolation).

---

## 6) UX / UI Principles

### Core UX Direction
- Design language is **modern, futuristic, and developer-centric**, inspired by the reference dashboard aesthetic.
- Keep a **dark-first interface** with subtle neon/tech accents for emphasis and status signaling.
- Preserve a **clean, minimal surface area**: dense information without visual clutter.
- Chat remains a core collaboration surface, with PR/CI context always one interaction away.

### Visual Style & Theme Tokens
- Use a high-contrast dark palette as the base; reserve accent glows for interaction and system state.
- Use semantic accents consistently:
  - success/healthy = green,
  - warning/in-progress = amber,
  - error/failure = red,
  - active selection/focus = cool neon blue/purple.
- Prefer restrained effects (soft borders, subtle gradients, thin glow outlines) over heavy decoration.
- Keep typography crisp and readable at compact sizes for code-heavy workflows.

### Desktop-First + Web Fallback
- Electron is the **primary target runtime** for the MVP (persistent presence, native notifications, tray, shortcuts).
- Optimize interaction patterns for large desktop workspaces and multi-panel workflows.
- Web fallback reuses the same React component system and interaction model for parity.
- Avoid mobile-first compromises in MVP layout decisions; prioritize desktop productivity.

### Layout Blueprint (Reference-Inspired)
- **Left sidebar (persistent):** primary navigation and context switching.
  - Top-level nav: Overview, Pull Requests, CI/CD, Snippets, Team Chat.
  - Project/repo quick access list under nav.
  - Team/user presence shortcuts (optional compact list).
- **Main content workspace (modular cards/panels):**
  - PR panel: prioritized PR cards with owner, status, and quick actions.
  - CI/CD panel: compact pipeline badges with expandable run details.
  - Code snippet panel: syntax-highlighted preview and quick copy/open actions.
  - Team activity panel: recent review, merge, and commit events.
  - Chat panel: always-accessible conversation area with compact composer.
- Design panel containers as independent modules so each can be shown, collapsed, reordered, or expanded.

### Information Density & Interaction
- Default to **compact, scan-friendly cards** with clear metadata hierarchy.
- Show essential details first; reveal deeper context via click, hover, or keyboard shortcut.
- Keep CI badges and PR statuses glanceable with minimal text and strong icon/state contrast.
- Use collapsible/expandable panels so users can focus on chat or code context as needed.
- Ensure notifications are actionable and deep-link directly to PR, failed job, room, or snippet.

### Visual Hierarchy Rules
- PR cards should be visually dominant in review-focused views.
- CI badges should provide immediate health signal and stand out through color + icon semantics.
- Activity feed should be secondary but legible for passive awareness.
- Chat panel should be clearly separated with persistent input affordance and unread indicators.
- Use spacing, border contrast, and heading scale to differentiate panel priority without clutter.

### Keyboard & Accessibility Principles
- Provide keyboard-first workflows for all primary actions:
  - room/project switch,
  - command palette,
  - search,
  - jump to PR/CI/chat panels,
  - mark notification/read states.
- Enable full keyboard traversal of sidebar, cards, lists, and composer without mouse dependency.
- Use strong, high-contrast focus states that remain visible over dark + neon-accent backgrounds.
- Ensure accessible text contrast, target sizes, and semantic labels for screen readers.

### Modularity & Future-Proof UI Architecture
- Build panel-based UI with reusable primitives (`Card`, `Badge`, `PanelHeader`, `StatusPill`, `ActivityItem`).
- Keep feature modules decoupled (PR, CI/CD, Snippets, Chat, Activity) behind clear props/contracts.
- Use integration-agnostic UI models so new providers (GitLab/Azure/Jenkins) can plug in without redesign.
- Plan extension points for future capabilities (pair programming, video, advanced search) using the same layout system.

### Implementation Notes (MVP)
- Start with a fixed desktop grid layout; introduce drag/reorder only after MVP stability.
- Maintain a single interaction grammar across all panels (same hover, expand, filter, and shortcut behaviors).
- Limit visual effects to purposeful status cues; readability and speed take precedence over ornament.

---

## 6) Authentication & Identity Strategy
### Core Principle

Authentication must be:
- Provider-agnostic
- Integration-friendly
- Backend-controlled
- Secure by default
- Enterprise-ready
- Extendable without refactoring core logic
- We separate Identity from Integrations.

### Identity Architecture

We use Auth.js (NextAuth) as our authentication framework.

Auth.js handles:
- OAuth provider flows
- Session management
- JWT issuance
- CSRF protection
- Provider account linking

Our backend owns:
- User domain model
- Integration abstraction layer
- Token storage
- Business logic
- Permissions

### User Model

We maintain our own internal User entity.

A user in our system:
- Has a unique internal ID
- May be linked to multiple OAuth providers
- Owns multiple integrations
- Belongs to multiple project rooms
- Auth.js accounts map to our internal user model.

### Provider Account Model

Each OAuth login creates or links an Account record:

User
 ├── Account (GitHub)
 ├── Account (Azure AD)
 ├── Account (GitLab)


This allows:
- Login via multiple providers
- Linking additional integrations later
- Enterprise SSO in future
- Decoupling identity from specific versioning systems

### GitHub as First Provider

For MVP:

GitHub OAuth acts as:
- Authentication method
- First integration provider
- GitHub tokens are stored encrypted

Tokens are used to:
- Fetch repositories
- Read PRs
- Read CI statuses
- Subscribe to webhooks
- Later providers will plug into the same architecture.

### Session Strategy

We use:

- JWT-based sessions
- Short-lived access tokens
- Refresh token support
- Backend-controlled session validation
- Electron and Web both rely on the same backend session logic.

Electron receives:
A short-lived session token after OAuth
No direct provider tokens stored locally

### Security Principles

- Provider access tokens are encrypted at rest
- No OAuth flows handled inside Electron window
- OAuth completes in system browser
- Backend handles callback + token exchange
- Desktop stores minimal session data
- Strict separation between auth layer and integration layer

### Extensibility Design

We design integrations as modular adapters:
IntegrationAdapter {
  authenticate()
  fetchRepositories()
  fetchPullRequests()
  fetchBuildStatus()
  subscribeToEvents()
}

Each provider (GitHub, Azure DevOps, GitLab) implements this interface.
Authentication system remains untouched when new providers are added.

### Long-Term Evolution

- Future upgrades may include:
- Azure AD / Azure DevOps
- GitLab
- Enterprise OIDC/SAML
- Organization-level roles
- Multi-tenant architecture
- SCIM provisioning
- Audit logs
- Auth.js supports this evolution without replacing the auth foundation.

### Why This Matters

- This architecture ensures:
- MVP simplicity
- Clean scaling path
- No auth rewrite later
- No vendor lock-in
- Multi-provider flexibility
- Enterprise viability
- Authentication becomes a stable foundation — not technical debt.

---

## 8) MVP Development Plan / Timeline

### Weekly Roadmap (Solo Development)

#### Weeks 1–2: Foundation (P0)
- [x] Initialize monorepo (`frontend`, `backend`, `electron`)
- [x] Setup CI for lint/test/build
- [x] Configure SQLite + migrations
- [x] Implement environment configuration strategy (dev/staging/prod)

🔐 Authentication & Identity (Auth.js-Based)

- [x] Integrate Auth.js (NextAuth) into backend
- [x] Configure database adapter (SQLite for MVP)
- [x] Implement core User model (owned by our system)
- [x] Implement Account model (provider-linked accounts)
- [x] Implement JWT-based session strategy
- [x] Secure token storage (encrypted provider access tokens)

🔌 OAuth Provider: GitHub (First Integration + Login)

- [x] Implement GitHub OAuth provider via Auth.js
- [x] Store GitHub access + refresh tokens securely
- [x] Map GitHub identity → internal User entity
- [x] Implement account linking logic (future-proof for multiple providers)
- [x] Validate GitHub API access via test call

💬 Core Feature Bootstrap

🖥 Application Shell & Navigation

- [x]  Build login screen (OAuth entry point)
- [x]  Implement authenticated redirect flow
- [x]  Create base application layout (sidebar + top nav + content area)
- [x]  Implement theme system (dark default, futuristic dev look)
- [x]  Implement navigation state management
- [x]  Build placeholder dashboard (Overview page)

🏠 Home / Overview Screen (From Screenshot)

- [x]  Implement “Overview” dashboard layout
- [x]  Create PR card component (compact, expandable)
- [x]  Create CI status card component
- [x]  Create activity feed component
- [x]  Create chat panel container (no realtime yet)
- [x]  Populate with mocked data initially

💬 Rooms & Chat (After Shell Exists)

- [ ]  Implement project model
- [ ]  Implement room model
- [ ]  Connect room selection to sidebar
- [ ]  Implement real-time chat (WebSocket)
- [ ]  Connect chat to authenticated user
- [ ]  Persist messages in DB

🖥 Electron Authentication Flow

- [ ] Implement system browser OAuth flow
- [ ] Handle OAuth callback on backend
- [ ] Exchange session for short-lived desktop token
- [ ] Secure token storage in Electron
- [ ] Implement logout + session refresh flow

#### Weeks 3–4: Code-Aware Messaging (P0)
- [ ] Add syntax-highlighted code snippets
- [ ] Add inline diff rendering in messages
- [ ] Add message formatting safeguards (sanitization)
- [ ] Improve room/message state management

#### Weeks 5–6: Desktop Experience (P0)
- [ ] Wrap app in Electron
- [ ] Add native notifications
- [ ] Add tray/background behavior
- [ ] Add core keyboard shortcuts

#### Weeks 7–8: PR + CI Dashboards (P0)
- [ ] Build user-centric open PR dashboard
- [ ] Build compact CI/test badge panel
- [ ] Add backend caching + refresh jobs
- [ ] Add webhook-based cache invalidation (GitHub)

#### Weeks 9–10: MVP Polish (P1)
- [ ] Add basic search
- [ ] Improve keyboard navigation coverage
- [ ] Optional: add snippet sandbox v1 (Node/Python)
- [ ] Stabilize error handling, retries, and UX edge cases

#### Week 11+: Expansion (P2)
- [ ] Design and implement GitLab adapter
- [ ] Design and implement Azure DevOps adapter
- [ ] Add Jenkins/Azure Pipelines CI adapters
- [ ] Refine UX and performance from production feedback

### Priority Definitions
- **P0:** Required for MVP release.
- **P1:** Valuable enhancements if time allows in MVP window.
- **P2:** Post-MVP expansion.

---

## 9) Best Practices / Guidelines

### Code Organization
- Keep a monorepo with clear boundaries:
  - `/apps/frontend`
  - `/apps/backend`
  - `/apps/electron`
  - `/packages/shared-types`
  - `/packages/ui`
  - `/packages/integration-contracts`
- Centralize shared DTOs/types to avoid API drift.

### Layer Separation Rules
- UI components do not call provider SDKs directly.
- Controllers do not contain business logic.
- Services orchestrate use-cases; repositories handle persistence only.
- Adapter layer isolates all third-party provider specifics.

### Reusable Components
- Build composable primitives for:
  - message bubble,
  - code block,
  - diff viewer,
  - PR card,
  - CI badge,
  - command palette.
- Keep styling tokenized and consistent across web/Electron.

### Security & OAuth Handling
- Store provider tokens encrypted.
- Implement refresh/re-auth strategy with explicit token lifecycle states.
- Keep OAuth scopes minimal and auditable.
- Use CSRF/state checks in OAuth callback flow.

### Integration Design for Minimal Future Changes
- Define provider contracts before first implementation.
- Normalize external data to internal models (`PullRequest`, `BuildStatus`).
- Keep provider mapping in isolated modules per provider.
- Add contract tests for each provider adapter.
- Ensure dashboard and chat features consume normalized models only.

### AI-Assisted Development Tips
- Keep a `/docs/decisions` folder for architecture decision records (ADRs).
- Maintain prompt-ready docs for:
  - data models,
  - API contracts,
  - integration interfaces,
  - UI component inventory.
- Ask AI assistants to generate code only against stable contracts/interfaces.
- Require tests for generated service logic before merge.

---

## 10) Checklist / Tracking

> Use this as the master execution checklist. Keep this section updated weekly.

### Product & UX
- [ ] Finalize product name (`[PROJECT_NAME_PLACEHOLDER]`)
- [ ] Finalize MVP UX wireframes
- [ ] Validate keyboard-first interaction map
- [ ] Define notification behavior matrix

### Frontend Tasks
- [ ] Setup React + Tailwind foundation
- [ ] Build app shell (chat center + side panels)
- [ ] Implement project room list + room routing
- [ ] Implement message composer + message list
- [ ] Implement code snippet rendering
- [ ] Implement inline diff viewer
- [ ] Implement PR dashboard UI cards
- [ ] Implement CI badge panel UI
- [ ] Implement global/basic search
- [ ] Implement keyboard navigation + shortcuts

### Backend Tasks
- [ ] Setup NestJS modules and environment config
- [ ] Implement auth module (GitHub OAuth)
- [ ] Implement user and room services
- [ ] Implement chat APIs + WebSocket events
- [ ] Implement PR ingestion/cache service
- [ ] Implement CI ingestion/cache service
- [ ] Implement webhook receiver + signature validation
- [ ] Implement authorization guards (repo/room membership)
- [ ] Implement rate limiting, input validation, and audit logs

### Database & Data Model
- [ ] Define schema for users/rooms/messages
- [ ] Define schema for repositories/PRs/CI snapshots
- [ ] Add migration pipeline
- [ ] Add indexing for dashboard queries
- [ ] Add retention policy for chat and cache data

### Electron Tasks
- [ ] Bootstrap Electron shell
- [ ] Load shared React SPA in desktop shell
- [ ] Add tray icon and background persistence
- [ ] Add native notifications + click actions
- [ ] Add desktop-level keyboard shortcut handlers

### Integrations (MVP + Later)
- [ ] GitHub OAuth + repo/PR/webhook integration (MVP)
- [ ] GitHub Actions CI status integration (MVP)
- [ ] GitLab adapter scaffold (Later)
- [ ] Azure DevOps adapter scaffold (Later)
- [ ] Jenkins CI adapter scaffold (Later)
- [ ] Azure Pipelines adapter scaffold (Later)

### Optional Features
- [ ] Snippet sandbox v1 (Node/Python)
- [ ] Pair programming mode (post-MVP)
- [ ] Advanced search (post-MVP)
- [ ] Video/voice collaboration (post-MVP)

### Quality, Security, and Operations
- [ ] Add unit/integration tests for core services
- [ ] Add E2E tests for auth/chat/PR dashboard
- [ ] Add structured logging + error monitoring
- [ ] Encrypt OAuth tokens at rest
- [ ] Add secrets management strategy
- [ ] Add release checklist for desktop/web builds

### Documentation & Delivery
- [ ] Keep architecture docs updated
- [ ] Keep API contracts and integration docs current
- [ ] Maintain changelog per milestone
- [ ] Prepare MVP demo script (chat + PR + CI flow)

---

## Appendix A — Initial Monorepo Layout (Suggested)

```text
/apps
  /frontend
  /backend
  /electron
/packages
  /shared-types
  /ui
  /integration-contracts
/docs
  /decisions
  /api
  /runbooks
```

## Appendix B — Non-Goals for MVP
- No enterprise permission model in first release.
- No multi-tenant org billing complexity.
- No heavy IDE plugin ecosystem before core workflow is stable.

## Appendix C — Definition of MVP Done
- [ ] GitHub OAuth login works reliably.
- [ ] Developers can chat in repo-linked rooms.
- [ ] Code snippets and diffs are readable and safe.
- [ ] User-centric PR dashboard is functional.
- [ ] CI badges update with acceptable freshness.
- [ ] Electron desktop app is stable with notifications.
- [ ] Core keyboard workflow feels fast and complete.
- [ ] Documentation is sufficient for iteration and handoff.
