# Inventory Export Feature

## Overview
The inventory export feature allows users to export their inventory data to CSV format, following 2025 best practices for inventory management systems.

## Features

### 1. **Basic CSV Export**
- Quick export of all visible/filtered items
- Includes all essential inventory fields
- UTF-8 encoding with BOM for Excel compatibility
- Automatic filename with timestamp

### 2. **Detailed Export with Summary**
- Includes all item data plus summary statistics at the top
- Summary includes:
  - Export date and time
  - Event name
  - Total items count
  - Total quantity across all items
  - Total inventory value (EUR)
  - Number of perishable items
  - Number of low stock items

## Export Fields

The CSV export includes the following columns:

### Core Fields
- **SKU** - Stock Keeping Unit (unique identifier)
- **Name** - Item name
- **Category** - Item category (Furniture, AV Equipment, etc.)
- **Status** - Current status (Available, Reserved, etc.)
- **Quantity** - Current quantity on hand
- **Unit of Measure** - Unit type (Each, Pair, Set, etc.)
- **Unit Price (EUR)** - Price per unit in Euros
- **Total Value (EUR)** - Calculated total value (Quantity × Unit Price)
- **Location** - Storage location
- **Bin** - Specific bin/shelf location

### Food & Beverage Fields (Phase 2)
- **Is Perishable** - Yes/No indicator
- **Storage Type** - Dry/Chill/Freeze
- **Par Level** - Target stock level
- **Reorder Point** - Minimum stock before reorder
- **Supplier** - Supplier name
- **Is Alcohol** - Yes/No indicator
- **ABV (%)** - Alcohol by volume percentage
- **Allergens** - List of allergens (semicolon-separated)

### Metadata Fields
- **Last Audit** - Date of last inventory audit
- **Created At** - Record creation timestamp
- **Updated At** - Last update timestamp
- **Event ID** - Associated event identifier

## Usage

### From the Items List Page

1. Navigate to `/items`
2. Apply any filters you want (category, status, storage type, etc.)
3. Click one of the export buttons:
   - **Export CSV** - Basic export of filtered items
   - **Export Detailed** - Export with summary statistics

### Export Behavior

- **Respects Filters**: Only exports items that match your current filters
- **Real-time Data**: Exports current data from the database
- **Automatic Naming**: Files are named with event name and timestamp
  - Format: `{EventName}_inventory_export_{YYYY-MM-DD_HHmmss}.csv`
  - Example: `Summer_Festival_inventory_export_2025-10-15_234530.csv`

### File Format

- **Encoding**: UTF-8 with BOM (Excel-compatible)
- **Delimiter**: Comma (`,`)
- **Text Qualifier**: Double quotes (`"`) when needed
- **Line Ending**: LF (`\n`)

## Best Practices (2025)

### 1. **Data Accuracy**
- All exports use real-time data
- Calculated fields (Total Value) are computed at export time
- Timestamps are formatted consistently (ISO 8601)

### 2. **Security**
- Exports only include items from the current event
- User must be authenticated to export
- No sensitive authentication data is included

### 3. **Compatibility**
- UTF-8 BOM ensures Excel opens files correctly
- Proper CSV escaping for special characters
- Compatible with Google Sheets, Excel, LibreOffice

### 4. **Usability**
- Export buttons disabled when no items available
- Toast notifications confirm successful export
- Error handling with user-friendly messages
- Loading state prevents duplicate exports

## Technical Implementation

### Files
- `/frontend/lib/utils/export.ts` - Export utility functions
- `/frontend/app/items/page.tsx` - UI integration

### Key Functions

```typescript
// Basic export
exportItemsToCSV(items: Item[], eventName?: string): void

// Detailed export with summary
exportItemsWithSummary(items: Item[], eventName?: string): void

// Low-level utilities
convertItemsToCSV(items: Item[]): string
downloadCSV(csvContent: string, filename: string): void
```

### CSV Escaping Rules
- Values containing commas, quotes, or newlines are wrapped in quotes
- Double quotes within values are escaped as `""`
- Null/undefined values are exported as empty strings
- Arrays (like allergens) are joined with semicolons

## Examples

### Basic Export Filename
```
inventory_export_2025-10-15_234530.csv
```

### Event-Specific Export Filename
```
Summer_Music_Festival_inventory_export_2025-10-15_234530.csv
```

### Detailed Export with Summary
```csv
INVENTORY EXPORT SUMMARY
Export Date: 2025-10-15 23:45:30
Event: Summer Music Festival
Total Items: 42
Total Quantity: 1,250
Total Value: €15,432.50
Perishable Items: 8
Low Stock Items: 3


SKU,Name,Category,Status,Quantity,Unit of Measure,...
FURN-001,Folding Chair,FURNITURE,AVAILABLE,100,EACH,...
AV-042,Microphone,AV_EQUIPMENT,AVAILABLE,15,EACH,...
```

## Future Enhancements

Potential improvements for future versions:
- [ ] Export to Excel (.xlsx) format
- [ ] Custom field selection
- [ ] Scheduled automatic exports
- [ ] Export templates
- [ ] Batch export history
- [ ] Export to cloud storage (Google Drive, Dropbox)
- [ ] QR code generation for items
- [ ] Barcode integration

## Troubleshooting

### Export button is disabled
- Ensure you have items in your inventory
- Check that filters aren't excluding all items
- Verify you're logged in and have an event selected

### File won't open in Excel
- The file uses UTF-8 with BOM, which should work automatically
- If issues persist, try "Import Data" in Excel instead of double-clicking
- Ensure you're using a recent version of Excel (2016+)

### Special characters appear incorrectly
- This is usually an encoding issue
- Try opening the file in Google Sheets first
- Use Excel's "Get Data" feature and specify UTF-8 encoding

## Support

For issues or feature requests related to the export functionality, please:
1. Check this documentation first
2. Review the console for error messages
3. Contact the development team with:
   - Browser and version
   - Steps to reproduce
   - Screenshot of the error (if applicable)
