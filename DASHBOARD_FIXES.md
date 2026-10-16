# Dashboard fix list

The problems found while writing [DASHBOARD_SPEC.md](./DASHBOARD_SPEC.md), written up so they get fixed when the redesigned dashboard is built. Each item says where the code is today, what to change, whether the backend needs work, and how to tell it's done.

Line numbers are from 15 October 2026 (`dev`) and will drift. Search for the quoted code if a line has moved. Paths start at `web-frontend/` unless they begin with `backend/`.

**Priority:**

- **P1:** broken; users hit it today.
- **P2:** shows made-up or wrong information.
- **P3:** missing feature, inconsistency or polish.

| #   | Priority | Area              | Problem                                                          | Backend work? |
| --- | -------- | ----------------- | ---------------------------------------------------------------- | ------------- |
| 1   | P1       | KYC               | Submitting a KYC application always fails                        | No            |
| 2   | P1       | Settings          | Email and Role edits are silently thrown away                    | Yes           |
| 3   | P2       | Overview          | "Next billing" date is invented                                  | No            |
| 4   | P2       | Overview          | Plan card chart is random data                                   | No            |
| 5   | P2       | Overview          | "Add a verification badge" can never be ticked                   | Maybe         |
| 6   | P2       | Settings          | "Active sessions" is fake sample data                            | Yes           |
| 7   | P2       | Analytics         | Conversion change % is made up                                   | No            |
| 8   | P2       | Analytics         | Trend chart shows an invented curve while loading or locked      | No            |
| 9   | P2       | Billing / Upgrade | Choosing "Free" only changes the plan in the browser             | Maybe         |
| 10  | P2       | Upload            | Picking a plan in the upload wizard's Upgrade modal does nothing | No            |
| 11  | P3       | Settings          | "Connect" buttons and "Default map view" do nothing              | Yes / No      |
| 12  | P3       | Listings          | Rentals can't be edited                                          | No            |
| 13  | P3       | Billing           | Boosts only work for land; add-on prices are hard-coded          | Yes           |
| 14  | P3       | Analytics         | Rentals are left out of analytics                                | Yes           |
| 15  | P3       | Header            | Notification titles show raw type names                          | No            |
| 16  | P3       | Several           | Failures with no message to the user                             | No            |
| 17  | P3       | Styling           | Hard-coded colours break dark mode                               | No            |
| 18  | P3       | Upload            | Land and rental wizards look like two different products         | No            |

---

## P1 — broken

### 1. Submitting a KYC application always fails

- **Where:** `src/routes/dashboard.index.tsx:3120` (`const DOC_TYPES = [`), used by the "Submit KYC Application" modal.
- **Problem:** the document type list has no "National ID". The server requires both a National ID and a title deed (`backend/app/Http/Controllers/Api/UserKycController.php`, `store`), so every submission is rejected with "A National ID and a title deed are required."
- **Fix:**
  - Add `{ value: "national_id", label: "National ID" }` to the modal's document types.
  - Show the requirement up front, the way the upload wizard does: a hint "A National ID and a Title Deed are required", and keep "Submit application" disabled until both are attached.
  - Ideally share one `DOC_TYPES` list with `src/routes/dashboard.upload.tsx`, which already has the right one.
- **Done when:** a user can submit with a National ID and a title deed. With either one missing, the button stays disabled and the requirement is shown.

### 2. Email and Role edits are silently thrown away

- **Where:**
  - `src/routes/dashboard.index.tsx:1843` (`saveProfile`) sends `email` and `role`.
  - `src/lib/auth.tsx`, `updateUser`, drops both before calling `PUT /user/profile`.
  - `backend/app/Http/Requests/User/UpdateProfileRequest.php` doesn't accept them either.
- **Problem:** the fields can be edited and "Saved at …" appears, but nothing changes on the server. Both revert on the next reload.
- **Fix (decide first):**
  - **Email:** either make it read-only with a note on how to change it, or build a proper change-email flow. That means a new endpoint that sends a code to the new address and only switches it once confirmed; don't just accept it in the profile update.
  - **Role:** either make it read-only or add `role` to the profile request, limited to `individual`, `agent` and `developer` (never `account_manager`).
