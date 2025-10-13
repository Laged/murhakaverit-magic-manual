# Airtable Schema Documentation

## Table Name
**Ilmottautumiset**

## Form Fields Mapping

| Form Field | Airtable Field | Type | Required | Notes |
|------------|----------------|------|----------|-------|
| Nimi | Nimi | Single line text | ✅ | Primary field - participant name |
| Maili | Maili | Single line text | ✅ | Email address |
| Puhnro | Puhnro | Phone number | ✅ | Phone number |
| Ruokavalio | Ruokavalio | Multiple select | ✅ | Dietary preferences |
| Kuljetus | Kuljetus | Single select | ✅ | Transportation method |
| Pelikiinnostus | Pelikiinnostus | Multiple select | ✅ | Game interests |
| Tulen paikalle | Tulen paikalle | Single select | ✅ | Attendance time |
| Allergiat | Allergiat | Single line text | ❌ | Allergies (optional) |
| Terveydellisiä huomioita järjestäjälle | Terveydellisiä huomioita järjestäjälle | Single line text | ❌ | Health notes for organizer (optional) |
| Majoitukset | Majoitukset | Single line text | ❌ | Free-form accommodation notes (optional) |
| Majoitus | Majoitus | Linked record | ✅ | Links to Majoitukset table |
| Osoitetiedot laskusta varten | Osoitetiedot laskusta varten | Long text | ❌ | Billing address (optional) |

## Auto-Generated Fields

These fields are automatically populated by Airtable:

- **Ilmoaika** (Date) - Registration timestamp
- **Tilaa** (Number) - Looked up from linked Majoitus record
- **Majoitusnimi** (Single line text) - Looked up from linked Majoitus record
- **Vapaana** (Number) - Looked up from linked Majoitus record

## Majoitukset Table (Accommodations)

Separate table for managing accommodation options:

| Field | Type | Description |
|-------|------|-------------|
| Name | Single line text | Accommodation name (primary field) |
| Tilaa | Number | Total capacity |
| Ilmottautumiset | Linked record | Links back to registrations |
| Ilmottautuneet | Number | Count of registered participants (rollup) |
| Vapaana | Number | Available spaces (formula: Tilaa - Ilmottautuneet) |

## Dynamic Form Options

Options are fetched from Airtable at build time:

### From Field Choices (select/multiselect):
- **Ruokavalio** - Populated from field options
- **Kuljetus** - Populated from field options
- **Pelikiinnostus** - Populated from field options
- **Tulen paikalle** - Populated from field options

### From Linked Table (Majoitukset):
- **Majoitus** - Fetched from Majoitukset table with availability
  - Shows: `Name (available/capacity vapaana)`
  - Disabled if `Vapaana = 0`
  - Uses record IDs for linking

## Implementation Notes

### Server-Side Data Fetching
- Form options are fetched server-side in `/app/sign-up/page.tsx`
- Uses Next.js caching with `revalidate` for performance:
  - Table schema: 1 hour (3600s)
  - Majoitukset records: 5 minutes (300s) - shorter cache for real-time availability

### Linked Records
Majoitus is stored as an array of record IDs:
```typescript
Majoitus: ["recXXXXXXXX", "recYYYYYYYY"] // Airtable record IDs
```

### Validation
All fields except the following are required:
- Allergiat
- Terveydellisiä huomioita järjestäjälle
- Majoitukset (free-form text)
- Osoitetiedot laskusta varten

## Environment Variables

Required for API access:
```env
AIRTABLE_API_KEY=your_personal_access_token
AIRTABLE_BASE_ID=your_base_id
```

## API Scopes Required

Your Airtable Personal Access Token needs:
- `data.records:read` - Read records and schema
- `data.records:write` - Create new registrations
- `schema.bases:read` - Read field definitions for dynamic options

## Error Handling

Common errors:
- `Table "Ilmoittautumiset" not found` - Check table name (it's "Ilmottautumiset" with one 't')
- `Failed to fetch table schema` - Check API key and base ID
- `Failed to fetch accommodations` - Check Majoitukset table exists and is spelled correctly
