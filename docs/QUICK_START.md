# Quick Start Guide - Multi-Event Support

## ✅ What's Been Implemented

The EventForge Inventory system now supports **multiple events**! Each user can:

- Create and manage multiple events (e.g., "Jam Karet Festival", "Pasar Hamburg")
- Be an **owner** of some events and a **member** of others
- Switch between events seamlessly via navbar dropdown
- Each event has its own isolated inventory and audit logs

## 🚀 Next Steps (Required)

### 1. Run Database Migration

```bash
cd /Users/eridhobufferyrollian/Documents/Project/event-inventory

# Generate Prisma client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_multi_event_support

# Seed database with sample data
npx prisma db seed
```

This will:

- Create `events` and `event_members` tables
- Add `eventId` to `items` and `audit_logs` tables
- Create sample events: "Jam Karet Festival 2025" and "Pasar Hamburg"
- Create sample inventory items for each event

### 2. Restart Backend Server

```bash
cd backend
npm run dev
```

### 3. Restart Frontend Server

```bash
cd frontend
npm run dev
```

## 🎯 How to Use

### Creating Your First Event

1. Open the app (http://localhost:3000)
2. Sign in with Stack Auth
3. Click the **event dropdown** in the navbar
4. Select **"+ Create Event"**
5. Fill in:
   - Event Name (required): e.g., "My Event 2025"
   - Description (optional)
   - Start Date (optional)
   - End Date (optional)
   - Location (optional)
6. Click **"Create Event"**

### Switching Between Events

- Use the **dropdown in the navbar** to switch between your events
- Your selection is saved automatically
- All inventory items and audits are filtered by the current event

### Managing Events

1. Click **your user name** → **Events** (or go to `/events`)
2. View all your events
3. Click on any event to:
   - View/edit details
   - Manage members
   - Delete event (if you're the owner)

### Inviting Team Members

1. Go to event details (`/events/[id]`)
2. Click **"Members"** tab
3. Click **"Add Member"** (owners only)
4. Enter the Stack Auth user ID
5. Select role: "owner" or "member"

## 📝 Key Concepts

### Event Roles

- **Owner**: Can edit event, manage members, delete event
- **Member**: Can view event and manage inventory, cannot edit event settings

### Event Ownership

- Event creator automatically becomes owner
- Can have multiple owners
- Cannot remove the last owner (protection)

### Data Isolation

- Each event has its own inventory items
- Each event has its own audit logs
- Switching events shows different data
- API keys are user-scoped (access all your events)

## 🔧 API Changes

### New Endpoints

```
GET    /api/v1/events                           # List user's events
POST   /api/v1/events                           # Create event
GET    /api/v1/events/:id                       # Get event details
PUT    /api/v1/events/:id                       # Update event
DELETE /api/v1/events/:id                       # Delete event

GET    /api/v1/events/:eventId/members          # List members
POST   /api/v1/events/:eventId/members          # Add member
DELETE /api/v1/events/:eventId/members/:userId  # Remove member
```

### Updated Endpoints

All inventory and audit endpoints now require `x-event-id` header or `eventId` query param:

```
GET /api/v1/items?eventId=xxx
GET /api/v1/audits?eventId=xxx
GET /api/v1/audits/stats?eventId=xxx
```

The frontend automatically includes the current event ID in all requests.

## 📄 Sample Data

After running the seed, you'll have:

**Event 1: Jam Karet Festival 2025**

- Location: Jakarta, Indonesia
- Dates: July 15-17, 2025
- 15 inventory items (furniture, AV equipment, decor, etc.)
- Sample audit logs

**Event 2: Pasar Hamburg**

- Location: Hamburg, Germany
- Dates: August 20-21, 2025
- 8 inventory items (market stalls, tables, chairs, etc.)

**Memberships:**

- User "sample-user-eridho-123" is **owner** of Jam Karet, **member** of Pasar Hamburg
- User "sample-user-jane-456" is **owner** of Pasar Hamburg

## 🐛 Troubleshooting

### Migration Errors

If you get Prisma errors, try:

```bash
npx prisma migrate reset  # Warning: Deletes all data!
npx prisma migrate dev --name add_multi_event_support
npx prisma db seed
```

### "No Event Selected" Message

- Create your first event using the navbar dropdown
- Or go directly to `/events/new`

### Items Not Showing

- Make sure you have an event selected
- Check that items belong to the current event
- Try switching events using the dropdown

## 📚 Documentation

See `MULTI_EVENT_IMPLEMENTATION.md` for complete technical details.

## ✨ What's Next (Optional)

- Email-based member invitations
- Event templates
- Event-specific analytics
- MCP/AI integration with event context
- Event archiving
- Bulk operations between events
