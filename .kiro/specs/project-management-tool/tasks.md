## Implementation Plan

This file tracks the work items needed to build the project management tool described in the requirements and design documents.

### Milestone 0: Project Scaffolding

- Set up monorepo structure with `apps/api` and `apps/web`.
- Configure TypeScript, linting, and formatting.
- Add environment templates and Docker Compose for local services.

### Milestone 1: Authentication and User Profile

- Implement user registration/login/logout and refresh.
- Add JWT auth middleware and session persistence.
- Build profile and password update endpoints.
- Create login/register UI flows.

### Milestone 2: Projects and Boards

- Implement project CRUD and membership management.
- Create board/column CRUD with ordering.
- Build project dashboard and board UI.

### Milestone 3: Tasks and Comments

- Implement task CRUD, assignment, and move endpoints.
- Add comment CRUD with mention parsing.
- Build task detail drawer with comments.

### Milestone 4: Notifications and Realtime

- Implement notification creation and preferences.
- Add Socket.IO server and client subscriptions.
- Broadcast task/comment/member events.

### Milestone 5: Attachments and Search

- Add attachment upload and delete.
- Implement task search and filtering.
- Add UI for search/filter controls.

### Milestone 6: Quality and Deployment

- Add unit, integration, and e2e tests.
- Add CI pipeline and production build scripts.
- Add deployment notes and monitoring basics.

## Checklist (v1 Scope)

- Auth: register, login, logout, refresh
- Profile: update info, change password, avatar upload
- Projects: create, update, delete, list
- Membership: invite, accept, remove, role change
- Boards: create, update, delete
- Columns: create, update, delete, reorder
- Tasks: create, update, delete, move
- Assignments: add/remove assignees
- Comments: create, update, delete, mentions
- Notifications: list, mark read, preferences
- Realtime: board updates, comments, notifications
