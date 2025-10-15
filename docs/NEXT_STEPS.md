# Next Steps for EventForge Inventory

## Immediate Tasks (To Complete MVP)

### 1. Create Item Form Pages

**File**: `app/app/items/new/page.tsx`

- Form for creating new items
- Category dropdown
- Quantity input with validation
- Location field
- Description textarea
- Submit with loading state

**File**: `app/app/items/[id]/page.tsx`

- View/edit existing item
- Load item data with `useItem(id)`
- Edit mode toggle
- Audit history for this item
- Delete button with confirmation

### 2. Audits Page

**File**: `app/app/audits/page.tsx`

- List all audit logs with pagination
- Filter by item, date range
- "Create New Audit" button
- Audit form dialog:
  - Select item (searchable dropdown)
  - Enter actual quantity
  - Notes field
  - Auto-calculate discrepancy

### 3. Settings Page

**File**: `app/app/settings/page.tsx`

- User profile section
- **API Keys Management**:
  - List active/revoked keys
  - "Generate New Key" button
  - Copy-to-clipboard functionality
  - Revoke key with confirmation
  - Show last used timestamp
- Dark mode toggle (optional)

### 4. API Documentation Page

**File**: `app/app/api-docs/page.tsx`

- Embed Swagger UI iframe pointing to `/docs`
- **MCP Quick Start** section:
  - How to connect Claude Desktop
  - Example API key usage
  - Sample requests with curl
- Link to full MCP guide

### 5. MCP Integration Guide

**File**: `docs/MCP_GUIDE.md`

```markdown
# MCP Integration Guide

## Overview

- What is MCP
- Why it's useful for EventForge

## Setup for Claude Desktop

1. Generate API key in Settings
2. Add custom connector:
   - Name: EventForge Inventory
   - URL: http://localhost:3001/mcp
   - Header: x-api-key
   - Key: [your key]
3. Test queries

## Setup for ChatGPT (OpenAI Actions)

- JSON schema for each tool
- Authentication setup
- Example queries

## Available MCP Tools

- list_inventory_items
- get_item_details
- create_audit_log
- get_inventory_stats
- search_items_by_name

## Example Queries

"Show me all furniture items"
"Create an audit for the folding chairs"
"What are my inventory statistics?"

## curl Examples

(For testing without AI)

## Troubleshooting

Common issues and solutions
```

## Testing Tasks

### Backend Tests (`backend/tests/`)

1. **API Route Tests**:

```typescript
// items.test.ts
describe("Items API", () => {
  it("should list items with pagination");
  it("should create item with auth");
  it("should reject without auth");
});
```

2. **MCP Server Tests**:

```typescript
// mcp.test.ts
describe("MCP Server", () => {
  it("should handle tools/list");
  it("should execute list_inventory_items");
  it("should validate API key");
});
```

3. **Auth Middleware Tests**:

```typescript
// auth.test.ts
describe("Authentication", () => {
  it("should verify valid JWT");
  it("should reject invalid API key");
});
```

### Frontend Tests (`app/__tests__/`)

1. **Component Tests**:

```typescript
// Navbar.test.tsx
// StatsCard.test.tsx
// ItemForm.test.tsx
```

2. **Hook Tests**:

```typescript
// useItems.test.tsx
// useAudits.test.tsx
```

## Deployment Tasks

### 1. Vercel Configuration

**File**: `vercel.json`

```json
{
  "buildCommand": "cd app && npm run build",
  "outputDirectory": "app/.next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://your-backend.railway.app"
  }
}
```

### 2. Backend Deployment (Railway/Render)

**File**: `backend/Dockerfile` (optional)

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### 3. Environment Variables Checklist

Create `.env.production` files with:

- Production database URL
- Stack Auth production keys
- API secrets
- CORS origins

### 4. Database Migration Strategy

Document process:

1. Run migrations on production DB
2. Seed if needed
3. Backup strategy
4. Rollback plan

## Polish & UX Improvements

### UI Enhancements

- [ ] Loading skeletons for tables
- [ ] Empty states for all lists
- [ ] Toast notifications for all actions
- [ ] Form validation error messages
- [ ] Responsive mobile menu

### Performance

- [ ] Add React Query staleTime/cacheTime optimization
- [ ] Image optimization (if adding images)
- [ ] Code splitting for large components

### Accessibility

- [ ] ARIA labels on all buttons
- [ ] Keyboard navigation
- [ ] Focus management in dialogs
- [ ] Screen reader testing

## Documentation Polish

### README Updates

- [ ] Add screenshots
- [ ] GIF demo of key features
- [ ] Architecture diagram
- [ ] Contributing guidelines

### API Documentation

- [ ] Request/response examples for all endpoints
- [ ] Error codes reference
- [ ] Rate limiting details

## Future Enhancements (Post-MVP)

### Phase 2: OpenAI Agent Swarm

1. Implement agent classes
2. Add orchestrator
3. Build forecasting logic
4. Generate embeddings for items

### Phase 3: Advanced Features

1. Real-time updates (WebSockets)
2. Barcode scanning
3. CSV import/export
4. Multi-location support
5. Custom reports
6. Email notifications

### Phase 4: Mobile App

1. React Native app
2. Offline-first architecture
3. Camera integration for scanning
4. Push notifications

## Estimated Timeline

| Task                | Time Estimate |
| ------------------- | ------------- |
| Item form pages     | 2 hours       |
| Audits page         | 2 hours       |
| Settings & API keys | 2 hours       |
| API docs page       | 1 hour        |
| MCP guide           | 1 hour        |
| Backend tests       | 3 hours       |
| Frontend tests      | 2 hours       |
| Deployment setup    | 2 hours       |
| Polish & bug fixes  | 3 hours       |
| **Total**           | **18 hours**  |

## Commands Reference

```bash
# Development
npm run dev                # Start both servers
npm run dev:backend       # Backend only
npm run dev:frontend      # Frontend only

# Database
npm run db:migrate        # Run migrations
npm run db:seed           # Seed data
npm run db:studio         # Open Prisma Studio

# Testing
npm test                  # Run all tests
npm run test:backend      # Backend tests only
npm run test:frontend     # Frontend tests only

# Build
npm run build             # Build both apps

# Deployment
vercel                    # Deploy frontend
# Backend: Configure on Railway/Render dashboard
```

## Priority Order

1. **Critical** (Blocks MVP launch):

   - Item form pages
   - Settings page with API keys
   - MCP guide

2. **Important** (For production):

   - Tests
   - Deployment setup
   - Error handling

3. **Nice to Have** (Polish):
   - UI enhancements
   - Additional documentation
   - Performance optimization

---

**Ready to continue?** Pick up from Task #1 (Item Form Pages) when you're ready to code again!
