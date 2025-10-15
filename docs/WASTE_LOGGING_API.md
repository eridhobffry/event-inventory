# Waste Logging API

**Status**: ✅ Implemented  
**Date**: October 15, 2025  
**Version**: 1.0.0

## Overview

The Waste Logging API provides endpoints for tracking and analyzing food & beverage waste in event inventory management. This is a critical component of Phase 2 F&B operations, enabling cost tracking, compliance reporting, and operational insights.

## Endpoints

### 1. POST /api/v1/waste

**Create a new waste log entry**

#### Authentication

- **Required**: Yes (Bearer token)
- **Permissions**: EDITOR, ADMIN, or OWNER role for the event

#### Request Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body

```json
{
  "itemId": "uuid", // Required: Item being wasted
  "batchId": "uuid", // Optional: Specific batch (for FIFO tracking)
  "quantity": 5, // Required: Amount wasted (positive integer)
  "reason": "SPOILAGE", // Required: SPOILAGE | OVERPRODUCTION | DAMAGE | CONTAMINATION | OTHER
  "notes": "string", // Optional: Additional context
  "eventId": "uuid" // Required: Event context for permission check
}
```

#### Response (201 Created)

```json
{
  "id": "uuid",
  "itemId": "uuid",
  "batchId": "uuid | null",
  "quantity": 5,
  "reason": "SPOILAGE",
  "notes": "Expired batch from last week",
  "costImpact": "50.00", // Calculated: unitPrice * quantity
  "createdBy": "user-id",
  "timestamp": "2025-10-15T17:30:00.000Z"
}
```

#### Business Logic

1. Validates item exists and belongs to the specified event
2. If `batchId` provided, validates batch exists and has sufficient quantity
3. Calculates `costImpact` from item's `unitPrice`
4. Creates waste log entry
5. **Atomically decrements**:
   - Item quantity (always)
   - Batch quantity (if batch specified)
   - Closes batch (`isOpen = false`) if quantity reaches zero

#### Error Responses

- **400**: Waste quantity exceeds available quantity
- **403**: User lacks permission or item doesn't belong to event
- **404**: Item or batch not found

#### Example Request

```bash
curl -X POST http://localhost:3001/api/v1/waste \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "abc-123",
    "quantity": 10,
    "reason": "SPOILAGE",
    "notes": "Expired on 10/14",
    "eventId": "event-456"
  }'
```

---

### 2. GET /api/v1/waste

**List waste logs with filters**

#### Authentication

- **Required**: No (public endpoint)
- **Scope**: Results filtered by eventId

#### Query Parameters

| Parameter   | Type     | Required | Description                                 |
| ----------- | -------- | -------- | ------------------------------------------- |
| `eventId`   | UUID     | Yes\*    | Event to query (or via `x-event-id` header) |
| `itemId`    | UUID     | No       | Filter by specific item                     |
| `batchId`   | UUID     | No       | Filter by specific batch                    |
| `reason`    | Enum     | No       | Filter by waste reason                      |
| `startDate` | ISO 8601 | No       | Filter logs after this date                 |
| `endDate`   | ISO 8601 | No       | Filter logs before this date                |
| `page`      | Integer  | No       | Page number (default: 1)                    |
| `limit`     | Integer  | No       | Items per page (default: 20, max: 100)      |

\*Required either as query param or `x-event-id` header

#### Response (200 OK)

```json
{
  "data": [
    {
      "id": "uuid",
      "itemId": "uuid",
      "batchId": "uuid | null",
      "quantity": 5,
      "reason": "SPOILAGE",
      "notes": "string | null",
      "costImpact": "50.00",
      "createdBy": "user-id | null",
      "timestamp": "2025-10-15T17:30:00.000Z",
      "item": {
        "name": "Ribeye Steak",
        "sku": "BEEF-RIBEYE-16OZ",
        "category": "FOOD_BEVERAGE"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### Example Request

```bash
# List all waste for an event
curl "http://localhost:3001/api/v1/waste?eventId=event-456&limit=10"

