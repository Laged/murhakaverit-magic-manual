# Sign-up Form Setup Guide

## Overview
The sign-up form has been fully implemented with server-side password validation and Airtable integration.

## Setup Instructions

### 1. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add your Airtable credentials:

```env
# Airtable Configuration
AIRTABLE_API_KEY=your_personal_access_token_here
AIRTABLE_BASE_ID=your_base_id_here

# Sign-up Password
SIGNUP_PASSWORD=MurhaOnPop
```

#### Getting Airtable Credentials:

1. **API Key (Personal Access Token)**:
   - Go to https://airtable.com/create/tokens
   - Click "Create new token"
   - Give it a name (e.g., "Graniittisauna Sign-up")
   - Add scopes: `data.records:read`, `data.records:write`, `schema.bases:read`
   - Add access to your specific base
   - Copy the generated token

2. **Base ID**:
   - Go to https://airtable.com/api
   - Select your base
   - The Base ID is shown in the URL: `https://airtable.com/{BASE_ID}/api/docs`
   - Or find it in the API documentation

### 2. Set Up Airtable Table

Create a table named **"Ilmoittautumiset"** with these fields:

| Field Name | Field Type | Options |
|------------|-----------|---------|
| Maili | Single line text | - |
| Puhnro | Phone number | - |
| Nimi | Single line text | - |
| Ruokavalio | Multiple select | Add your diet options |
| Allergiat | Long text | - |
| Kuljetus | Single select | Add transport options |
| Pelikiinnostus | Multiple select | Add game options |
| Tulen paikalle | Single select | Add attendance options |
| Majoitus | Multiple select | Add accommodation options |

**Example Options**:
- **Ruokavalio**: "Sekaruoka", "Kasvis", "Vegaani", "Gluteeniton"
- **Kuljetus**: "Oma auto", "Kimppakyyti", "Julkinen liikenne", "Järjestäjän auto"
- **Pelikiinnostus**: "Jubensha", "Blood on the Clocktower", "Ten Candles", "Lautapelit"
- **Tulen paikalle**: "Kyllä", "Ehkä", "En"
- **Majoitus**: "Makuusali", "Oma huone", "Kimppahuone", "En tarvitse"

### 3. Test the Application

```bash
# Start development server
bun run dev

# Open http://localhost:3000
```

#### Testing Flow:
1. Click "Ilmoittaudu tästä!" button on homepage
2. Enter password: `MurhaOnPop`
3. Fill out the sign-up form
4. Submit and verify data appears in Airtable

### 4. Deployment

When deploying (e.g., to Vercel), add the same environment variables to your hosting platform:

```
AIRTABLE_API_KEY=...
AIRTABLE_BASE_ID=...
SIGNUP_PASSWORD=MurhaOnPop
```

## Architecture

### Flow Diagram

```
Homepage
  └─> "Ilmoittaudu tästä!" button
       └─> Password Dialog (client component)
            └─> POST /api/check-password (server-side validation)
                 └─> Success: Redirect to /sign-up
                      └─> Server Component fetches form options from Airtable
                           └─> Client Form Component with validation
                                └─> POST /api/sign-up
                                     └─> Zod validation
                                          └─> Submit to Airtable
                                               └─> Success message
```

### Key Features

✅ **Server-side password validation** - Password never exposed to client
✅ **Dynamic form options** - Options fetched from Airtable schema
✅ **Type-safe** - Full Zod validation for form data
✅ **User-friendly** - Real-time validation with error messages
✅ **Toast notifications** - Success/error feedback with react-hot-toast
✅ **Responsive design** - Works on mobile, tablet, and desktop

### File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── check-password/
│   │   │   └── route.ts           # Server-side password validation
│   │   └── sign-up/
│   │       └── route.ts           # Form submission endpoint
│   ├── sign-up/
│   │   └── page.tsx               # Sign-up page (Server Component)
│   └── page.tsx                   # Homepage
├── components/
│   ├── GraniittiSauna/
│   │   └── index.tsx              # Modified with password dialog
│   ├── PasswordDialog/
│   │   ├── index.tsx              # Password dialog component
│   │   └── PasswordDialog.module.css
│   └── SignUpForm/
│       ├── index.tsx              # Form with validation
│       └── SignUpForm.module.css
└── lib/
    └── airtable/
        ├── client.ts              # Airtable API functions
        └── types.ts               # Zod schemas & TypeScript types
```

## Customization

### Change Password
Edit `.env.local`:
```env
SIGNUP_PASSWORD=YourNewPassword
```

### Modify Form Fields
Edit `src/lib/airtable/types.ts` to add/remove fields in the Zod schema.

### Adjust Styling
- Password dialog: `src/components/PasswordDialog/PasswordDialog.module.css`
- Sign-up form: `src/components/SignUpForm/SignUpForm.module.css`

### Change Success Message
Edit `src/components/SignUpForm/index.tsx` around line 114 (the success message component).

## Troubleshooting

### "AIRTABLE_API_KEY environment variable is required"
- Make sure `.env.local` exists and contains valid credentials
- Restart the dev server after adding environment variables

### "Failed to fetch table schema"
- Check your Airtable Personal Access Token has correct scopes
- Verify the Base ID is correct
- Ensure the table name is exactly "Ilmoittautumiset"

### "Väärä salasana" when password is correct
- Check `SIGNUP_PASSWORD` in `.env.local`
- Default is `MurhaOnPop` (case-sensitive)

### Form submission fails
- Check Airtable field names match exactly
- Verify all required fields have values
- Check browser console for detailed error messages

### Dynamic options not loading
- Ensure Airtable fields are type "Single select" or "Multiple select"
- Add at least one option to each select field in Airtable
- Check server logs for API errors

## Security Notes

- ✅ Password validation is server-side only
- ✅ Airtable credentials never exposed to client
- ✅ Input validation with Zod on both client and server
- ✅ No credentials in source code (environment variables only)

## Future Enhancements

Potential features to add:
- Rate limiting on API routes
- Email confirmation after sign-up
- Availability checking (capacity limits)
- Admin dashboard to view registrations
- Edit/cancel registration functionality
- Multi-language support

---

**Questions?** Check the implementation in `docs/signup-form.md` for detailed specifications.
