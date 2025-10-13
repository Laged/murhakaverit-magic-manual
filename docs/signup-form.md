# Sign-up Form Implementation Plan

## Overview
Add a password-protected sign-up flow for Graniittisauna 2026 event registration, integrated with Airtable.

## Current State Analysis

### Existing Structure
- **Homepage (`/`)**: Two main sections
  1. `PixiDropletSceneWrapper` - Hero section with blood droplet animation
  2. `GraniittiSauna` - Event info card with "Ilmoittaudu tästä!" button (currently non-functional)

### Technology Stack
- Next.js 15.5.4 (App Router)
- React 19.1.0
- No form libraries currently installed
- No Airtable SDK currently installed

---

## Implementation Plan

### Phase 1: Password Dialog Component

#### 1.1 Create Password Dialog Component
**Location**: `src/components/PasswordDialog/`

**Files to create**:
- `src/components/PasswordDialog/index.tsx` - Main dialog component
- `src/components/PasswordDialog/PasswordDialog.module.css` - Styling

**Component Specs**:
- Modal/dialog overlay (dark backdrop)
- Simple password input field
- "Vahvista" (Confirm) button
- "Peruuta" (Cancel) button
- Password: `MurhaOnPop` (case-sensitive)
- On success: Navigate to `/sign-up` using Next.js router
- On failure: Show error message "Väärä salasana" (Wrong password)
- ESC key to close dialog

**Implementation approach**:
- Use React Portal for modal rendering
- Client component (`"use client"`)
- CSS modules for styling to match existing design
- Consider adding blood droplet theme styling to match hero section

#### 1.2 Update GraniittiSauna Component
**File**: `src/components/GraniittiSauna/index.tsx`

**Changes**:
- Convert to client component (add `"use client"`)
- Add state for dialog visibility
- Add onClick handler to "Ilmoittaudu tästä!" button (line 52)
- Import and render `PasswordDialog` component

---

### Phase 2: Sign-up Page

#### 2.1 Create Sign-up Page Route
**Location**: `src/app/sign-up/`

**Files to create**:
- `src/app/sign-up/page.tsx` - Main page component (Server Component)
- `src/app/sign-up/loading.tsx` - Loading state (optional)

**Page Structure**:
- Similar layout to homepage (reuse background styling)
- Centered card layout
- Title: "Ilmottautumiset Graniittisauna 2026"
- Form fields rendered based on server data

#### 2.2 Create Sign-up Form Component
**Location**: `src/components/SignUpForm/`

**Files to create**:
- `src/components/SignUpForm/index.tsx` - Client form component
- `src/components/SignUpForm/SignUpForm.module.css` - Form styling

**Form Fields** (based on Airtable HTML):
1. **Maili** (Email) - textarea/text input
2. **Puhnro** (Phone) - tel input
3. **Nimi** (Name) - textarea/text input
4. **Ruokavalio** (Diet) - multi-select
5. **Allergiat** (Allergies) - textarea/text input
6. **Kuljetus** (Transportation) - single select dropdown
7. **Pelikiinnostus** (Game interest) - multi-select
8. **Tulen paikalle** (Will attend) - single select dropdown
9. **Majoitus** (Accommodation) - special linked record field

**Form Behavior**:
- Client-side validation
- Submit to `/api/sign-up` endpoint
- Loading state during submission
- Success message on completion
- Error handling for failed submissions
- "Tyhjennä lomake" (Clear form) button
- Form state management (React state or form library)

---

### Phase 3: Dynamic Form Options (Server-Side)

#### 3.1 Airtable Integration Setup

**Environment Variables** (add to `.env.local`):
```
AIRTABLE_API_KEY=your_key_here
AIRTABLE_BASE_ID=your_base_id_here
AIRTABLE_TABLE_NAME=Ilmoittautumiset
```

**Dependencies to install**:
```bash
bun add airtable
```

#### 3.2 Airtable Service Module
**Location**: `src/lib/airtable/`

**Files to create**:
- `src/lib/airtable/client.ts` - Airtable client initialization
- `src/lib/airtable/types.ts` - TypeScript types for form data
- `src/lib/airtable/queries.ts` - Server-side query functions

**Functions needed**:
- `getAvailableTransportOptions()` - Fetch kuljetus options with availability
- `getAvailableAccommodationOptions()` - Fetch majoitus options with availability
- `getFormConfiguration()` - Get all dynamic options in one call
- `submitRegistration(data)` - Create new record in Airtable