# Filter by reason and date range
curl "http://localhost:3001/api/v1/waste?eventId=event-456&reason=SPOILAGE&startDate=2025-10-01T00:00:00Z"

# Using header for eventId
curl -H "x-event-id: event-456" "http://localhost:3001/api/v1/waste?limit=5"
```

---

### 3. GET /api/v1/waste/summary

**Get aggregated waste statistics**

#### Authentication

- **Required**: No (public endpoint)
- **Scope**: Results filtered by eventId

#### Query Parameters

| Parameter   | Type     | Required | Description                                 |
| ----------- | -------- | -------- | ------------------------------------------- |
| `eventId`   | UUID     | Yes\*    | Event to query (or via `x-event-id` header) |
| `startDate` | ISO 8601 | No       | Start date for aggregation window           |
| `endDate`   | ISO 8601 | No       | End date for aggregation window             |

\*Required either as query param or `x-event-id` header

#### Response (200 OK)

```json
{
  "totalWasteQuantity": 245,
  "totalCostImpact": "3,420.50",
  "wasteByReason": [
    {
      "reason": "SPOILAGE",
      "count": 12, // Number of waste logs
      "totalQuantity": 150,
      "totalCost": "2,100.00"
    },
    {
      "reason": "OVERPRODUCTION",
      "count": 5,
      "totalQuantity": 80,
      "totalCost": "950.25"
    }
  ],
  "topWastedItems": [
    {
      "itemId": "uuid",
      "itemName": "Ribeye Steak",
      "sku": "BEEF-RIBEYE-16OZ",
      "totalQuantity": 45,
      "totalCost": "1,575.00"
    }
  ]
}
```

#### Use Cases

- **Dashboard KPIs**: Display total waste cost and volume
- **Cost Analysis**: Identify highest-cost waste items
- **Operational Insights**: Understand waste patterns (spoilage vs overproduction)
- **Compliance Reporting**: Generate waste reports for audits

#### Example Request

```bash
# Overall summary for an event
curl "http://localhost:3001/api/v1/waste/summary?eventId=event-456"

# Summary for a specific time period
curl "http://localhost:3001/api/v1/waste/summary?eventId=event-456&startDate=2025-10-01T00:00:00Z&endDate=2025-10-15T23:59:59Z"
```

---

## Waste Reasons

| Reason           | Description         | Use Case                               |
| ---------------- | ------------------- | -------------------------------------- |
| `SPOILAGE`       | Expired or went bad | Perishables past expiration date       |
| `OVERPRODUCTION` | Made too much       | Excess prepared food                   |
| `DAMAGE`         | Physical damage     | Broken bottles, crushed produce        |
| `CONTAMINATION`  | Food safety issue   | Cross-contamination, temperature abuse |
| `OTHER`          | Other reasons       | Miscellaneous waste                    |

---

## Integration Points

### With Item Management

- Waste logs automatically decrement `Item.quantity`
- If `batchId` provided, also decrements `ItemBatch.quantity`
- Batch auto-closes when quantity reaches zero

### With FIFO Tracking

- Waste logs can target specific batches for accurate FIFO accounting
- Batch history preserved even after closure (`isOpen = false`)

### Cost Tracking

- `costImpact` calculated automatically: `Item.unitPrice * quantity`
- Null if item has no unit price set
- Aggregated in summary endpoint for reporting

### Audit Trail

- All waste logs include `createdBy` (user ID from auth)
- Immutable records (no update/delete endpoints)
- Full timestamp for chronological analysis

---

## API Documentation

Interactive API documentation available at:

```
http://localhost:3001/docs
```

Navigate to the **waste** tag to explore endpoints with Swagger UI.

---

## Testing

### Prerequisites

1. Backend server running: `npm run dev` (in `/backend`)
2. Valid event with at least one item in database
3. JWT token for authenticated endpoints

### Test Script

```bash
cd backend
node test-waste-api.js
```

This script tests:

- ✅ GET /waste (list with filters)
- ✅ GET /waste/summary (aggregated stats)
- ⚠️ POST /waste (requires authentication - manual test)

### Manual Test: Create Waste Log

```bash
# 1. Get JWT token from Stack Auth (login via frontend)