- **Done when:** nothing in Settings looks editable unless the change is saved, and a reload shows what was saved.

## P2 — shows made-up or wrong information

### 3. "Next billing" date is invented

- **Where:** `src/components/dashboard/OverviewTab.tsx:303` (`Date.now() + 30 * 86400000`).
- **Fix:** use `user.planEndsAt`, as the Billing tab already does. Show "—" on the free plan. If the plan is cancelled, say "Ends on {date}" instead.
- **Done when:** Overview and Billing show the same date.

### 4. Plan card chart is random data

- **Where:** `src/components/dashboard/OverviewTab.tsx:61` (`Math.random()`).
- **Fix:** either drop the chart, or plot real data: the last 14 days of views from `GET /user/analytics?range=…` (analytics plans only). Don't show a trend to users who have no data behind it.
- **Done when:** the chart is gone or reflects real numbers.

### 5. "Add a verification badge" can never be ticked

- **Where:** `src/components/dashboard/OverviewTab.tsx:82` (`done: false`). Its action opens the Billing tab, which has nothing called a verification badge.
- **Fix:** decide what "verified" means. Probably: at least one approved KYC application, from `GET /user/kyc`. Tick the item when that's true, and point it at the KYC tab instead of Billing. Otherwise remove the item.
- **Done when:** the item can be completed and leads somewhere that completes it.

### 6. "Active sessions" is fake sample data

- **Where:** `src/routes/dashboard.index.tsx:2250` ("This device" / "iPhone"). "Revoke" (line 2267) has no handler.
- **Fix:**
  - Backend: list the user's Sanctum tokens (`personal_access_tokens`), with device and last-used time, and add a revoke endpoint.
  - Frontend: show the real list.
  - Until that exists, hide the card.
- **Done when:** the list shows the user's real sign-ins and Revoke signs that device out.

### 7. Conversion change % is made up

- **Where:** `src/routes/dashboard.index.tsx:609` (`delta={Math.round(delta * 0.4)}`).
- **Fix:** compare the conversion rate (inquiries ÷ views) of the second half of the range against the first half, the same way the other tiles do.
- **Done when:** the figure is calculated from real numbers.

### 8. Trend chart shows an invented curve while loading or locked

- **Where:** `src/routes/dashboard.index.tsx:386–389`, the fallback views estimate built with `Math.sin`.
- **Fix:** while loading, show the skeleton. When locked, either show a clearly fake illustrative preview, or none at all. Never mix invented numbers into charts that look real.
- **Done when:** every number on the Analytics tab comes from the API.

### 9. Choosing "Free" only changes the plan in the browser

- **Where:** `src/routes/dashboard.index.tsx:139` (`setPlan(id)` in `handleSelectPlan`), and `setPlan` in `src/lib/auth.tsx`.
- **Problem:** from the Upgrade modal, "Start free" relabels the user's plan in the browser only. The real plan is unchanged and comes back on reload.
- **Fix:** route a downgrade to Free through the cancel-subscription flow (`POST /user/subscription/cancel`), as the Billing tab's "Downgrade" button already does. Then remove `setPlan`.
- **Done when:** choosing Free anywhere either cancels the subscription for real or isn't offered.

### 10. Picking a plan in the upload wizard's Upgrade modal does nothing

- **Where:** `src/routes/dashboard.upload.tsx:1292` (`onSelect={() => {}}`).
- **Fix:** open the same checkout as on the dashboard (`CheckoutModal`). After payment, reload the user so the new listing and photo limits apply without leaving the wizard.
- **Done when:** a user who hits a limit mid-upload can pay and carry on.

## P3 — missing features, inconsistencies, polish

### 11. "Connect" buttons and "Default map view" do nothing

