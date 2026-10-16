# Geo Pin Properties — user dashboard spec

A description of the signed-in user dashboard on the marketplace (`web-frontend`) as it works today, written so the dashboard can be redesigned without reading the code. Every label, message and placeholder below is copied from the UI. Where something on screen is placeholder or not connected to the server, it says so (see also [Known gaps](#11-known-gaps)).

Source: `web-frontend` and `backend` on the `dev` line, 15 October 2026. File paths are relative to `web-frontend/` unless they start with `backend/`.

## Contents

1. [Tech stack](#1-tech-stack)
2. [Who sees what: roles and plans](#2-who-sees-what-roles-and-plans)
3. [Shared pieces](#3-shared-pieces)
4. [Overview — `/dashboard`](#4-overview--dashboard)
5. [My Listings — `/dashboard?tab=listings`](#5-my-listings--dashboardtablistings)
6. [Upload — `/dashboard/upload`](#6-upload--dashboardupload)
7. [Analytics — `/dashboard?tab=analytics`](#7-analytics--dashboardtabanalytics)
8. [Billing & Plan — `/dashboard?tab=billing`](#8-billing--plan--dashboardtabbilling)
9. [KYC Status — `/dashboard?tab=kyc`](#9-kyc-status--dashboardtabkyc)
10. [Account Settings — `/dashboard?tab=settings`](#10-account-settings--dashboardtabsettings)
11. [Known gaps](#11-known-gaps)
12. [Mobile summary](#12-mobile-summary)

---

## 1. Tech stack

| Area        | What is used                                                                                                                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework   | React 19, TypeScript, Vite 7, TanStack Start                                                                                                                                                                                                                     |
| Routing     | TanStack Router, file-based routes in `src/routes/`. All dashboard routes are client-only (`ssr: false`). Tabs are a URL search param: `/dashboard?tab=…`                                                                                                        |
| Server data | TanStack Query for plans, rentals and notifications. Most user data (profile, land listings, plan, invoices) lives in a React context, `src/lib/auth.tsx` (`useAuth()`), loaded once at sign-in and refreshed after payments                                     |
| Local state | React `useState`. Upload wizards autosave to `localStorage`; draft photos to IndexedDB (`src/lib/draftPhotoStore.ts`)                                                                                                                                            |
| API client  | `src/lib/api.ts` — `fetch` with a Bearer token; uploads use `XMLHttpRequest` for progress. Base URL `VITE_API_URL` (production `https://api.geopinproperties.co.ke/api`). A `401` sends the user to `/login`; a `503` sends them to `/maintenance`               |
| Styling     | Tailwind CSS 4 with CSS variables in `src/styles.css`, plus shadcn/ui components (Radix primitives) in `src/components/ui/`. Some screens also use plain CSS classes (`gs-*`, `gm-*` from `src/components/site/site-pages.css` and `src/components/map/map.css`) |
| Icons       | `lucide-react`                                                                                                                                                                                                                                                   |
| Charts      | `recharts` (area charts), plus hand-built SVG/CSS charts (sparklines, funnel, day-of-week bars, ranked bars)                                                                                                                                                     |
| Maps        | Leaflet 1.9, react-leaflet 5, leaflet-draw (boundary tracing)                                                                                                                                                                                                    |
| Dates       | `date-fns`, `react-day-picker` (range calendar)                                                                                                                                                                                                                  |
| Toasts      | `sonner` (`src/components/ui/sonner.tsx`), mounted top-right with rich colours in `src/routes/__root.tsx`                                                                                                                                                        |
| Backend     | Laravel 12 REST API (`backend/`), Sanctum tokens. Payments: M-Pesa STK push and Paystack card checkout                                                                                                                                                           |

## 2. Who sees what: roles and plans

### Roles

The API has four user roles: `individual`, `agent`, `developer`, `account_manager`.

- **Signed out:** any dashboard route redirects to `/login`.
- **`account_manager`:** redirected to `/manager` (a separate screen, not covered here).
- **`individual`, `agent`, `developer`:** see exactly the same dashboard. The role only appears as a grey chip in Settings and as the "Role" field there. There is no separate owner or agent layout.
- **Admins** do not use this dashboard. They use the separate admin console app (`admin-web-frontend-`). The `is_admin` flag is loaded but not used anywhere in the dashboard.

### Plans

Plans come from `GET /plans` (only active plans, cheapest first). The seeded values are below; admins can change them, so treat the numbers as data, not as fixed copy.

|                                                      | Free   | Basic          | Pro       | Enterprise |
| ---------------------------------------------------- | ------ | -------------- | --------- | ---------- |
| Monthly price (KES)                                  | 0      | 1,500          | 4,500     | 15,000     |
| Yearly price (KES)                                   | 0      | 13,500         | 40,500    | 135,000    |
| Land listings                                        | 3      | 10             | Unlimited | Unlimited  |
| Photos per listing                                   | 3      | 10             | 20        | 20         |
| Documents per listing (not counting the National ID) | 3      | 6              | 10        | 10         |
| Analytics tab                                        | Locked | Locked         | Yes       | Yes        |
| "Export CSV" on My Listings (custom reports)         | —      | —              | Yes       | Yes        |
| Dedicated account manager card in Billing            | —      | —              | —         | Yes        |
| Badge                                                | —      | "Most Popular" | —         | —          |

Each plan's bullet list (`features`) is generated by the server:

- **Free:** "3 active listings", "3 photos per listing", "Standard KYC review"
- **Basic:** "10 active listings", "10 photos per listing", "Standard KYC review"
- **Pro:** "Unlimited active listings", "20 photos per listing", "Priority KYC review", "Advanced analytics dashboard", "API access", "Bulk upload", "Custom reports"
- **Enterprise:** as Pro, plus "Dedicated account manager"

### Where plan limits show up in the UI

- **Analytics:** blurred, with a "Pro only" lock card, unless the plan has analytics.
- **Views counts:** the "Views" column (My Listings), view counts (Overview) and the "Views" fact (listing preview) only show with analytics access.
- **Export CSV** on My Listings: plans with custom reports only.
- **Upload photo and document counters** use the plan's limits, with upgrade links once they are reached.
- **Upload is blocked** once the listing limit is reached ("Listing limit reached").
- **"Upgrade to Pro →"** links on Overview: hidden on Pro.

### Where the user data comes from

Every tab reads one shared user object built from four calls made at sign-in:

| Endpoint                 | Fields used                                                                                                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /user/me`           | `id`, `name`, `email`, `phone`, `role`, `is_admin`, `avatar_color`, `county`, `bio`, `company`, `language`, `two_factor_enabled`, `email_verified_at`, `email_verification_required`, `notifications{email_inquiries, sms_alerts, weekly_digest, marketing}` |
| `GET /user/listings`     | per land listing: `id`, `title`, `parcel_number`, `county`, `price`, `status` (`pending` / `active` / `sold`), `views`, `created_at`, `cover_photo_url`                                                                                                      |
| `GET /user/subscription` | `plan` (slug), `plan_name`, `status`, `billing_cycle`, `ends_at`, `cancelled_at`, `max_listings` (−1 = unlimited), `analytics_access`, `custom_reports`, `dedicated_manager{name, email}`                                                                    |
| `GET /user/payments`     | per invoice: `number`, `date`, `amount`, `plan`, `status` (`Paid` / `Pending` / `Failed` / `Refunded`), `download_url`                                                                                                                                       |

## 3. Shared pieces

### 3.1 Page frame — `src/components/DashboardShell.tsx`

Every dashboard page renders inside this shell, top to bottom:

1. **Top navbar** — `src/components/Navbar.tsx` (the site-wide header), 56 px tall on mobile, 64 px from 640 px up.
2. **Left sidebar** (desktop, 768 px and up): 240 px wide, sticky, white card background, right border.
3. **Main content area**: 16 px side padding, 24 px top padding (32 px on desktop), extra bottom padding on mobile so content clears the bottom bar.
4. **Bottom navigation bar** (mobile, below 768 px): floating, fixed 12 px from the bottom and sides.
5. **"Verify your account" modal**, on top of everything when the platform requires email verification and the user hasn't verified (see 3.4).

**Sidebar items, in order** (icon, then label):

| Icon (lucide) | Label            | Goes to             |
| ------------- | ---------------- | ------------------- |
| LayoutGrid    | Overview         | `/dashboard`        |
| List          | My Listings      | `?tab=listings`     |
| Upload        | Upload           | `/dashboard/upload` |
| BarChart3     | Analytics        | `?tab=analytics`    |
| Wallet        | Billing & Plan   | `?tab=billing`      |
| ShieldCheck   | KYC Status       | `?tab=kyc`          |
| Settings      | Account Settings | `?tab=settings`     |

- **Active item:** green text on a light green background (`brand` at 10%).
- **Upload** is never highlighted, even while you are on the upload pages.

**Mobile bottom bar:**

- A white rounded pill holding four buttons: Overview, Listings, Upload, Analytics. A fifth, **More** (MoreHorizontal icon), opens an upward menu with Billing & Plan, KYC Status and Account Settings.
- **Inactive buttons** are 44 px icon-only circles.
- **The active button** expands into a pill showing a filled green icon disc and its short label: "Overview", "Listings", "Upload", "Analytics", "Billing", "KYC" or "Settings".
- **When the active page lives under More**, the More button expands and shows that page's short label.

**Top navbar contents** (left to right):

- Logo plus "Geo Pin Properties" / "KENYA".
- Desktop links:
  - "Pin Properties" dropdown: "Explore map" (Land and rentals together), "Land" (Plotted parcels for sale or lease), "Rentals" (Homes, BnBs and property for sale).
  - "Pricing".
  - From 1280 px: "Blog", "About", "Help Centre", "Contact". Below 1280 px these sit in a "More" dropdown.
  - "Dashboard".
- Search input, placeholder "Search parcel, county…" (1024 px and up).
- Notification bell.
- Light/dark toggle.
- "Dashboard" button.
- Log-out icon button.
- **Below 768 px**: a hamburger ("Toggle menu") opens a slide-down menu with the same links, a "Switch to light mode" / "Switch to dark mode" row, and "Dashboard" and "Log out" buttons.

### 3.2 Notification bell — `src/components/NotificationBell.tsx`

- **Data:** `GET /user/notifications` (`id`, `read_at`, `created_at`, `data.type`, `data.message`). Opening the popover calls `POST /user/notifications/read-all`.
- **Unread badge:** a green count, capped at "9+".
- **Popover:** 320 px wide, titled "Notifications". Each item shows a title, up to two lines of message, and a date ("Oct 9, 08:15").
  - The only notification type with a friendly title is `kyc_info_requested`: "KYC — Additional information requested". Any other type shows its raw type name.
- **Empty state:** "No notifications yet".
- **Error state:** "Unable to load notifications. Please try again later."

### 3.3 Theme and colours — `src/styles.css`

Light and dark themes are switched by a `dark` class on `<html>`. The choice is saved as `lv_theme`, and the switch uses a circular-wipe animation (`src/hooks/useTheme.ts`). Font: Inter. Base corner radius: 8 px.

| Token                        | Light                 | Dark                      |
| ---------------------------- | --------------------- | ------------------------- |
| `background`                 | #F8FAFC               | dark navy (oklch 0.129)   |
| `foreground`                 | #0F172A               | near-white                |
| `card`                       | #FFFFFF               | navy (oklch 0.208)        |
| `primary` (logo navy)        | #0F172A               | light slate               |
| `muted` / `muted-foreground` | light slate / #475569 | slate / light slate       |
| `border`                     | #E2E8F0               | —                         |
| `brand` (main green)         | #15803D               | #22C55E                   |
| `brand-hover`                | #166534               | #4ADE80                   |
| `brand-subtle` / foreground  | #DCFCE7 / #166534     | dark green tint / #86EFAC |
| `success`                    | #16A34A               | #22C55E                   |
| `warning` / subtle           | #D97706 / #FFFBEB     | —                         |
| `destructive` / subtle       | #DC2626 / #FEF2F2     | lighter red               |

Many dashboard components hard-code hex colours instead of these tokens. Examples:

- green buttons `#15803D` / `#166534`, and the navy button `#0F172A`
- chart colours: navy `#0F172A` (views), green `#15803D` (saves), teal `#0D9488` (inquiries), amber `#D97706` (conversion), purple `#9333EA`
- KYC status colours
- the upload wizard's white inputs

These do not change in dark mode.

### 3.4 Modals, dialogs and feedback

| Component               | File                                                              | Used for                                                      |
| ----------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------- |
| Verify account          | `src/components/VerifyAccountModal.tsx`                           | Blocks the dashboard until email is verified (when required)  |
| Upgrade your plan       | `src/components/UpgradeModal.tsx` + `src/components/PlanCard.tsx` | Plan picker (Overview, Analytics, Upload)                     |
| Checkout (subscription) | `src/components/CheckoutModal.tsx`                                | Paying for a plan: M-Pesa or card                             |
| Boost / featured        | `src/components/BoostModal.tsx`                                   | Paying for a listing add-on                                   |
| M-Pesa STK              | `src/components/StkCheckoutModal.tsx`                             | Paying the rental posting fee                                 |
| Listing preview         | `src/components/dashboard/ListingPreviewDialog.tsx`               | Radix Dialog with listing details                             |
| Confirm dialogs         | `src/components/ui/alert-dialog.tsx`                              | Delete listing, mark sold/taken/occupied                      |
| Cancel plan, Submit KYC | inline in `src/routes/dashboard.index.tsx`                        | Hand-built overlays                                           |
| Empty states            | `src/components/ui/empty-state.tsx`                               | Dashed-border card: optional icon, title, description, action |
| Spinner, Skeleton       | `src/components/ui/spinner.tsx`, `skeleton.tsx`                   | Loading                                                       |
| Toasts                  | `sonner`                                                          | Only used for the card-payment return in Billing              |

**Verify your account** (cannot be closed):

- Shield icon, title "Verify your account", and the text "We sent a 6-digit code to {email}. Enter it below to continue."
- **Code field:** 6 digits only (non-digits are stripped), centred, wide letter spacing, placeholder "000000".
- **Buttons:**
  - "Verify" (shows "Verifying…" while working; disabled until 6 digits are entered)
  - "Resend code" (shows "Sending…"; afterwards "A new code has been sent.")
  - "Sign out"
- **Errors:** the server's message, or "Invalid or expired code. Please try again." / "Failed to resend code. Please try again."
- **Endpoints:** `POST /auth/email/verify {code}`, `POST /auth/email/resend`.

**Upgrade your plan** (full-screen dim; three-column grid on desktop):

- Title "Upgrade your plan", with an optional reason line. The upload wizard passes "Upgrade to unlock more listings and photos."
- **Each plan card shows:**
  - the plan name
  - a listings line: "Up to N active listings" or "Unlimited listings"
  - the price: "KES" + amount + "/mo"
  - every feature, each with a green check
  - a button: "Current plan" (disabled), "Start free" (price 0), or "Choose {Plan}"
- **The badged plan** (Basic, "Most Popular") gets a 2 px green border and the badge on its top edge.
- **Picking a paid plan** opens Checkout. Picking Free changes the plan in the browser only (see gaps).

**Checkout** (`CheckoutModal`), max width 448 px:

- **Form:**
  - Title "Upgrade to {Plan}"; subtitle "Pay with M-Pesa to activate." or "Pay with card to activate."
  - Method toggle: **M-Pesa** (phone icon) / **Card** (card icon)
  - Billing cycle toggle: **Monthly** (with "KES 4,500") / **Yearly** (with "KES 40,500")
  - When switching mid-subscription, a green note: "You'll pay for a full month and keep about N bonus days carried over from your current plan." The days come from `POST /user/subscription/preview {plan, billing_cycle}` → `{amount, credited_days, ends_at}`.
  - **M-Pesa:** field "M-Pesa phone number" (placeholder "07XX XXX XXX", required).
  - **Card:** the text "You'll be redirected to a secure page to enter your card details."
  - Button: "Pay KES {amount}".
- **States after paying:**
  - **Waiting (M-Pesa):** phone icon, "Check your phone", "Enter your M-Pesa PIN on the prompt sent to {phone} to complete the payment.", a spinner with "Waiting for confirmation…", the line "Didn't get a prompt? Cancel and try again." and a button "Cancel and try again".
  - **Waiting (card):** spinner, "Redirecting to checkout…", "Taking you to a secure page to complete your card payment."
  - **Success:** check icon, "Payment received", "Your {Plan} plan is now active.", button "Done".
  - **Pending** (no answer after 90 s): clock icon, "Still processing", "M-Pesa is taking longer than usual. You don't need to pay again — if it went through, your {Plan} plan activates automatically and we'll email your receipt.", button "Done".
  - **Failed:** back to the form with a red message, "The payment was cancelled or failed. Please try again.", or the server's message.
- **Endpoints:**
  - M-Pesa: `POST /user/subscription/checkout {plan, billing_cycle, phone}` → `{invoice_id}`, then poll `GET /user/invoices/{id}/status` every 4 s for up to 90 s. Cancel: `POST /user/invoices/{id}/cancel`.
  - Card: `POST /user/subscription/checkout/card {plan, billing_cycle}` → `{authorization_url}` (Paystack); the browser leaves the site.

## 4. Overview — `/dashboard`

**Files:** `src/routes/dashboard.index.tsx` (route and tab switch), `src/components/dashboard/OverviewTab.tsx`.

### Layout (top to bottom)

1. **Header row:**
   - Greeting, by local time: "Good morning, {first name}" (before 12:00), "Good afternoon, …" (before 18:00), otherwise "Good evening, …".
   - Subtitle: "Here's a snapshot of your account activity."
   - Buttons on the right: **View analytics** (outline, BarChart3 icon) → Analytics tab; **New listing** (green, Plus icon) → `/dashboard/upload`.
2. **Two stat cards**, side by side, always two columns:
   - "Active listings" (ListChecks icon): count of land listings with status `active`.
   - "Pending review" (Inbox icon): count with status `pending`.
3. **Plan row** (on desktop, a two-thirds card and a one-third card):
   - **Current plan card:**
     - Eyebrow "CURRENT PLAN" with a crown icon, then the plan name (e.g. "Basic") and "{used} of {limit} listings used" (limit can be "Unlimited").
     - A small green area chart on the right: decorative, random data (see gaps).
     - A progress bar showing listing slots used. On unlimited plans it is drawn at a fixed 12%.
     - Below the bar: "{N} slots remaining" or "Unlimited slots", and, unless on Pro, a link "Upgrade to Pro →" that opens Upgrade your plan.
   - **Getting started card:**
     - Title "Getting started", with a counter "{done}/4" and a thin green progress bar.
     - **A four-item checklist.** Each item is a button; a done item gets a green check and strike-through text, an open item an empty circle.
       - "Complete your profile" → Settings tab. Done when phone and county are filled.
       - "Upload your first listing" → upload. Done when the user has any listing.
       - "Add a verification badge" → Billing tab. Never marked done.
       - "Unlock advanced analytics" → opens Upgrade. Done on Pro.
4. **Recent listings card:**
   - Header "Recent listings" with a link "View all →" (goes to My Listings).
   - Up to four land listings, each row showing:
     - a 48×40 thumbnail (or a grey box)
     - the title number
     - "{county} · KES {price}"
     - a status badge
     - with analytics access, from 640 px up: an eye icon and the view count
5. **Billing strip** (dashed border, muted background):
   - CalendarClock icon and "Next billing: {date}", or "—" on the free plan.
   - The date is always today + 30 days, shown like "14 Nov" (see gaps).
   - Link "Manage billing →" (goes to Billing).

### Data

The user object (section 2) and `GET /plans`. Overview makes no other calls.

### States

- **No listings:** the Recent listings card shows an empty state, "No listings yet" / "Upload your first parcel or property to see it here.", with the button "Upload your first listing".
- **Loading:** the page renders nothing until the user is loaded.
- There is no separate error state; the user loads once at sign-in.
- **Plan-dependent:** the "Upgrade to Pro →" link and the view counts (see section 2).

### Mobile

- The header stacks; the two buttons share the width equally.
- The stat cards stay two-up.
- The plan cards stack.
- View counts are hidden in Recent listings.

## 5. My Listings — `/dashboard?tab=listings`

**Files:** `src/components/dashboard/ListingsTab.tsx`, `src/components/dashboard/ListingPreviewDialog.tsx`, `src/components/PhotoViewer.tsx`. The old `?tab=properties` link still lands here.

This one list combines land parcels and rental properties, newest first.

### Layout (top to bottom)

1. **Header:**
   - Title "My Listings".
   - On the right: **Export CSV** (outline, Download icon; shows "Exporting…" while working; only on plans with custom reports) and **New listing** (green, Plus icon).
2. **Filter chips** (group "Filter listings"): "All {n}", "Land {n}", "Rentals {n}". The selected chip is solid green; the others are outlined. All chips are fully rounded, 32 px tall.
3. **Error banner** (red), if rentals fail to load: "Could not load your rentals." with the button "Try again".
4. **The list**, inside a rounded card:
   - **Desktop (768 px and up):** a table that scrolls inside a box up to 70% of the screen height, with a sticky grey header row.
     - **Columns:**
       - **Listing:** a 48×36 thumbnail, the name, and a grey sub-line.
       - **Type:** a chip, "LAND" or "RENTAL".
       - **Status:** a badge.
       - **Views:** right-aligned; analytics plans only.
       - **Date:** created date as YYYY-MM-DD.
       - **Actions:** icon buttons.
     - Clicking a row opens the preview.
   - **Mobile:** one button per listing:
     - Top line: a 64×48 thumbnail, the name, the sub-line, and the status badge.
     - Under it: the type chip, "{n} views ·" (analytics plans only), the date, and a chevron.
     - Tapping opens the preview.
     - There are no action icons on mobile; actions are only in the preview.

**Row content:**

|                         | Land                                         | Rental                                                                                                                                                            |
| ----------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name                    | title number (`parcel_number`)               | `title`                                                                                                                                                           |
| Sub-line                | "{county} · KES {price}"                     | "{reference} · {For rent \| BnB \| For sale} · {Apartment \| House \| Townhouse \| Studio \| Bedsitter \| Commercial \| Office} · {KES price / month \| / night}" |
| Statuses (badge colour) | pending (amber), active (green), sold (grey) | pending (amber), available (green), taken (grey), occupied (amber), closed (grey), suspended (red)                                                                |

**Row action icons** (desktop; each has a tooltip):

- **Status action**, depending on the listing:
  - land with status `active`: "Mark as sold" (Tag icon)
  - rental (not BnB) with status `available`: "Mark as taken" (Tag icon)
  - BnB: the two states it isn't in, from "Mark as available" (CalendarCheck), "Mark as occupied" (BedDouble) and "Mark as closed" (DoorClosed)
- **Edit** (Pencil icon): land only; opens `/dashboard/upload?edit={id}`.
- **Delete** (Trash icon, turns red on hover).

### Listing preview dialog

Max width 672 px, scrolls within 90% of the screen height. Contents, top to bottom:

- **Header:** the listing name, the sub-line, then the type chip and status badge.
- **Photos:** a large cover photo (192 px tall, 256 px on desktop), then a row of 80×56 thumbnails. Clicking any photo opens the full-screen photo viewer.
- **Price**, large: e.g. "KES 1,450,000" or "KES 45,000 / month".
- **Fact tiles:** 2 columns, 3 on desktop. Facts with no value are hidden.
  - **Land:** Title, Listing type ("For sale" / "For lease"), Land type, Size, Acres, Listed, Views (analytics plans only).
  - **Rental:** Reference, Listing type, Property type, Bedrooms, Bathrooms, Furnished (Yes/No), Minimum nights, Cleaning fee, Posting fee ("KES 1,000 · Pending" or "· Paid"), Listed, Views.
- **Sections** (each is shown only when it has content):
  - "Description".
  - "Utilities" (land) or "Amenities" (rental), shown as outline badges.
  - "Location": County, Area, Coordinates (5 decimals); for land also Boundary ("Traced" / "Approximate").
  - "Contact": for land, Phone; for rentals, Posted by, Name, Phone, Agency.
- **Footer:** "Delete" (red, on the left), "Close", "Edit" (land only), and the status action as a green button, e.g. "Mark as sold".
- **Loading:** a spinner with "Loading details…".
- **Error:** "Could not load this listing." with the button "Try again".
- **Endpoints:** `GET /user/listings/{id}` (land), `GET /user/properties/{id}` (rental).

### Confirm dialogs

**Delete:**

- Title "Delete this listing?" (land) or "Delete this property?" (rental).
- Text: "This can't be undone. The listing and its photos will be removed."
- Buttons: "Cancel" and "Delete" (shows "Deleting…").
- If deleting fails, the dialog stays open.

**Status change:**

- Title "Mark this listing as {sold | taken | available | occupied | closed}?"
- Text, by target status:
  - sold / taken: "It will be removed from the marketplace and buyers can no longer see it. This can't be undone."
  - available: "It will show on the map as open for bookings."
  - occupied: "It stays on the map with an Occupied badge so guests know it's booked."
  - closed: "It will be hidden from the map until you mark it available again."
- Buttons: "Cancel" and the action label (shows "Marking…").

### Data and endpoints

| Purpose          | Endpoint                                                      | Fields                                                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Land rows        | user object, `GET /user/listings`                             | see section 2                                                                                                                                                                                                    |
| Rental rows      | `GET /user/properties`                                        | `id`, `reference_number`, `title`, `county`, `area`, `intent` (rent/bnb/sale), `type`, `price`, `price_period` (month/night/total), `status`, `posting_payment_status`, `views`, `created_at`, `cover_photo_url` |
| Export CSV       | `GET /user/listings/export`                                   | downloads `listings_YYYY-MM-DD.csv`                                                                                                                                                                              |
| Delete           | `DELETE /user/listings/{id}` / `DELETE /user/properties/{id}` |                                                                                                                                                                                                                  |
| Mark sold        | `PATCH /user/listings/{id}/sold`                              | server error: "Only a published listing can be marked as sold."                                                                                                                                                  |
| Mark taken       | `PATCH /user/properties/{id}/taken`                           |                                                                                                                                                                                                                  |
| BnB availability | `PATCH /user/properties/{id}/availability {status}`           |                                                                                                                                                                                                                  |

### States

- **Loading** (nothing to show yet): a large spinner with "Loading listings…".
- **No listings:** "No listings yet" / "Post a land parcel, rental, BnB or home for sale and it'll appear here for review.", with the button "New listing".
- **Filter matches nothing:** "Nothing here under this filter."
- **Rentals failed to load:** the red banner above. Land listings still show.
- **Plan-dependent:** the Export CSV button and the Views column.

## 6. Upload — `/dashboard/upload`

**Files:**

- `src/routes/dashboard.upload.tsx`: the chooser and the land wizard.
- `src/routes/dashboard.properties.tsx`: the rental wizard, at `/dashboard/properties`.
- `src/components/LandBoundaryMap.tsx`: the plotting map (lazy-loaded through `src/components/map/LazyMaps.tsx`).
- `src/components/MapSearchBar.tsx`, `src/lib/plotting.ts`, `src/lib/mapGeo.ts`.

### 6.1 Chooser (`/dashboard/upload`, no parameters)

- Title "What are you posting?"; subtitle "Both go live once our team approves them."
- **Two large cards**, side by side from 640 px:
  - **Land parcel** (map icon): "A plot or acreage with a mapped boundary and title documents." Link text "Upload land →" goes to `/dashboard/upload?type=land`.
  - **Rental, BnB or home for sale** (building icon): "An apartment, house or short stay pinned to a single location." Link text "Post a property →" goes to `/dashboard/properties`.

### 6.2 Land wizard (`?type=land`, or `?edit={id}` to edit)

**Header:**

- Link "← Back to dashboard".
- Title "Upload Land", or "Edit Listing" when editing.
- Subtitle "List a parcel in 4 quick steps.", or when editing "Changes go back under review before they're visible again."

**Step indicator:** four numbered circles joined by lines, labelled:

1. Basic Details
2. Location on Map
3. Photos & Documents
4. Review & Submit

- **Done step:** solid green circle.
- **Current step:** green outline.
- **Upcoming step:** grey outline.
- The labels are hidden below 640 px.

**Draft notice:** shown when a saved draft is restored (new listings only): "Restored your unsaved draft from earlier, including your photos. Documents aren't saved in drafts — you'll need to re-attach those.", with "Dismiss". All fields and photos autosave as you go; documents are not saved.

**Footer** (inside the card):

- **Left:** "← Back" (disabled on step 1). On step 2 it reads "← Basic details".
- **Right:** "Next →"; on step 2 it reads "Photos & documents →".
- **On step 4 the right button becomes:**
  - "Publish Listing" (shows "Submitting…" with a spinner)
  - when editing: "Save changes" (shows "Saving…")

#### Step 1 — Basic Details

A two-column form (one column on mobile). "Next" stays disabled until title number, county, a size greater than 0, and price are filled. No inline error messages are shown.

| Field                            | Control                                           | Placeholder / options                                                                                                       | Rules                                                                             |
| -------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Title number (full width)        | text                                              | "e.g. KAJ/KTG/4521"                                                                                                         | required; server: unique ("This title number is already listed."), max 100        |
| County                           | select                                            | "Select county", then the 47 counties                                                                                       | required                                                                          |
| Sub-county / Area                | text                                              | "e.g. Kitengela"                                                                                                            | optional, max 100                                                                 |
| Land size (full width)           | unit select + number(s)                           | units "Acres", "Hectares", "Feet (W x L)"; placeholders "e.g. 1.5" (acres), "e.g. 0.5" (hectares), or "Width" × "Length" ft | must be greater than 0; for hectares and feet, a helper line shows "≈ 1.24 acres" |
| Asking price (Ksh)               | text, numeric keyboard, auto thousands separators | "e.g. 1,850,000"                                                                                                            | required; server max 100,000,000,000                                              |
| Contact phone                    | tel                                               | "+254 7XX XXX XXX"                                                                                                          | optional, max 20                                                                  |
| Listing type                     | select                                            | "For Sale", "For Lease"                                                                                                     | default For Sale                                                                  |
| Land type                        | select                                            | "Residential", "Commercial", "Agricultural", "Mixed Use", "Industrial"                                                      | default Residential                                                               |
| Utilities available (full width) | toggle chips                                      | "Water", "Electricity", "Fibre", "Sewer", "3-Phase"                                                                         | selected chip = solid navy                                                        |
| Description (full width)         | textarea, 4 rows                                  | "Describe the parcel — access, nearby developments, why it's a good investment…"                                            | max 5,000                                                                         |

#### Step 2 — Location on Map

**Desktop** (768 px and up):

- **Heading** "Where is your land?" and the text "Drop a pin, or trace your boundary so buyers can see exactly what they are getting."
- **Two columns:** the map (560 px tall, 640 px from 1280 px) and a side column.
- **Under the map**, once a valid boundary is traced: a link "Use ≈ {X} acres as the land size", which copies the traced area into step 1.
- **Side column:**
  - Card with an eyebrow "FROM STEP 1", the title number (or "Your listing"), the facts County / Size / Listing, and a link "Edit basic details".
  - Card "Pin or trace?":
    - **Drop a pin**: "if you don't know the exact shape. Buyers see an approximate area."
    - **Trace the boundary**: "by tapping each corner. Traced plots show as outlines and are ready for verification."
  - Ghost button "? How it works", which opens the tutorial.

**Mobile:** the step becomes a full-screen map.

- **Top bar:** "← Back", the title "Pin or trace your land", and a round "?" button ("How it works").
- **Bottom panel:**
  - a status line
  - the warnings below
  - a green button "Confirm location" (disabled until there is a pin or boundary)

**The plotting map** (`LandBoundaryMap`):

- **Base map:** satellite by default; the "Map style" toggle switches between satellite and street.
- **Search box:** placeholder "Search a place in Kenya"; results list "Places"; no results: "No places found in Kenya". A "Near me" button sits next to it.
- **Tap to drop a pin.** When geolocation is used: "Pin dropped at your location".
- **Buttons:**
  - Before tracing: "Trace boundary".
  - While tracing: "Undo point" (from 2 corners), "Cancel", "Confirm plot" (from 3 corners).
  - After tracing: "Retrace boundary", "Delete".
- **Status line** (exact text):
  - nothing placed: "Tap the map to drop a pin, or trace your boundary."
  - pin set: "Pin set · -1.47314, 36.95978"
  - boundary traced: "Boundary traced · 5 points · ≈ 0.48 acres"
  - while tracing: "Tap points around your land…", then "3 points placed · tap the first corner to close"
  - after a boundary exists, tapping the map says: 'Tap "Retrace boundary" to change the shape'
  - after Delete: "Boundary deleted. Your pin is still set."
- **The traced shape** shows corner beacons and a "≈ X acres" label in its middle.
- **Warnings:**
  - **Lines crossing while tracing:** "Lines are crossing. Undo the last point." "Confirm plot" is disabled.
  - **Saved boundary crosses itself:** "This boundary crosses itself. Tap "Retrace boundary" to redraw it." Pressing Next shakes this note instead of moving on.
  - **Overlap with land already listed,** checked about 0.6 s after the pin or boundary changes:
    - desktop text: "Part of this location is already listed. If it's your land, carry on: we'll compare the title deeds before either listing goes live."
    - mobile text: "Part of this location is already listed. We'll compare title deeds before it goes live."
    - The endpoint is `POST /user/listings/overlap-check {boundary | latitude, longitude, except_id}` → `{overlaps}`.
  - **Size mismatch** (traced area more than 40% away from the typed size): "Your traced shape is about {X} acres, but you entered {size} in step 1. Check your corners, or update the size in Basic details. Buyers see the size you entered."
- **"How it works" tutorial** (a modal with an illustration per step; buttons "Next", then "Start plotting" on the last step; "Close"):
  1. **Find your land:** "Search for a place or tap "Near me", then zoom in until you can see fences, roads and roofs on the satellite view."
  2. **Pin it, or trace it:** "Tap once to drop a pin. If you know the shape, choose "Trace boundary" instead. Buyers trust traced plots more."
  3. **Tap each corner:** "Go around your land in order. "Undo point" removes the last corner. Tap the first corner again to close the shape."
  4. **Confirm your plot:** "You need at least 3 corners. We place the pin in the middle for you and show the approximate size."

**To continue:** there must be a pin or a boundary, and the boundary must not cross itself. The server only accepts boundary corners inside Kenya (latitude −4.9 to 5.5, longitude 33.5 to 41.9) and rejects a crossing boundary with "The traced boundary crosses itself."

#### Step 3 — Photos & Documents

**Photos:**

- Counter line "Photos ({n}/{limit} allowed on {Plan})". At the limit, a link "Upgrade to upload more" opens Upgrade.
- **Dashed drop zone:** "Drag and drop photos, or click to browse". It turns green while a file is dragged over it and is disabled at the limit.
- **Thumbnail grid**, 3 columns (4 on desktop), each 80 px tall with a "×" remove button.
  - When editing, existing photos also show a star button: "Set as cover" (filled green when it is the cover photo).
- **Error box** (red), for example:
  - "{names} isn't an image file." / "{names} aren't image files."
  - "{names} is over the 5MB limit per photo."
  - Extra photos beyond the plan limit are dropped silently.
- **Size line:** "Total upload size: 4.2 MB".

**Documents:**

- Counter line "Documents ({n}/{limit} allowed on {Plan})". The National ID doesn't count. At the limit, a link "Upgrade to add more".
- **Field label:** "Documents — National ID and Title Deed required".
- **Control:** a type select — "National ID", "Title Deed", "Mutation Form", "Lease Agreement", "Certificate of Occupancy", "Survey Map", "Other" — plus a file input. PDF or image files only.
- **Errors:** "{name} must be a PDF or image file.", "{name} is over the 10MB limit per document."
- **Until both National ID and Title Deed are attached** (new listings only), an amber note: "A National ID and a Title Deed are required to continue." "Next" stays disabled.
- **Attached list:** "Title Deed: deed.pdf" with a "×" remove button.

**Server rules:**

- Photos: jpg, jpeg, png, gif, webp, heic, heif; max 5 MB each.
- Documents: pdf, jpg, jpeg, png; max 10 MB each.
- Missing documents: "Please attach a National ID and a title deed to submit this listing."
- Over the photo limit: "Your plan allows up to {N} photos per listing. Upgrade to add more."
- Over the document limit: "Your plan allows up to {N} documents per listing. Upgrade to add more."

#### Step 4 — Review & Submit

**Summary rows** (label on the left in small caps, value on the right):

| Row           | Value                                                   |
| ------------- | ------------------------------------------------------- |
| Title number  | as entered                                              |
| County        | "{county} · {area}"                                     |
| Size          | as entered                                              |
| Price         | "Ksh 1,850,000"                                         |
| Contact phone | as entered                                              |
| Listing type  | "For Sale" / "For Lease"                                |
| Land type     | as chosen                                               |
| Location      | "Traced (N points)", "-1.47314, 36.95978", or "Not set" |
| Photos        | "N attached"                                            |
| Documents     | "N attached" or "None"                                  |

**Plan box:** "PLAN", then "{Plan} — {used}/{limit or ∞} listings used".

**While uploading:**

- A green progress bar with "Uploading… 42%", then "Upload complete — finishing up…".
- A red "Cancel" link stops the upload.

**Errors:** the server's message in a red box. If it sends none: "Failed to submit listing. Please try again." Possible messages include:

- "You've reached your plan's limit of {N} listings. Upgrade to add more."
- "Posting has been disabled on your account pending review. Contact support if you believe this is a mistake."

**At the listing limit** (new listings only), an amber box:

- Heading "Listing limit reached" with a lock icon.
- Text: "You've used all {N} listings on the {Plan} plan. Upgrade to publish this listing."
- A button "View plans".
- Pressing Publish opens Upgrade instead of submitting.

**Endpoints:**

- New listing: `POST /user/listings`, multipart, with upload progress.
- Edit: `POST /user/listings/{id}` with `_method=PATCH`.
- Loading a listing to edit: `GET /user/listings/{id}`.
- **Fields sent:**
  - details: `title`, `parcel_number`, `seller_phone`, `county`, `area`, `size`, `area_acres`, `price`, `description`
  - location: `latitude`, `longitude`, `boundary[i][lat|lng]`, `boundary_source` (traced/approximate)
  - type: `listing_type`, `land_type`, `utilities[]`
  - files: `documents[i][type|file]`, `photos[]`
  - edit only: `remove_photo_ids[]`, `cover_photo_id`

**Success screen** (replaces the card):

- Green check, then the title and text:
  - new listing: "Listing submitted" / "Your listing is under review and will appear on the map within 24 hours."
  - edit: "Changes saved" / "Your changes have been saved and the listing is back under review."
- If the land overlaps another listing, an amber note: "This location overlaps another listing, so our team will compare the title deeds before it goes live. This can take a little longer."
- Buttons: "Go to dashboard", and for new listings "Upload another".

**Edit mode states:**

- **Loading:** a green spinner.
- **Load error:** red box, "Couldn't load this listing. Please try again."

### 6.3 Rental, BnB or home wizard — `/dashboard/properties`

- **Header:** title "Post a property"; subtitle "Rentals, BnBs and homes for sale. Listings go live once approved."
- **Steps** are shown as pills: "1. Property Details", "2. Location", "3. Photos", "4. Review & Submit". The current step is solid green, done steps light green, upcoming steps grey.
- **Draft notice:** "Restored your unsaved draft from earlier, including your photos." with "Dismiss".
- **Errors** show in a red box at the top. The first server validation message is used, or "Could not post the listing. Please try again."
- **Footer:** "← Back", then "Next →", or "Submit listing" on the last step (shows "Submitting…").

**Step 1 — Property Details.** "Next" needs title, county, type and a price greater than 0.

| Field                                                                                               | Control                 | Placeholder / options                                                                     |
| --------------------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------- |
| Listing title (full width)                                                                          | text                    | "Kilimani 2BR Apartment"                                                                  |
| Listing type                                                                                        | select                  | "For rent", "BnB", "For sale"                                                             |
| Property type                                                                                       | select                  | "Apartment", "House", "Townhouse", "Studio", "Bedsitter", "Commercial", "Office"          |
| "Monthly rent (KES)" / "Nightly rate (KES)" / "Asking price (KES)" (label follows the listing type) | numeric with separators | "e.g. 45,000"                                                                             |
| County                                                                                              | select                  | "Select a county" + 47 counties                                                           |
| Area / estate                                                                                       | text                    | "Kilimani"                                                                                |
| Bedrooms / Bathrooms                                                                                | number, min 0           | "e.g. 2" / "e.g. 1"                                                                       |
| Minimum nights (BnB only)                                                                           | number, min 1           | "e.g. 2"                                                                                  |
| Cleaning fee (KES) (BnB only)                                                                       | numeric                 | "e.g. 2,000"                                                                              |
| Description (full width)                                                                            | textarea                | "Describe the property — layout, condition, nearby amenities…"                            |
| Amenities                                                                                           | pill toggles            | Water, Electricity, Parking, Borehole, Lift, Security, Wi-Fi, Balcony, Gym, Swimming pool |
| Furnished                                                                                           | checkbox                | —                                                                                         |
| Posted by                                                                                           | select                  | "Owner", "Broker / agent"                                                                 |
| Contact phone                                                                                       | text                    | "+254 7XX XXX XXX" (server max 20)                                                        |
| Agent name, Agency (broker only)                                                                    | text                    | "e.g. Jane Wanjiru", "e.g. Prime Realty Kenya"                                            |

**Step 2 — Location:** the plotting map in pin-only mode, without the tutorial. Hint: "Tap the map to drop a pin on the property. Search for the estate or switch to satellite to find it." A pin is required.

**Step 3 — Photos:**

- A dashed box "+ Add photos" (multiple images).
- Chosen files are listed by file name (no thumbnails), each with a trash button.
- Note: "The first photo becomes the cover. Your plan sets how many you can upload."

**Step 4 — Review:** tiles for Title, Listing type, Property type, Price, County, Area, Bedrooms, Bathrooms, Location and Photos.

**Endpoints:** `POST /user/properties`. The response says whether a posting fee is due (`posting_payment_status`, `posting_fee_amount`).

**Success screen:**

- Title "Listing submitted".
- Text: "Our team will review it shortly. You'll see it on the public map once it's approved."
- If a fee is due, the text is instead "Pay the posting fee to send it for review." with "Posting fee due: KES {amount}", and the M-Pesa modal opens automatically (see below).
- Button "Go to my listings".

**Posting-fee modal** (`StkCheckoutModal`):

- Title "Property posting fee" with "KES {amount}".
- Field "M-Pesa phone number" (placeholder "07XX XXX XXX"), and a button "Send payment request" that stays disabled until at least 9 characters are entered.
- **Waiting:** "Check your phone", "Enter your M-Pesa PIN to complete the payment. This screen updates on its own.", and a "Cancel payment" button.
- **Paid:** "Payment received" with "Done".
- **Failed:** the error, with a "Try again" button. Errors:
  - "The payment was not completed."
  - "Timed out waiting for the payment. Check your M-Pesa messages before retrying." (after 2 minutes)
  - "Could not start the payment. Please try again."
- **Endpoints:** `POST /user/properties/posting-fee {property_id, phone}`, then poll `GET /user/invoices/{id}/status` every 3 s.

### Mobile

- **Land wizard:**
  - step labels are hidden
  - forms go to one column
  - step 2 becomes the full-screen map described above
  - document type and file inputs stack
- **Rental wizard:** forms go to one column.

## 7. Analytics — `/dashboard?tab=analytics`

**Files:** `AnalyticsTab` in `src/routes/dashboard.index.tsx`, and `src/components/map/GeoMiniMap.tsx` (via `LazyMaps`).

Analytics covers **land listings only**; rentals are not included.

### Layout (top to bottom)

1. **Header:**
   - Title "Analytics"; subtitle "Track performance, understand your audience, and grow your property business."
   - **Controls on the right:**
     - "Updating…" (small grey text while loading).
     - Listing select: "All Properties", then each listing by title number.
     - Date range button (calendar icon) labelled "Last 7 days", "Last 30 days", "Last 90 days", or a custom range like "1 Oct – 14 Oct 2026". It opens a popover with quick buttons "7 days", "30 days", "90 days" and a one-month range calendar (future dates disabled).
     - "Export" (Download icon) downloads the daily series as `geopin-analytics-{range}.csv`, with the columns Date, Views, Saves, Inquiries.
     - "Print / PDF" (Printer icon) opens the browser print dialog. The header row is hidden when printing.
2. **KPI tiles** (four per row on desktop, two from 640 px, one on phones):

   | Tile       | Icon     | Value                          | Trend line colour |
   | ---------- | -------- | ------------------------------ | ----------------- |
   | Views      | Eye      | total views                    | navy #0F172A      |
   | Saves      | Bookmark | total saves                    | green #15803D     |
   | Inquiries  | Inbox    | total inquiries                | teal #0D9488      |
   | Conversion | Target   | inquiries ÷ views, e.g. "2.4%" | amber #D97706     |
   - Each tile has a round coloured icon, the label, a large value, a trend line ("+12%" in green with an up arrow, or "-5%" in red with a down arrow) followed by "vs previous 30 days" (or 7 / 90 days, or "the previous period" for custom ranges), and a 64×28 sparkline on the right.
   - The change compares the second half of the range against the first half.

3. **Engagement trend** (two-thirds wide) and **Conversion funnel** (one-third).
4. **Peak activity**, **Price positioning**, **Devices** (three equal cards).
5. **Top performing listings** (half width), **Traffic sources**, **Geographic interest** (a quarter each).
6. **Recent activity** (full width; two columns of events from 640 px).
7. **Summary stats:** four small tiles.

### Charts

| Card                    | Subtitle                                  | What it plots                                                                                                                                                                                                                                                  | How it's drawn                                                         | Empty text                                                                                       |
| ----------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Engagement trend        | "Views, saves and inquiries over time"    | One point per day across the range (x axis "MM-DD"). Views: navy line with a fading fill. Saves: green line. Inquiries: teal line. Legend underneath: Views, Saves, Inquiries                                                                                  | Recharts area chart, 288 px tall, horizontal grid lines, hover tooltip | —                                                                                                |
| Conversion funnel       | "Views → saves → inquiries"               | Three stacked trapezoid bars: "Property views", "Saves", "Inquiries". Each bar shows the count inside and the stage name plus "% of views" beside it                                                                                                           | CSS clip-path trapezoids in navy, green and teal                       | —                                                                                                |
| Peak activity           | "Views by day of the week"                | Seven bars, Mon–Sun. The busiest day is green, the rest grey; under the chart: "Most views happen on {Tuesday}s."                                                                                                                                              | CSS bars                                                               | "No activity yet."                                                                               |
| Price positioning       | "Your top listings vs the county average" | For each of your top five listings: the title number, "+18%" or "-7%" against the county average asking price, and "KES {price} vs county avg KES {avg}"                                                                                                       | Text list with up/down arrows                                          | "Not enough market data yet."                                                                    |
| Devices                 | "How viewers browse your listings"        | Mobile, Tablet, Desktop with an icon, a percentage and a green bar                                                                                                                                                                                             | CSS bars                                                               | "No activity yet."                                                                               |
| Top performing listings | "By total views"                          | Table of the top five by views. Columns: "#", "Property" (thumbnail, title number, "KES price"), "Location" (county), "Views", "Saves", "Inquiries", "Conv." (%). Link "View all →" goes to My Listings                                                        | HTML table, scrolls sideways on small screens                          | "No listings yet."                                                                               |
| Traffic sources         | "Where viewers came from"                 | Percentage share of "Direct map", "Search", "Social", "Referral"                                                                                                                                                                                               | Ranked bars                                                            | Globe icon, "No traffic data yet.", "Sources appear once viewers open your listings on the map." |
| Geographic interest     | "Views by county"                         | A small map with listing points (top county highlighted), then a ranked list of counties by share of views. Notes: "{62}% of your views are from {Nairobi}, followed by {Kiambu}." and, in green, "Your top listing is in the top {N}% for views in {county}." | Leaflet mini-map plus ranked bars                                      | "No data yet."                                                                                   |
| Recent activity         | "Latest events on your listings"          | Events such as '"KAJ/KTG/4521" is under review', '"…" is live · 120 views' or '"…" — sold', each with the raw date                                                                                                                                             | List                                                                   | "No activity yet."                                                                               |

**Summary stat tiles:**

- "TOTAL LISTINGS": count, with "{n} active" underneath.
- "AVG VIEWS / LISTING": with "Per published listing".
- "INQUIRY RATE": with "Views → inquiries".
- "AVG. DAYS ON MARKET": a number with "Listing to sale", or "—" with "No sales yet".

### Data — `GET /user/analytics`

**Query:** `range=7d|30d|90d` or `from=YYYY-MM-DD&to=YYYY-MM-DD`, plus an optional `parcel_id`.

**Response fields:**

- **Totals:** `total_views`, `total_saves`, `total_inquiries`.
- **Lists:**
  - `top_listings[{id, name, views, saves, inquiries}]`
  - `listing_points[{title, county, latitude, longitude, views}]`
  - `county_breakdown[{county, views}]`
  - `recent_activity[{title, status, views, created_at}]`
- **Daily series:** `daily_views[{date, views}]`, `daily_saves[{date, saves}]`, `daily_inquiries[{date, inquiries}]`.
- **Breakdowns:** `traffic_sources[{name, value (%), color}]`, `device_breakdown[{name, value (%)}]`, `peak_activity[{day, views}]`, `county_avg_prices[{county, avg_price}]`.
- **Single values:** `avg_days_on_market` (number or null), `county_percentile` ({county, percentile} or null).

Plans without analytics get `403` "Upgrade your plan to access analytics."; the UI never makes that call for them.

### States

- **First load:** a skeleton made of four tile blocks and three rows of card blocks.
- **Changing filters:** the old data stays on screen while "Updating…" shows.
- **Per-card empty texts:** in the chart table above.
- **Request failure:** fails silently. The cards fall back to data built from the user's listings (view totals and counties) or show their empty texts.
- **Locked (plans without analytics):**
  - The whole content area is blurred and can't be clicked.
  - On top, a centred card: lock icon, "Pro only", "Advanced analytics are available on the Pro plan.", and a green button "Upgrade to Pro ↗" that opens Upgrade your plan.
  - The header controls stay visible and usable, but no data is fetched.

### Mobile

- KPI tiles stack to one column (two from 640 px).
- All chart cards stack.
- The top-listings table scrolls sideways.
- The header controls wrap onto more lines.

## 8. Billing & Plan — `/dashboard?tab=billing`

**Files:** `BillingTab` in `src/routes/dashboard.index.tsx`, `src/components/CheckoutModal.tsx`, `src/components/BoostModal.tsx`, `src/lib/plans.ts`.

Opening this tab reloads the user (profile, listings, subscription and invoices).

### Layout (top to bottom)

1. **Title** "Billing & Plan"; subtitle "Manage your subscription, payment method and invoices."
2. **Current plan banner:** one card split into three panels (stacked on mobile).
   - **Panel 1 — CURRENT PLAN** (crown icon):
     - the plan name, large
     - "/ Free forever", "/ month" or "/ year"
     - the amount, e.g. "Ksh 4,500" or "Ksh 40,500" (yearly), or "Ksh 0"
     - a status dot:
       - green "Active" (free, or a paid plan with status `active`)
       - amber "Cancels on {14 Nov 2026}" (cancelled but not yet ended)
       - red, showing the raw status or "Inactive"
   - **Panel 2 — LISTINGS USAGE:**
     - "{used} of {limit}", e.g. "4 of 10", or "of Unlimited"
     - a green progress bar (hidden when unlimited)
     - "{N} listing slots remaining", or "Unlimited listings on Pro"
   - **Panel 3:**
     - **Free plan:** "UPGRADE FOR MORE", then "—" and "You are on the free tier".
     - **Paid plan:** "NEXT BILLING", then "Ksh {amount}" and "Renews on {date}".
     - **Cancelled plan:** "SUBSCRIPTION ENDS", then "Ksh {amount}" and "Cancelled — access until {date}".
     - **Buttons:**
       - "Upgrade" (green, sparkles icon): when not on Pro; opens checkout for Pro
       - "Renew" (green outline, refresh icon; reads "Resume" when cancelled): paid plans; reopens checkout for the current plan and cycle
       - "Cancel plan" (grey outline): paid plans that aren't already cancelled
3. **Account manager card** (Enterprise only): "YOUR DEDICATED ACCOUNT MANAGER", then the manager's name and email.
4. **Choose a plan** — "Switch anytime. Changes apply on your next billing cycle."
   - **One card per active plan** (three columns on desktop, so four plans wrap onto two rows):
     - the badge on the top edge (e.g. "MOST POPULAR")
     - the plan name in small caps
     - "Ksh {monthly} / mo", and "or Ksh {yearly} / yr" when there is a yearly price
     - up to five features with green checks
   - **Card button:**
     - current plan: "Current plan" (disabled; the card gets a green border)
     - Free: "Downgrade" (opens the cancel dialog)
     - any other plan: "Switch to {Plan}" (navy for Pro, green for the others)
5. **Two cards side by side** (two-thirds / one-third):
   - **One-time boosts** (lightning icon), "Get more visibility for individual listings." Two add-ons, each with a name, "Active for {period}", a price and a "Buy" link:
     - "Boost Listing to Top": Ksh 300, 7 days
     - "Featured Badge": Ksh 500, 30 days
     - These prices are fixed in the frontend (`src/lib/plans.ts`), not loaded from the API.
   - **How you pay** (card icon):
     - A dashed box: "Pay with M-Pesa (approve the charge on your phone) or by card at checkout." No saved payment method is shown or stored.
     - A strip "Total paid" with "Ksh {sum of paid invoices}".
6. **Invoice history** (receipt icon), with "{n} invoice(s)" on the right.
   - **Desktop:** a table with the columns "Invoice" (monospace number), "Date", "Plan", "Amount" ("Ksh …"), "Status", and a "PDF" download link (opens the signed invoice URL in a new tab).
   - **Mobile:** stacked rows showing the number, "{plan} · {date}", the amount, the status badge, and a download icon.
   - **Status badges:** Paid (green), Pending (amber), Failed and Refunded (red).

### Payment methods

**M-Pesa:**

- An STK push to the phone; the user approves with their PIN.
- Phone must match a Kenyan mobile number (`07…`, `01…`, `2547…`, `+2547…`; 9 digits after the prefix).
- Server messages:
  - "Payment request sent. Enter your M-Pesa PIN on your phone to complete."
  - "A payment is already in progress. Complete it on your phone or wait a moment before trying again."
  - "Could not start the payment. Please try again shortly."
  - "This plan is free and does not require payment."

**Card (Paystack):**

- Redirects to Paystack, which returns to `/dashboard?tab=billing&payment=paystack&reference=…`.
- The page then checks `GET /user/payments/paystack/{reference}/verify` every 3 s for up to 60 s and shows a toast:
  - "Payment received" — "Your plan is now active."
  - "Payment failed" — "The card payment was not completed."
  - "Still processing" — "This can take a moment — your plan updates automatically once confirmed."

### Modals on this tab

- **Checkout:** see section 3.4.
- **Boost / featured** (`BoostModal`):
  - **Form:**
    - Title = the add-on name; text "Active for {period}. Pay with M-Pesa to activate." (or "… with card …").
    - Method toggle M-Pesa / Card.
    - Select "Choose a listing", listing the user's land listings that aren't sold, by title.
    - "M-Pesa phone number" (M-Pesa only).
    - Button "Pay Ksh {price}".
  - **No eligible listing:** "You need an active listing before you can boost one." The pay button is disabled.
  - **Success:** "Payment received", "Your listing is now boosted to the top for 7 days." (or "featured for 30 days").
  - **Other states:** waiting, pending and failed, as in Checkout, with the pending text "M-Pesa is taking longer than usual. You don't need to pay again — if it went through, your listing is updated automatically."
  - **Endpoints:** M-Pesa `POST /user/listings/boost {listing_id, boost_type: boost|featured, phone}`; card `POST /user/listings/boost/card {listing_id, boost_type}`.
- **Cancel your subscription?:**
  - Text: "Your {Plan} plan stays active until {date or "the end of your billing period"}. It won't renew after that, and you'll move to the Free plan. You can resume anytime before then."
  - Buttons: "Keep plan", and a red "Cancel subscription" (shows "Cancelling…").
  - Endpoint: `POST /user/subscription/cancel`, then the user reloads.

### States

- **Plans not loaded yet:** the tab shows only "Loading plan details…".
- **No invoices:** a receipt icon, "No invoices yet", "Your payment receipts will appear here."
- **Plan-dependent:**
  - Free: no Renew or Cancel buttons; "You are on the free tier"; no next billing amount.
  - Not on Pro: an "Upgrade" button.
  - Enterprise: the account manager card.

## 9. KYC Status — `/dashboard?tab=kyc`

**Files:** `KycTab` and `KycCard` in `src/routes/dashboard.index.tsx`, and `src/components/LandBoundaryMap.tsx` (for location fixes).

KYC here means verification of a **land parcel**: the owner submits documents for one of their parcels, and the team reviews them.

### Layout (top to bottom)

1. **Header:**
   - Title "KYC Status"; subtitle "Track your land parcel verification applications."
   - Green button "+ Submit KYC" on the right, which opens the submit modal.
2. **Summary strip:** four small cards (two per row on mobile).
   - "Total"
   - "Needs action" (amber number when above 0)
   - "Approved" (green when above 0)
   - "Pending" (pending and under review together)
3. **"Needs your attention"** (warning icon, with an amber count): cards waiting for the user. These are info requests not yet answered, and location corrections not yet sent.
4. **"All applications"**: every other card. This heading only shows when the attention section is also shown.

### Application card

- **Shape:** a rounded card with a 4 px left border in the status colour. The whole header area is clickable and expands or collapses the card (chevron on the right).
- **Header:**
  - The parcel title, or "Land Parcel" if there is none.
  - Tags beside the title:
    - "Action required" (amber)
    - "Fix location required" (orange)
    - "✓ Location updated" (green)
    - "✓ Reply sent" (green)
    - "✓ Acknowledged" (green)
  - Second line: the title number (monospace), "Ref: {reference}", and "Submitted {Oct 9, 2026}".
  - On the right, a status pill with an icon (see the table below).
- **Progress tracker:** three numbered dots joined by lines: "Submitted", "In Review", "Decision".
  - Done dots are green with a tick; the current dot uses the status colour; upcoming dots are grey.
- **Opens by itself** when there is an unanswered info request, an unsent location fix, or a reviewer reply.

**Statuses:**

| API status                      | Pill label               | Colours (bg / text / border) | Tracker step |
| ------------------------------- | ------------------------ | ---------------------------- | ------------ |
| `pending`                       | Pending Review (clock)   | #FEF9C3 / #854D0E / #EAB308  | 1 Submitted  |
| `under_review`                  | Under Review (shield)    | #F1F5F9 / #1E293B / #64748B  | 2 In Review  |
| `info_requested`                | Info Requested (message) | #FEF3C7 / #D97706 / #F59E0B  | 2 In Review  |
| `location_correction_requested` | Fix Location (map pin)   | #FFF7ED / #C2410C / #F97316  | 2 In Review  |
| `approved`                      | Approved (check)         | #DCFCE7 / #15803D / #22C55E  | 3 Decision   |
| `rejected`                      | Rejected (warning)       | #FEE2E2 / #DC2626 / #EF4444  | 3 Decision   |

**Expanded content, by status:**

- **Approved:** green box, "Verification approved", "Your land parcel has been verified and your KYC is complete. · {date}".
- **Rejected:** red box, "Application rejected", then the reviewer's reason. Without a reason: "Your application did not meet the verification requirements. · {date}".
- **Pending or under review:** grey box, "Your application is being reviewed", "We'll notify you once a decision is made. No action needed right now."
- **Info requested:**
  - Amber box headed "ADDITIONAL INFORMATION NEEDED", showing the reviewer's message.
  - **Not yet answered:**
    - "Your reply" textarea (4 rows), placeholder "Provide the requested information or explain what you've uploaded…".
    - "Attach file" button; once a file is picked it shows the file name and a "Remove" link.
    - Hint: "JPG, PNG or PDF · max 10 MB".
    - Green "Send reply" (shows "Sending…"), disabled until there is text or a file.
  - **Answered:** green box, "Your reply was sent", with the date, the reply text and a download link to the attached file.
  - **Reviewer then responds:** a second green box, "Message from reviewer", with the date, the message, and "No further action needed from you."
- **Location correction requested:**
  - Orange box headed "LOCATION CORRECTION REQUESTED", with the reviewer's note.
  - **Not yet sent:**
    - The plotting map (256 px tall; tap it once to activate), with the hint "This shows where you originally placed your land. Drop a new pin to correct it, or tap "Trace boundary" / "Retrace boundary" to redraw the shape."
    - An orange "Submit corrected location" button (shows "Submitting…"), disabled without a pin.
  - **Sent:** green, "Updated location submitted — under review." The card's status returns to Pending Review.
- **"SUBMITTED DOCUMENTS"** (any status): one row per file, showing the file name and a tag ("Verified" in green or "Rejected" in red). A "View" link (shows "Loading…") opens the file in a new tab.
- **"REVIEWER NOTES"** (any status, when present): the reviewer's notes.

### Submit KYC application modal (max width 448 px)

- **Title:** "Submit KYC Application", with a close ×.
- **"Land parcel":**
  - while loading: "Loading your parcels…"
  - no parcels: "No land parcels found. Add a listing first."
  - otherwise a select, "Select a parcel…", listing each parcel by title number
- **"Add a document":**
  - A type select: "Title Deed", "Mutation Form", "Lease Agreement", "Certificate of Occupancy", "Survey Map", "Other". It has no "National ID" option (see gaps).
  - A "Choose file" button, with the hint "JPG, PNG or PDF · max 10 MB per document".
  - Added files are listed as "Title Deed: deed.pdf", each with a "Remove" link.
- **Error box** (red): the client message "Please select a parcel and add at least one document." or the server's message, otherwise "Submission failed. Please try again."
- **Footer:** "Cancel" and a green "Submit application" (shows "Submitting…"), disabled until a parcel and at least one document are chosen.

**Required documents and server rules** (`POST /user/kyc`):

- 1 to 6 documents; JPG, PNG or PDF; max 10 MB each.
- Must include a **National ID** and a **Title Deed**. Otherwise: "A National ID and a title deed are required."
- Only one open application per parcel. Otherwise: "An active KYC application already exists for this parcel."
- Document types the server accepts: `national_id`, `title_deed`, `mutation`, `lease_agreement`, `certificate_of_occupancy`, `survey_map`, `other`.

### Data and endpoints

| Purpose               | Endpoint                                                                              | Fields                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| List                  | `GET /user/kyc`                                                                       | `id`, `reference`, `status`, `document_type`, `reviewer_notes`, `rejection_reason`, `info_request_message`, `correction_note`, `user_reply`, `user_replied_at`, `user_reply_document_path`, `user_reply_document_name`, `admin_acknowledgment`, `admin_acknowledged_at`, `submitted_at`, `reviewed_at`, `created_at`, `parcel{id, title, parcel_number, latitude, longitude, boundary, boundary_source}`, `documents[{id, type, original_name, mime_type, size, verification_status}]` |
| Parcels for the modal | `GET /user/listings`                                                                  | `data[{id, title, parcel_number}]`                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Submit                | `POST /user/kyc` (multipart: `parcel_id`, `documents[i][type]`, `documents[i][file]`) |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Reply                 | `POST /user/kyc/{id}/reply` (`reply` up to 3,000 characters, and/or `document`)       | errors: "Provide a text reply or upload a document.", "This application is not awaiting additional information."                                                                                                                                                                                                                                                                                                                                                                       |
| Fix location          | `PATCH /user/kyc/{id}/update-location {latitude, longitude, boundary}`                |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| View a document       | `GET /user/kyc/{id}/documents/{docId}` (file)                                         |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Reply attachment      | `GET /user/kyc/{id}/reply-document`                                                   |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

### States

- **Loading:** a centred spinner.
- **Load error:** an empty state with a shield icon, "Unable to load applications", "Something went wrong. Please refresh the page or try again later."
- **No applications:** an empty state with a shield icon, "No KYC applications yet", "Submit your first application to get started.", and a button "+ Submit KYC application".
- **Failed replies or location fixes:** fail silently. The buttons become usable again so the user can retry.

### Mobile

- The summary strip goes to two columns.
- Cards fill the width.
- The tracker and the reply controls wrap onto more lines.

## 10. Account Settings — `/dashboard?tab=settings`

**Files:** `SettingsTab`, `Field`, `SelectField`, `Toggle` and `ToggleRow` in `src/routes/dashboard.index.tsx`.

### Layout (top to bottom)

1. **Header:**
   - Title "Account Settings"; subtitle "Manage your profile, security and preferences."
   - After any save, a green chip on the right: "✓ Saved at {time}".
2. **Profile card:**
   - A 64 px round avatar with initials on the user's avatar colour.
     - A small camera button, "Change avatar", cycles through six colours: #0D9488, #16A34A, #D97706, #0F172A, #9333EA, #DB2777. Each click saves immediately.
   - Beside the avatar: the full name; then the email, a grey chip with the role (e.g. "individual") and a green chip "{plan} plan".
   - On the right: "Copy user ID" (copies the ID to the clipboard).
3. **Section tabs** (a segmented bar; the active tab is navy with white text):
   - Profile (user icon)
   - Security (shield)
   - Notifications (bell)
   - Preferences (languages)
   - Danger zone (warning)
4. **The selected section's card.**

### Profile — "Profile information"

Subtitle: "Visible to buyers when they view your listings." Two columns of fields; each label is small caps with an icon.

| Field                                                      | Placeholder                               | Saved to server   | Server rule |
| ---------------------------------------------------------- | ----------------------------------------- | ----------------- | ----------- |
| Full name                                                  | —                                         | yes, as `name`    | max 255     |
| Email address                                              | —                                         | **no** (see gaps) | —           |
| Phone                                                      | "+254 7XX XXX XXX"                        | yes               | max 20      |
| Company / Agency                                           | "Optional"                                | yes               | max 255     |
| County                                                     | "e.g. Nairobi"                            | yes               | max 255     |
| Role (select: "Individual", "Agent / Broker", "Developer") | —                                         | **no** (see gaps) | —           |
| Bio (textarea, 3 rows)                                     | "Short bio shown on your public profile." | yes               | max 2,000   |

**Buttons:** "Reset" (restores the saved values) and "Save changes" (green, save icon). Endpoint: `PUT /user/profile`.

### Security

**Change password:**

- Subtitle "Use at least 8 characters with a mix of letters and numbers."
- Three password fields, each with a show/hide eye button: "Current password", "New password", "Confirm password".
- **Client checks:**
  - "Password must be at least 8 characters."
  - "Passwords do not match."
- **Server errors:**
  - "Your current password is incorrect."
  - "Your new password must be different from your current one."
- **Success:** "Password updated. Signing you out on all devices…" After 1.5 s the user is sent to `/login`.
- **Button:** "Update password" (navy; shows "Updating…").
- **Endpoint:** `PUT /user/password {current_password, password, password_confirmation}`.

**Two-factor authentication:**

- Text: "Require a code sent to {email} each time you sign in." A switch sits on the right.
- **Turning it on:**
  - Calls `POST /user/two-factor/enable`, then shows "Enter the 6-digit code we just emailed you to finish turning this on."
  - A 6-digit field (placeholder "000000"), "Confirm" (shows "Confirming…"; disabled until 6 digits) and "Cancel".
  - Confirming calls `POST /user/two-factor/confirm {code}`; success shows "Two-factor authentication is on."
- **Turning it off:**
  - Shows "Enter your password to turn off two-factor authentication.", a password field (placeholder "Your password"), a red "Turn off" button (shows "Turning off…") and "Cancel".
  - Endpoint `DELETE /user/two-factor {password}`; success shows "Two-factor authentication is off."
- Errors show the server's message in red.

**Active sessions:** a fixed sample list.

- "This device" with a green "Current" tag and "Chrome · Nairobi · just now".
- "iPhone" with "Safari · Mombasa · 2 days ago" and a red "Revoke" link.
- This list is not real data and Revoke does nothing (see gaps).

### Notifications — "Notification preferences"

Subtitle: "Choose how you want to hear from us." Four rows, each with a title, a description and a switch:

| Title                 | Description                                            | Field                   |
| --------------------- | ------------------------------------------------------ | ----------------------- |
| Email — New inquiries | Get notified when someone inquires about your listing. | `notif_email_inquiries` |
| SMS alerts            | Important alerts sent to your phone.                   | `notif_sms_alerts`      |
| Weekly digest         | Performance summary every Monday.                      | `notif_weekly_digest`   |
| Marketing emails      | Product news, tips and offers.                         | `notif_marketing`       |

Button "Save preferences" saves through `PUT /user/profile`. Defaults when nothing is saved: inquiries on, SMS on, digest off, marketing off.

### Preferences — "Display & language"

- "Language" select: "English", "Swahili". Saved as `language` (`en` / `sw`). The UI itself is not translated.
- "Default map view" select: "Road", "Satellite". Not saved (see gaps).
- **"Connected accounts":** rows for "Google" and "WhatsApp Business", each with a "Connect" button that does nothing.
- Button "Save preferences". It saves the whole profile form, including language.

### Danger zone

- **Sign out:** "End your session on this device.", with a "Log out" button (calls `POST /auth/logout`, then goes to `/`).
- **Delete account** (red-tinted card with a warning icon):
  - Text: "This permanently removes your account, listings and data. Type DELETE to confirm."
  - A field (placeholder "Type DELETE") and a red "Delete account" button, enabled only when the field says exactly DELETE.
  - Endpoint: `DELETE /user/me`, then goes to `/`.

### States

- Profile and preference saves show only the "Saved at {time}" chip. There is no saving indicator and no error message if the save fails.
- Password and two-factor show their own messages, as listed above.

### Mobile

- The profile header wraps.
- The section tabs wrap onto two lines.
- Fields go to one column.

## 11. Known gaps

These are how the dashboard behaves today. Each one is written up with its location, the fix and how to check it in [DASHBOARD_FIXES.md](./DASHBOARD_FIXES.md), to be fixed when the redesign is built.

### Things that look real but aren't

1. **Overview:**
   - "Next billing" is always today + 30 days, not the plan's real renewal date (which the Billing tab shows correctly).
   - The plan card's small chart is random decorative data.
   - "Add a verification badge" can never be ticked.
2. **Settings:**
   - "Email address" and "Role" can be edited, but neither is sent to the server; both revert after a reload.
   - "Active sessions" is a fixed sample list, and "Revoke" does nothing.
   - "Connected accounts" buttons do nothing.
   - "Default map view" is not saved.
3. **Analytics:** the Conversion tile's change figure is 40% of the Views change, not a real comparison. While data is loading, or when locked, the trend chart shows an estimated views curve.
4. **Upgrade your plan:**
   - Opened from the upload wizard, picking a plan just closes the modal.
   - Picking "Free" from the dashboard changes the plan in the browser only; nothing is sent to the server.

### Broken flows

5. **KYC:** the Submit KYC modal has no "National ID" document type, but the server requires one. Every submission from this modal fails with "A National ID and a title deed are required." (Listing uploads do offer National ID.)

### Inconsistencies

6. **Listings:** only land listings have an Edit action; rentals can only be deleted or have their status changed.
7. **Boosts:** add-ons can only be bought for land listings, not rentals. Their prices (Ksh 300 and Ksh 500) are fixed in the frontend.
8. **Analytics** ignores rentals entirely.
9. **Notifications:** only the KYC info request has a readable title; other types show their raw type name.
10. **Silent failures:** several actions give no message when they fail:
    - CSV export
    - KYC reply
    - KYC location fix
    - viewing a KYC document
    - analytics load
    - profile save
11. **Dark mode:** hard-coded colours don't adapt. This affects:
    - the green and navy buttons
    - the chart colours
    - the KYC status colours
    - the upload wizard's white inputs (`.lv-input`)
12. **Upload layout:** the land wizard uses its own step circles and input styles; the rental wizard uses pill steps and different inputs. The two flows look different.

## 12. Mobile summary

The mobile breakpoint is 768 px (`useIsMobile` and Tailwind `md`). Some grids also change at 640 px (`sm`).

- **Navigation:**
  - The sidebar is replaced by the floating bottom bar: four items plus More.
  - The top navbar collapses into a hamburger menu.
- **Overview:**
  - The header buttons go full width.
  - The plan cards stack.
  - View counts are hidden in Recent listings.
- **My Listings:**
  - The table becomes tappable rows with no action icons.
  - All actions move into the preview dialog.
- **Upload (land):**
  - Step labels are hidden.
  - Step 2 becomes a full-screen map with its own top bar and a "Confirm location" button.
  - Forms go to one column.
- **Analytics:**
  - Everything stacks; KPI tiles are one column (two from 640 px).
  - The top-listings table scrolls sideways.
- **Billing:**
  - The plan banner panels stack.
  - The plan picker goes to one column.
  - Invoices become stacked rows with a download icon.
- **KYC:**
  - The summary goes to two columns.
  - The cards' tracker and reply controls wrap.
- **Settings:**
  - The section tabs wrap.
  - Fields go to one column.
