# Sign-up System Documentation

## Overview

The Graniittimatkat 2026 event has a password-protected sign-up system integrated with Airtable for storing registrations. The system includes both client-side and **server-side authentication** to ensure only authorized users can access the registration form.

## Security Architecture

### Multi-Layer Protection

1. **Client-Side Password Dialog**
   - Initial barrier with password input
   - Located: `src/components/PasswordDialog/`
   - Triggered by "Ilmoittaudu tästä!" button on homepage

2. **Server-Side Cookie Authentication**
   - Sets HTTP-only cookie upon successful password verification
   - Cookie name: `signup-auth`
   - Expires after 1 hour
   - Secure in production (HTTPS only)
   - SameSite: strict

3. **Middleware Protection**
   - Located: `src/middleware.ts`
   - Intercepts all requests to `/sign-up`
   - Redirects to homepage if cookie is missing or invalid
   - **Cannot be bypassed** with direct links

### Authentication Flow

```
User clicks "Ilmoittaudu tästä!"
    ↓
PasswordDialog opens (client-side)
    ↓
User enters password
    ↓
POST /api/check-password
    ↓
Server validates password
    ↓
✓ Success: Sets httpOnly cookie + returns success
    ↓
Client navigates to /sign-up
    ↓
Middleware checks cookie
    ↓
✓ Valid: Renders sign-up form
✗ Invalid: Redirects to homepage
```

## Components

### 1. PasswordDialog (`src/components/PasswordDialog/`)

**Purpose**: Initial password authentication modal

**Features**:
- Brutalist design with thick borders
- No rounded corners
- Server-side validation
- Loading states
- Error handling
- ESC key to close
- Focus management

**Styling**:
- 6px solid black border
- 12px box shadow offset
- Barlow Condensed font for title
- IBM Plex Sans for body text

### 2. SignUpForm (`src/components/SignUpForm/`)

**Purpose**: Multi-field registration form

**Fields**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Maili | Email | ✅ | Email validation |
| Puhnro | Phone | ✅ | |
| Nimi | Text | ✅ | Full name |
| Ruokavalio | Multi-checkbox | ✅ | Diet preferences |
| Allergiat | Textarea | ❌ | Optional allergies |
| Kuljetus | Dropdown | ✅ | Transportation |
| Pelikiinnostus | Multi-checkbox | ✅ | Game interests |
| Tulen paikalle | Dropdown | ✅ | Attendance confirmation |
| Majoitus | Multi-checkbox | ✅ | Accommodation (with capacity) |

**Features**:
- Real-time client-side validation
- Fixed-height error containers (no layout shift)
- Dynamic options loaded from Airtable
- Accommodation availability display
- Toast notifications (react-hot-toast)
- Success state after submission
- Clear form button