- **Where:** `src/routes/dashboard.index.tsx:2332` ("Default map view", `onChange={() => {}}`) and `:2346` (Connected accounts).
- **Fix:**
  - **Default map view:** save it (a profile field, or `localStorage` if it's per device) and have the maps read it.
  - **Google:** can link through the existing Google sign-in.
  - **WhatsApp Business:** has no backend at all.
  - Hide whatever isn't built.
- **Done when:** every control in Preferences does something, or isn't there.

### 12. Rentals can't be edited

- **Where:** `src/components/dashboard/ListingsTab.tsx:265`; Edit only shows for land.
- **Fix:** add an edit mode to the rental wizard (`src/routes/dashboard.properties.tsx`). It would load from `GET /user/properties/{id}` and save through `useUpdateProperty()` in `src/lib/properties.ts`, which already calls `POST /user/properties/{id}`. Then show Edit for rentals in the list and the preview.
- **Done when:** rentals can be edited like land.

### 13. Boosts only work for land; add-on prices are hard-coded

- **Where:** `src/components/BoostModal.tsx:26` (uses land listings only); `src/lib/plans.ts:54` (`addOns`, Ksh 300 and Ksh 500). The backend boost endpoints only accept `land_parcels` IDs.
- **Fix:**
  - Backend: let boosts target properties, and serve add-on names, prices and durations from the API.
  - Frontend: list land and rentals in "Choose a listing"; read prices from the API.
- **Done when:** any listing can be boosted, and admins can change add-on prices without a frontend deploy.

### 14. Rentals are left out of analytics

- **Where:** `GET /user/analytics` (`backend/app/Http/Controllers/Api/UserController.php`, `analytics`) only reads land parcels.
- **Fix:** include property views, saves and inquiries, and add a land/rentals filter next to "All Properties".
- **Done when:** rental activity appears in Analytics.

### 15. Notification titles show raw type names

- **Where:** `src/components/NotificationBell.tsx:57`. Only `kyc_info_requested` has a readable title.
- **Fix:** add readable titles for every notification type the backend sends, with a sensible fallback (e.g. "Update on your account"). Make each item link to the relevant tab.
- **Done when:** no notification shows a raw type such as `listing_approved`.

### 16. Failures with no message to the user

- **Where:**
  - CSV export: `ListingsTab.tsx:206`
  - Analytics load: `dashboard.index.tsx:298`
  - Viewing a KYC document: `:2697`
  - KYC location fix: `:3195`
  - KYC reply: `:3227`
  - Profile and notification saves (`saveProfile`, `saveNotif`): no `catch` at all; "Saved at …" shows only on success, but failures say nothing.
- **Fix:** show an error the user can act on. A toast is enough, e.g. "Couldn't export your listings. Try again." The redesign should give every async action a working state, a success state and an error state.
- **Done when:** every action that can fail tells the user when it does.

### 17. Hard-coded colours break dark mode

- **Where:** throughout `src/routes/dashboard.index.tsx`, `dashboard.upload.tsx` (the `.lv-input` style block at the end of the file), `dashboard.properties.tsx`, and the modals. Values such as `#15803D`, `#166534`, `#0F172A`, the chart colours, and the KYC status colours.
- **Fix:** use the theme tokens in `src/styles.css` (`brand`, `brand-hover`, `primary`, `success`, `warning`, `destructive`, and their `-subtle` variants), and give charts and KYC statuses their own tokens with dark values.
- **Done when:** every dashboard screen reads correctly in dark mode.

### 18. Land and rental wizards look like two different products

- **Where:** `src/routes/dashboard.upload.tsx` (step circles, `.lv-input`, photo thumbnails, drag-and-drop) and `src/routes/dashboard.properties.tsx` (pill steps, `.dp-input`, file-name list, no drag-and-drop).
- **Fix:** build both wizards from the same step indicator, inputs and photo picker, including thumbnails, cover choice and plan photo limits for rentals.
- **Done when:** the two flows share components and behave the same way.
