# Invitations and Permissions System

## Overview
This document describes the invitation and role-based permission system implemented for EventForge Inventory.

## Database Schema

### EventInvitation Model
Stores pending, accepted, declined, and expired invitations.

```prisma
model EventInvitation {
  id            String           @id @default(uuid())
  eventId       String
  inviterUserId String           // Who sent the invitation
  inviteeEmail  String           // Email of person being invited
  role          Role             @default(VIEWER)
  status        InvitationStatus @default(PENDING)
  token         String           @unique @default(uuid())
  message       String?          // Optional personal message
  createdAt     DateTime         @default(now())
  expiresAt     DateTime         // 7-day expiry
  
  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  @@unique([eventId, inviteeEmail, status])
  @@index([inviteeEmail, status])
  @@index([eventId])
  @@index([token])
}
```

### Role Enum
Defines role hierarchy with granular permissions.

```prisma
enum Role {
  OWNER   // Full control over event
  ADMIN   // Manage items, audits, invite EDITOR/VIEWER
  EDITOR  // Create/edit items and audits
  VIEWER  // Read-only access
}
```

### InvitationStatus Enum
Tracks invitation lifecycle.

```prisma
enum InvitationStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
}
```

## Permission Matrix

| Action | OWNER | ADMIN | EDITOR | VIEWER |
|--------|-------|-------|--------|--------|
| View event/items/audits | ✅ | ✅ | ✅ | ✅ |
| Create/edit items | ✅ | ✅ | ✅ | ❌ |
| Delete items | ✅ | ✅ | ❌ | ❌ |
| Create audits | ✅ | ✅ | ✅ | ❌ |
| Invite VIEWER/EDITOR | ✅ | ✅ | ❌ | ❌ |
| Invite ADMIN/OWNER | ✅ | ❌ | ❌ | ❌ |
| Remove VIEWER/EDITOR | ✅ | ✅ | ❌ | ❌ |
| Remove ADMIN/OWNER | ✅ | ❌ | ❌ | ❌ |
| Change member roles | ✅ | ❌ | ❌ | ❌ |
| Edit/delete event | ✅ | ❌ | ❌ | ❌ |

## Invitation Flow

### Scenario 1: User Already Has Account

1. **Owner sends invitation**
   ```
   POST /api/v1/events/{eventId}/invitations
   {
     "inviteeEmail": "malsa@example.com",
     "role": "EDITOR",
     "message": "Join our event!"
   }
   ```

2. **User logs in**
   - Stack Auth JWT contains email
   - Frontend fetches: `GET /api/v1/invitations/pending`
   - Backend matches JWT email to invitation email

3. **User sees invitation**
   - Dashboard shows pending invitations
   - Displays event name, role, inviter message

4. **User accepts**
   ```
   PUT /api/v1/invitations/{id}/accept
   ```
   - Backend creates EventMember record
   - Updates invitation status to ACCEPTED
   - User becomes member immediately

### Scenario 2: User Doesn't Have Account Yet

1. **Owner sends invitation** (same as above)

2. **User signs up later**
   - Creates account with invited email
   - Stack Auth verifies email

3. **User logs in for first time**
   - `GET /api/v1/invitations/pending` finds invitation
   - Shows welcome message with pending invitations

4. **User accepts** (same as above)

## API Endpoints

### Create Invitation
```
POST /api/v1/events/:eventId/invitations
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "inviteeEmail": "user@example.com",
  "role": "EDITOR",  // OWNER, ADMIN, EDITOR, VIEWER
  "message": "Optional message"
}

Response 201:
{
  "id": "uuid",
  "eventId": "uuid",
  "inviteeEmail": "user@example.com",
  "role": "EDITOR",
  "status": "PENDING",
  "createdAt": "2025-10-15T...",
  "expiresAt": "2025-10-22T..."
}
```

**Permissions:**
- OWNER: Can invite anyone (OWNER, ADMIN, EDITOR, VIEWER)
- ADMIN: Can invite only EDITOR and VIEWER

### List Event Invitations
```
GET /api/v1/events/:eventId/invitations?status=PENDING
Authorization: Bearer {jwt}

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "inviteeEmail": "user@example.com",
      "role": "EDITOR",
      "status": "PENDING",
      "message": "...",
      "createdAt": "...",
      "expiresAt": "..."
    }
  ]
}
```

**Permissions:** OWNER and ADMIN only

### Get User's Pending Invitations
```
GET /api/v1/invitations/pending
Authorization: Bearer {jwt}

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "eventId": "uuid",
      "role": "EDITOR",
      "message": "...",
      "createdAt": "...",
      "expiresAt": "...",
      "event": {
        "id": "uuid",
        "name": "Jam Karet Festival",
        "description": "...",
        "location": "..."
      }
    }
  ]
}
```

**Note:** Automatically expires invitations older than 7 days

### Accept Invitation
```
PUT /api/v1/invitations/:id/accept
Authorization: Bearer {jwt}

Response 200:
{
  "message": "Invitation accepted successfully",
  "eventMember": {
    "id": "uuid",
    "userId": "user-id",
    "eventId": "event-id",
    "role": "EDITOR"
  }
}
```