# 2. Create waste log
curl -X POST http://localhost:3001/api/v1/waste \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "YOUR_ITEM_ID",
    "quantity": 5,
    "reason": "SPOILAGE",
    "notes": "Test waste log",
    "eventId": "YOUR_EVENT_ID"
  }'

# 3. Verify item quantity decreased
curl "http://localhost:3001/api/v1/items/YOUR_ITEM_ID"

# 4. View waste summary
curl "http://localhost:3001/api/v1/waste/summary?eventId=YOUR_EVENT_ID"
```

---

## Implementation Details

### Files Created

- `backend/src/routes/v1/waste.routes.ts` - Route handlers
- `backend/src/server.ts` - Registered waste routes
- `backend/test-waste-api.js` - Test script

### Database Schema

```prisma
model WasteLog {
  id         String      @id @default(uuid())
  itemId     String
  batchId    String?     // Optional: specific batch
  quantity   Int         // Amount wasted
  reason     WasteReason
  notes      String?
  costImpact Decimal?    @db.Decimal(10, 2)
  createdBy  String?     // User ID from Stack Auth
  timestamp  DateTime    @default(now())

  // Relations
  item  Item       @relation(fields: [itemId], references: [id], onDelete: Cascade)
  batch ItemBatch? @relation(fields: [batchId], references: [id], onDelete: SetNull)

  @@index([itemId])
  @@index([batchId])
  @@index([timestamp])
  @@index([reason])
  @@map("waste_logs")
}

enum WasteReason {
  SPOILAGE       // Expired or went bad
  OVERPRODUCTION // Made too much
  DAMAGE         // Physical damage
  CONTAMINATION  // Food safety issue
  OTHER          // Other reasons
}
```

### Transaction Safety

POST /waste uses Prisma transaction to ensure atomicity:

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Create waste log
  // 2. Decrement item quantity
  // 3. Update/close batch (if applicable)
});
```

If any step fails, entire operation rolls back.

---

## Security Considerations

### Authentication

- **POST /waste**: Requires authentication (Bearer token)
- **GET /waste**: Public, but scoped to eventId
- **GET /waste/summary**: Public, but scoped to eventId

### Authorization

- POST requires EDITOR+ role for the event
- Event membership verified via `verifyEventAccess` middleware
- Item ownership verified (must belong to specified event)

### Input Validation

- Zod schemas validate all input
- Quantity must be positive integer
- Waste quantity cannot exceed available quantity
- EventId mismatch returns 403 Forbidden

---

## Future Enhancements

### Phase 3+ Features

- [ ] Waste log photos (image upload)
- [ ] Scheduled waste reports (email digest)
- [ ] Waste reduction goals and tracking
- [ ] AI-powered waste prediction
- [ ] Integration with sustainability metrics
- [ ] Waste disposal method tracking (compost, recycle, landfill)
- [ ] Regulatory compliance reports (HACCP, FDA)

### Performance Optimizations

- [ ] Materialized view for summary stats
- [ ] Cached dashboard metrics
- [ ] Batch waste logging (multiple items at once)
- [ ] Archive old waste logs (>1 year)

---

## Related Documentation

- [Phase 2 F&B Schema Design](./PHASE_2_FB_SCHEMA_DESIGN.md)
- [Items API](http://localhost:3001/docs#tag/items)
- [Audit Logs API](http://localhost:3001/docs#tag/audits)
- [API Documentation](http://localhost:3001/docs)

---

## Support

For issues or questions:

1. Check API docs: http://localhost:3001/docs
2. Review error response messages (usually descriptive)
3. Check server logs: `backend/` console output
4. Verify database state: Prisma Studio (`npx prisma studio`)

---

**Last Updated**: October 15, 2025  
**Maintained By**: Backend Team  
**Status**: ✅ Production Ready