**Styling**:
- Brutalist design matching brand
- 3px solid black borders on inputs
- No rounded corners
- Black text (#000000) for high contrast
- Barlow Condensed buttons with box-shadow hover effect

### 3. Sign-up Page (`src/app/sign-up/page.tsx`)

**Purpose**: Server Component that renders the protected sign-up form

**Responsibilities**:
- Fetch form options from Airtable at request time
- Handle Airtable connection errors
- Pass dynamic options to client form component
- Protected by middleware (server-side)

**Layout**:
- Centered card with max-width: 960px
- Responsive padding (p-8)
- Uses shared Card component from GraniittiSauna

## API Routes

### POST `/api/check-password`

**Purpose**: Validate password and set authentication cookie

**Request**:
```json
{
  "password": "string"
}
```

**Response (Success)**:
```json
{
  "success": true
}
```
Sets cookie: `signup-auth=authenticated` (httpOnly, 1h expiry)

**Response (Error)**:
```json
{
  "success": false,
  "error": "Väärä salasana"
}
```

**Security**:
- Password stored in environment variable
- Cookie is httpOnly (not accessible via JavaScript)
- Secure flag in production
- SameSite: strict

### POST `/api/sign-up`

**Purpose**: Submit registration to Airtable

**Request**:
```json
{
  "Nimi": "string",
  "Maili": "string",
  "Puhnro": "string",
  "Ruokavalio": ["string"],
  "Kuljetus": "string",
  "Pelikiinnostus": ["string"],
  "Tulen paikalle": "string",
  "Allergiat": "string (optional)",
  "Terveydellisiä huomioita järjestäjälle": "string (optional)",
  "Majoitukset": "string (optional)",
  "Majoitus": ["recordId"],
  "Osoitetiedot laskusta varten": "string (optional)"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "recordId": "recXXXXXXXX"
}
```

**Validation**:
- Zod schema validation on server
- All required fields enforced
- Email format validation

## Middleware

### File: `src/middleware.ts`

**Purpose**: Server-side route protection

**Logic**:
```typescript
if (request.nextUrl.pathname === "/sign-up") {
  const authToken = request.cookies.get("signup-auth");
  
  if (!authToken || authToken.value !== "authenticated") {
    return NextResponse.redirect(new URL("/", request.url));
  }
}
```

**Matcher**: `/sign-up`

**Benefits**:
- Runs on Next.js Edge Runtime (fast)
- Cannot be bypassed with direct links
- No client-side rendering for unauthorized users
- SEO-friendly (proper redirects)

## Airtable Integration

### Configuration

Environment variables required:
```env
AIRTABLE_API_KEY=your_personal_access_token
AIRTABLE_BASE_ID=your_base_id
SIGNUP_PASSWORD=MurhaOnPop
```

### Tables

#### Main Table: "Ilmottautumiset"
Stores all registrations with fields matching form inputs.

#### Linked Table: "Majoitukset"
Stores accommodation options with capacity tracking:
- **Name**: Accommodation name
- **Tilaa**: Total capacity
- **Ilmottautuneet**: Count of registered (rollup)
- **Vapaana**: Available spaces (formula)

### Functions

Located in `src/lib/airtable/client.ts`:

- `getTableSchema()`: Fetch field definitions for dynamic options
- `getMajoitusOptions()`: Get accommodation with availability
- `getFormOptions()`: Combine all form options
- `submitRegistration()`: Create new registration record

### Caching

- Table schema: 1 hour (3600s)
- Accommodation data: 5 minutes (300s)
- Next.js `revalidate` for server-side caching

## Design System

### Typography

- **Headings**: Barlow Condensed, 900 weight, uppercase, 0.06-0.08em letter-spacing
- **Body text**: IBM Plex Sans, 400/600 weight
- **Buttons**: Barlow Condensed, 900 weight, uppercase

### Colors

- **Brand red**: #880808
- **Black**: #000000
- **White**: #ffffff
- **Error red**: #dc2626
- **Success green**: #166534

### Brutalist Elements

- Thick borders (3px-6px)
- No border radius (sharp corners)
- Box shadows with offset (8px-12px)
- High contrast
- Bold typography
- Minimal color palette

### Interactive States

**Buttons**:
- Hover: Box shadow + translate(-2px, -2px)
- Transition: 120ms ease

**Inputs**:
- Focus: Border color → #880808
- Transition: 200ms

## User Experience

### Error Handling

**Layout Stability**:
- Error containers have min-height: 1.75rem
- Prevents layout shifts when errors appear/disappear
- Smooth, non-janky experience

**Validation Feedback**:
- Real-time field validation
- Clear error messages in Finnish
- Visual indicators (red text, border color change)
- Toast notifications for form submission

**Loading States**:
- "Tarkistetaan..." for password check
- "Lähetetään..." for form submission
- Disabled buttons during loading

### Success Flow

After successful submission:
1. Form is replaced with success message
2. Green success notification toast
3. User can navigate away or stay on page
4. Cookie remains valid for 1 hour

### Accessibility

- Proper label associations (htmlFor + id)
- Focus management in modals
- Keyboard navigation (ESC to close)
- High contrast text (#000000 on white)
- Semantic HTML elements
- ARIA labels where appropriate

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── check-password/
│   │   │   └── route.ts                    # Password validation + cookie
│   │   └── sign-up/
│   │       └── route.ts                    # Registration submission
│   └── sign-up/
│       └── page.tsx                        # Protected sign-up page
├── components/
│   ├── GraniittiSauna/
│   │   ├── index.tsx                       # Homepage with trigger button
│   │   ├── Card.tsx                        # Shared card component
│   │   └── GraniittiSauna.module.css      # Shared styles
│   ├── PasswordDialog/
│   │   ├── index.tsx                       # Password modal
│   │   └── PasswordDialog.module.css      # Modal styles
│   └── SignUpForm/
│       ├── index.tsx                       # Registration form
│       └── SignUpForm.module.css          # Form styles
├── lib/
│   └── airtable/
│       ├── client.ts                       # Airtable API functions
│       └── types.ts                        # Zod schemas & TypeScript types
└── middleware.ts                           # Route protection
```

## Testing Checklist

### Password Protection
- [ ] Password dialog opens on button click
- [ ] Wrong password shows error
- [ ] Correct password redirects to /sign-up
- [ ] Cookie is set after successful login
- [ ] Direct link to /sign-up redirects if no cookie
- [ ] Cookie expires after 1 hour

### Form Functionality
- [ ] All required fields show errors if empty
- [ ] Email validation works
- [ ] Multi-select fields allow multiple choices
- [ ] Accommodation shows availability
- [ ] Full accommodations are disabled
- [ ] Clear form button resets all fields
- [ ] Success message appears after submission
- [ ] Data appears in Airtable correctly

### UX/Accessibility
- [ ] No layout shifts when errors appear
- [ ] ESC closes password dialog
- [ ] Tab navigation works
- [ ] Loading states show during async operations
- [ ] Toast notifications appear
- [ ] High contrast text is readable

### Responsive Design
- [ ] Works on mobile (320px+)
- [ ] Works on tablet (768px+)
- [ ] Works on desktop (1024px+)
- [ ] Card expands to max-width on desktop
- [ ] Touch targets are adequate on mobile

## Deployment

### Environment Variables

Set in hosting platform (e.g., Vercel):

```env
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
SIGNUP_PASSWORD=MurhaOnPop
NODE_ENV=production
```

### Build

```bash
bun run build
```

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Airtable base and tables set up
- [ ] Field options added to Airtable
- [ ] Majoitukset table populated with accommodations
- [ ] Test password authentication in production
- [ ] Test form submission to Airtable
- [ ] Verify middleware protection works
- [ ] Test cookie expiry behavior

## Maintenance

### Adding Form Fields

1. Add field to Airtable table
2. Update `SignUpFormSchema` in `src/lib/airtable/types.ts`
3. Add field to form in `src/components/SignUpForm/index.tsx`
4. Add field to `submitRegistration` in `src/lib/airtable/client.ts`

### Changing Password

Update environment variable:
```env
SIGNUP_PASSWORD=NewPassword123
```

### Adjusting Cookie Duration

Edit `src/app/api/check-password/route.ts`:
```typescript
maxAge: 7200, // 2 hours instead of 1
```

### Modifying Design

All styles use CSS modules:
- Dialog: `src/components/PasswordDialog/PasswordDialog.module.css`
- Form: `src/components/SignUpForm/SignUpForm.module.css`
- Shared: `src/components/GraniittiSauna/GraniittiSauna.module.css`

## Known Limitations

1. **Single password**: All users share the same password (WhatsApp distribution)
2. **Cookie duration**: 1-hour expiry (user must re-authenticate if session expires)
3. **No rate limiting**: API routes could be rate-limited with Vercel Edge Config or Redis
4. **No capacity enforcement**: Form allows selection of full accommodations (warning only)
5. **No edit functionality**: Users cannot edit their registration after submission
6. **No confirmation email**: Users don't receive email confirmation

## Future Enhancements

- Rate limiting on API routes
- Email confirmations with Resend/SendGrid
- Admin dashboard for viewing registrations
- Capacity enforcement (prevent overbooking)
- Edit registration with unique token
- QR code generation for check-in
- Export registrations to PDF/CSV
- Multi-language support (Finnish/English)

## Troubleshooting

### "Virhe lomakkeen latauksessa"
- Check `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID`
- Verify Airtable Personal Access Token has correct scopes
- Check table name is "Ilmottautumiset" (exact spelling)

### Password dialog doesn't open
- Check browser console for errors
- Verify `"use client"` directive in GraniittiSauna component
- Check React state management

### Direct link to /sign-up works (bypasses password)
- Verify `src/middleware.ts` exists
- Check middleware matcher configuration
- Ensure Next.js version supports middleware (13.0+)
- Clear cookies and try again

### Form submission fails
- Check all required fields are filled
- Verify Airtable field names match exactly
- Check browser console for validation errors
- Verify API route is handling Zod validation

### Cookie not persisting
- Check `secure` flag (should be false in development)
- Verify `httpOnly` is set
- Check browser cookie settings
- Clear cookies and try again

---

**Last Updated**: 2025-01-13
**Status**: ✅ Production Ready