**Validation:**
- Email in JWT must match invitation email
- Invitation must be PENDING
- Must not be expired
- User cannot already be a member

### Decline Invitation
```
PUT /api/v1/invitations/:id/decline
Authorization: Bearer {jwt}

Response 200:
{
  "message": "Invitation declined"
}
```

### Cancel Invitation
```
DELETE /api/v1/invitations/:id
Authorization: Bearer {jwt}

Response 200:
{
  "message": "Invitation cancelled successfully"
}
```

**Permissions:** OWNER and ADMIN only (for the event)

### Update Member Role
```
PATCH /api/v1/events/:eventId/members/:userId/role
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "role": "ADMIN"
}

Response 200:
{
  "id": "uuid",
  "userId": "user-id",
  "eventId": "event-id",
  "role": "ADMIN"
}
```

**Permissions:** OWNER only
**Protection:** Cannot demote last owner

## Permission Middleware

### Role Hierarchy
```typescript
const ROLE_HIERARCHY = {
  OWNER: 4,
  ADMIN: 3,
  EDITOR: 2,
  VIEWER: 1,
};
```

### Middleware Functions

#### `verifyPermission(requiredRole: Role)`
Checks if user has at least the required role level.
```typescript
// Example: Require EDITOR or higher
preHandler: [verifyNeonAuth, verifyEventAccess, verifyPermission("EDITOR")]
```

#### `verifyOwnerRole`
Ensures user is OWNER.
```typescript
preHandler: [verifyNeonAuth, verifyEventAccess, verifyOwnerRole]
```

#### `verifyCanManageMembers`
Ensures user is OWNER or ADMIN.
```typescript
preHandler: [verifyNeonAuth, verifyEventAccess, verifyCanManageMembers]
```

#### `verifyCanEditItems`
Ensures user is EDITOR or higher.
```typescript
preHandler: [verifyNeonAuth, verifyEventAccess, verifyCanEditItems]
```

#### `canInviteRole(inviterRole: Role, targetRole: Role)`
Validates invitation permissions:
- OWNER can invite anyone
- ADMIN can invite EDITOR and VIEWER only
- EDITOR and VIEWER cannot invite

## Security Features

1. **Email Validation**
   - Only user with matching email can accept invitation
   - Email stored in lowercase for consistency

2. **Expiration**
   - Invitations expire after 7 days
   - Automatic expiry check on pending invitations fetch

3. **Duplicate Prevention**
   - Unique constraint on (eventId, inviteeEmail, PENDING status)
   - Prevents multiple pending invitations to same email

4. **Last Owner Protection**
   - Cannot remove last owner
   - Cannot demote last owner
   - Must promote another member first

5. **Role Hierarchy Enforcement**
   - ADMIN cannot invite OWNER/ADMIN
   - ADMIN cannot remove OWNER/ADMIN
   - Only OWNER can change roles

6. **Token-based Acceptance**
   - Unique UUID token per invitation
   - Could be used for direct acceptance links (future)

## Migration Notes

### Existing Data Migration
When updating from old system:
```sql
-- Old roles mapped to new roles
'owner' → OWNER
'member' → EDITOR (given edit permissions)
```

### Backward Compatibility
- Old routes continue to work
- Permission checks are non-breaking additions
- Database migration handles role conversion automatically

## Email Integration (Future)

Currently system uses **in-app notifications only**. To add email sending:

1. **Add email service** (Resend recommended)
   ```typescript
   await resend.emails.send({
     from: 'noreply@eventforge.com',
     to: invitation.inviteeEmail,
     subject: `You're invited to ${event.name}`,
     html: emailTemplate({
       eventName: event.name,
       inviterName: inviter.displayName,
       role: invitation.role,
       acceptUrl: `${APP_URL}/invitations/${invitation.token}`,
     }),
   });
   ```

2. **Add direct acceptance URL**
   - Use invitation token in URL
   - Route: `GET /invitations/accept/:token`
   - Auto-accept on first login if valid

3. **Email preferences**
   - Allow users to opt-out of emails
   - Keep in-app notifications always

## Testing Checklist

- [ ] Create invitation as OWNER
- [ ] Create invitation as ADMIN (EDITOR/VIEWER only)
- [ ] Prevent duplicate pending invitations
- [ ] Accept invitation (existing user)
- [ ] Accept invitation (new user after signup)
- [ ] Decline invitation
- [ ] Cancel invitation
- [ ] Invitation expires after 7 days
- [ ] Cannot accept expired invitation
- [ ] Email mismatch rejection
- [ ] Already member rejection
- [ ] Change member role (OWNER only)
- [ ] Prevent demoting last owner
- [ ] ADMIN cannot remove OWNER
- [ ] ADMIN cannot invite ADMIN
- [ ] Permission enforcement on all routes

## Future Enhancements

1. **Bulk Invitations**
   - Invite multiple emails at once
   - CSV upload for mass invites

2. **Invitation Templates**
   - Predefined messages
   - Event-specific templates

3. **Invitation Analytics**
   - Track acceptance rates
   - Reminder notifications

4. **Custom Roles**
   - User-defined roles
   - Granular permission customization

5. **Team Management**
   - Sub-teams within events
   - Team-based permissions