#### 3.3 Server Component Data Fetching
**File**: `src/app/sign-up/page.tsx`

**Implementation**:
- Fetch form configuration on server
- Pass available options as props to client form component
- Calculate availability based on:
  - **Kuljetus**: Check capacity vs. current registrations
  - **Majoitus**: Check room capacity vs. bookings
- Handle errors gracefully (show form with all options if fetch fails)

---

### Phase 4: API Route

#### 4.1 Create Sign-up API Endpoint
**Location**: `src/app/api/sign-up/`

**Files to create**:
- `src/app/api/sign-up/route.ts` - POST handler

**API Specs**:
- Method: POST
- Content-Type: application/json
- Request body validation
- Call Airtable service to create record
- Return success/error responses
- Handle rate limiting (optional)
- CORS configuration (if needed)

**Response format**:
```typescript
// Success
{
  success: true,
  recordId: "recXXXXXXXX"
}

// Error
{
  success: false,
  error: "Error message here"
}
```

---

### Phase 5: Styling & Polish

#### 5.1 Design Consistency
- Match existing design system (colors, typography, spacing)
- Reuse Card component from GraniittiSauna
- Blood droplet theme elements (optional)
- Responsive design for mobile/tablet/desktop

#### 5.2 Form UX Enhancements
- Field-level validation with visual feedback
- Focus management
- Keyboard navigation
- Loading spinners
- Success animation/message
- Error toast notifications (optional library: react-hot-toast)

---

## File Structure Summary

```
src/
├── app/
│   ├── api/
│   │   └── sign-up/
│   │       └── route.ts                    [NEW]
│   ├── sign-up/
│   │   ├── page.tsx                        [NEW]
│   │   └── loading.tsx                     [NEW - Optional]
│   └── page.tsx                            [EXISTS]
├── components/
│   ├── GraniittiSauna/
│   │   └── index.tsx                       [MODIFY - Add password dialog]
│   ├── PasswordDialog/
│   │   ├── index.tsx                       [NEW]
│   │   └── PasswordDialog.module.css      [NEW]
│   └── SignUpForm/
│       ├── index.tsx                       [NEW]
│       └── SignUpForm.module.css          [NEW]
└── lib/
    └── airtable/
        ├── client.ts                       [NEW]
        ├── types.ts                        [NEW]
        └── queries.ts                      [NEW]
```

---

## Technical Considerations

### Security
- Password is client-side only (acceptable for this use case)
- Airtable API key stored in environment variables (server-side only)
- Input sanitization before sending to Airtable
- Rate limiting on API route (optional but recommended)

### Accessibility
- Proper ARIA labels on form fields
- Focus trapping in password dialog
- Keyboard navigation support
- Screen reader friendly error messages

### Performance
- Server Components for data fetching (no client-side fetch)
- Lazy load form component if needed
- Optimize Airtable queries (single request for all options)

### Error Handling
- Network errors during submission
- Airtable API failures
- Invalid form data
- Full capacity scenarios

---

## Implementation Order

1. ✅ Create password dialog component
2. ✅ Update GraniittiSauna button handler
3. ✅ Create basic sign-up page structure
4. ✅ Set up Airtable service layer
5. ✅ Create sign-up form component (static first)
6. ✅ Implement API route
7. ✅ Add dynamic form options (server-side)
8. ✅ Form validation and error handling
9. ✅ Styling and polish
10. ✅ Testing and QA

---

## Open Questions / Decisions Needed

1. **Form library**: Use a form library (react-hook-form, formik) or plain React state?
2. **Multi-select UI**: Checkboxes, tag input, or dropdown with multiple selection?
3. **Majoitus field**: How does the "linked record" work in Airtable? Does it reference another table?
4. **Validation rules**: Required fields? Email/phone format validation?
5. **Capacity logic**: Should form prevent selection of full options, or just warn user?
6. **Success redirect**: Stay on form, redirect to home, or show confirmation page?
7. **Ruokavalio options**: What are the predefined options (e.g., "Kasvis", "Vegaani", "Liharuoka")?
8. **Pelikiinnostus options**: List of games or categories?

---

## Notes

- This implementation assumes Next.js App Router with React Server Components
- Password protection is intentionally simple (no auth system needed)
- Airtable serves as both database and form configuration source
- Form will be server-side rendered with client-side interactivity for form submission
