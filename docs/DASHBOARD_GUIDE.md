# Dashboard User Guide

## Overview

The dashboard is your main hub for managing events and inventory. This guide explains all features and workflows.

## Event Management

### Creating an Event

1. Click **"Create Event"** button (navbar or dashboard)
2. Fill in the form:
   - **Name** (required): e.g., "Jam Karet Festival 2025"
   - **Description** (optional): Brief description
   - **Start Date** (optional): When event begins
   - **End Date** (optional): When event ends
   - **Location** (optional): Where event takes place
3. Click **"Create Event"**
4. You'll be redirected to the dashboard

### Viewing Events

**All Events Page** (`/events`):
- Shows all events where you're owner or member
- Displays: name, description, location, dates, member count
- Click any event card to view details

**Event Details Page** (`/events/[id]`):
- Shows complete event information
- Two tabs: **Details** and **Members**
- Owner badge vs Member badge
- Edit button (owner only)
- Delete button (owner only)

### Editing an Event ✏️

**Method 1: From Event Details Page (Recommended)**
1. Go to Events page → Click on event
2. Click **"Edit"** button (top right)
3. Form appears inline - modify fields
4. Click **"Save Changes"** or **"Cancel"**

**Method 2: Quick Access**
1. Dashboard → Event selector dropdown
2. Select event
3. Go to `/events/[current-event-id]`
4. Click Edit

> ⚠️ **Note**: Only event **owners** can edit events. Members have read-only access.

### Deleting an Event

1. Go to event details page
2. Click **"Delete Event"** button (red button, top right)
3. Confirm deletion
4. Event and all related data (items, audits) are permanently deleted

> ⚠️ **Warning**: Deletion cannot be undone. Only owners can delete events.

### Event Selector (Navbar)

The event dropdown in the navbar:
- Shows all your events
- Displays current selected event
- Click to switch between events
- Current event determines which inventory you see

## Dashboard Features

### Stats Cards

Four key metrics displayed:

1. **Total Items**: Number of items in current event's inventory
2. **Total Audits**: All-time audit count for current event
3. **Recent Audits**: Audits in last 30 days
4. **Discrepancies**: Items with inventory mismatches

### Recent Items Widget

- Shows 5 most recently added items
- Click any item to view details
- Displays: name, category, location, quantity
- "View All Items" button → full inventory page

### Recent Audits Widget

- Shows latest audit log entries
- Displays: item name, discrepancy amount
- Color-coded:
  - ✓ **Green**: No discrepancy (match)
  - ⚠ **Orange**: Discrepancy found
- "View All Audits" button → audit logs page

## Event States

### No Event Selected

If you see "No Event Selected":
- No event is currently selected in dropdown
- You need to select an event or create a new one
- Dashboard functionality is limited until event is selected

**Fix**: 
1. Click event dropdown in navbar
2. Select an event, OR
3. Click "Create Event"

### No Events Exist

If you see "No Events Yet":
- You haven't created any events or been invited to any
- Click "Create Event" to get started

### Event Roles

**Owner**:
- Full control over event
- Can edit event details
- Can delete event
- Can manage members (future feature)
- Can create/edit/delete items and audits

**Member**:
- View-only access to event details
- Can view inventory items
- Can view audit logs
- Cannot edit or delete event
- Cannot create/edit/delete items (currently)

## Common Questions

### Q: Why is the timestamp "1760044477597" in an event name?

**A**: This is a Unix timestamp (milliseconds). It appears in test events created during development. 

**Solutions**:
- Edit the event name to remove the timestamp
- Delete the test event
- Create a new event with a proper name

### Q: How do I switch between events?

**A**: Use the event selector dropdown in the navbar (top right area).

### Q: Can I work on multiple events at once?

**A**: Not simultaneously. You select one "current event" at a time. All dashboard data, items, and audits belong to the current event. Switch events using the dropdown.

### Q: What happens if I delete an event?

**A**: 
- Event is permanently deleted
- All items in that event are deleted
- All audit logs for that event are deleted
- All event memberships are deleted
- This action **cannot be undone**

### Q: Why don't I see the Edit button?

**A**:
- You're not the event owner (you're a member)
- You need to be on the event details page (`/events/[id]`)
- Event may not be fully loaded yet

## Keyboard Shortcuts (Future)

Coming soon:
- `n` - New event
- `e` - Edit current event
- `i` - New item
- `a` - New audit

## Tips & Best Practices

1. **Use descriptive event names**: Include year and location
   - ✅ "Jam Karet Festival 2025 - Jakarta"
   - ❌ "Test Event 1760044477597"

2. **Fill in dates and location**: Helps with organization

3. **Regular audits**: Run inventory audits frequently to catch discrepancies

4. **Event ownership**: Create separate events for separate inventories

5. **Member management**: Add team members to events they need access to (when feature is available)

## Navigation Map

```
/dashboard          → Main dashboard (current event overview)
/events             → List all your events
/events/new         → Create new event
/events/[id]        → Event details & edit
/items              → Inventory items for current event
/items/new          → Add new item
/items/[id]         → Item details & edit
/audits             → Audit logs for current event
/audits/new         → Create new audit
/settings           → Account settings & API keys
```

## Need Help?

- **API Documentation**: http://localhost:3001/docs
- **Setup Issues**: See [SETUP_DATABASE.md](../SETUP_DATABASE.md)
- **MCP Integration**: See [MCP_GUIDE.md](./MCP_GUIDE.md)
