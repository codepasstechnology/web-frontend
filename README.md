# LandVerify Kenya — User Marketplace Frontend

React 19 SPA powering the public-facing LandVerify marketplace — property search, listings, user dashboard, KYC submission, and subscription management.

---

## Tech Stack

| Layer         | Choice                                 |
| ------------- | -------------------------------------- |
| Framework     | React 19                               |
| Language      | TypeScript 5.8                         |
| Router        | TanStack Router v1 (file-based routes) |
| Data fetching | TanStack Query v5 (React Query)        |
| Styling       | Tailwind CSS v4                        |
| UI primitives | Radix UI + shadcn/ui                   |
| Icons         | Lucide React                           |
| Maps          | Leaflet + React Leaflet                |
| Forms         | React Hook Form + Zod                  |
| Toasts        | Sonner                                 |
| Build tool    | Vite 7                                 |

---

## Setup

```bash
cd web-frontend
npm install
npm run dev       # dev server (proxies /api to XAMPP on port 80)
npm run build     # production build
npm run lint      # ESLint
```

---

## Project Structure

```
src/
  lib/
    api.ts        # Fetch wrapper — Bearer token, auto-detects FormData
    auth.tsx      # AuthProvider, useAuth(), NewListingInput type
    plans.ts      # Plan definitions and PlanId type
  components/
    DashboardShell.tsx   # Authenticated layout wrapper
    LandMap.tsx          # Leaflet map with parcel markers
    MapSearchBar.tsx     # County/keyword search overlay on the map
    MapSidebar.tsx       # Parcel list panel alongside the map
    MapLegend.tsx        # Map legend for listing types
    PropertyPanel.tsx    # Parcel detail slide-in panel
    Navbar.tsx           # Public site navbar
    PlanCard.tsx         # Subscription plan pricing card
    UpgradeModal.tsx     # Plan upgrade prompt
    LegalDocPage.tsx     # Shared page for Terms / Privacy content
    ui/                  # shadcn/ui component library
  routes/
    __root.tsx           # Root layout + AuthProvider
    index.tsx            # Landing page
    land.tsx             # Public map + property search (/land)
    pricing.tsx          # Subscription plans page (/pricing)
    login.tsx            # User login
    register.tsx         # User registration
    forgot-password.tsx  # Password reset request
    terms.tsx            # Terms of Service (fetched from CMS)
    privacy.tsx          # Privacy Policy (fetched from CMS)
    rentals.tsx          # Rentals listing page
    dashboard.index.tsx  # Authenticated dashboard home
    dashboard.upload.tsx # New listing submission form
  hooks/
    use-mobile.tsx       # Responsive breakpoint hook
  router.tsx             # TanStack Router configuration
```

---

## Authentication

`AuthProvider` (in `src/lib/auth.tsx`) manages all auth state. On app load it reads the Bearer token from `localStorage` (`lv_token`) and re-hydrates the user via `/api/user/me`.

`useAuth()` exposes:

```ts
{
  user: AppUser | null
  ready: boolean
  login(email, password, remember?): Promise<AppUser>
  register(data): Promise<AppUser>
  logout(): Promise<void>
  setPlan(plan: PlanId): void       // local-only; real payment flow TBD
  addListing(l: NewListingInput): Promise<void>
  removeListing(id: string): Promise<void>
  updateUser(patch: Partial<AppUser>): Promise<void>
  deleteAccount(): Promise<void>
  refreshListings(): Promise<void>
}
```

---

## API Client (`src/lib/api.ts`)

Thin fetch wrapper around the Laravel backend. Key behaviour:

- Reads token from `localStorage` and sends `Authorization: Bearer <token>` on every request.
- **FormData detection** — if the request body is a `FormData` instance it skips setting `Content-Type` so the browser sets the correct multipart boundary automatically. All other requests send `Content-Type: application/json`.
- Throws a structured error on non-2xx responses (includes the parsed JSON body for validation error display).

---

## Listing Submission with Title Deed Upload

`NewListingInput` in `auth.tsx` includes an optional `titleDeedFile?: File` field.

When `addListing` is called with a file:

1. A `FormData` body is built with all listing fields plus the file appended as `title_deed`.
2. The API client detects `FormData` and sends it without setting `Content-Type`, allowing multipart upload.
3. The backend (`UserListingController`) saves the parcel, creates a `KycApplication`, stores the file in `storage/app/public/kyc/`, and creates a `KycDocument` record with `type = "title_deed"`.
4. `has_title_deed` is set to `true` on the parcel.

Without a file, a plain JSON body is sent and no KYC document is created.

---

## Routes

| Route               | Auth   | Description                                               |
| ------------------- | ------ | --------------------------------------------------------- |
| `/`                 | Public | Landing page                                              |
| `/land`             | Public | Interactive map with parcel search and property panel     |
| `/pricing`          | Public | Subscription plan comparison                              |
| `/login`            | Guest  | User login                                                |
| `/register`         | Guest  | User registration                                         |
| `/forgot-password`  | Guest  | Password reset request                                    |
| `/terms`            | Public | Terms of Service (CMS-driven)                             |
| `/privacy`          | Public | Privacy Policy (CMS-driven)                               |
| `/rentals`          | Public | Rental listings                                           |
| `/dashboard`        | Auth   | User dashboard — listings, payments, analytics            |
| `/dashboard/upload` | Auth   | New property listing form with optional title deed upload |

---

## Legal Pages (CMS-driven)

`/terms` and `/privacy` fetch their content from `GET /api/legal/terms` and `GET /api/legal/privacy` respectively. These return the latest published `LegalDocument` from the backend CMS. Content is rendered as HTML (set by the admin via the rich text CMS editor).

---

## Subscription Plans

Defined in `src/lib/plans.ts`. Plan IDs: `free`, `basic`, `pro`, `enterprise`.

`setPlan` in `AuthProvider` is currently local-only (updates in-memory state). Real payment integration is not yet wired.

---

## Deploying to cPanel

```bash
npm run build
```

Upload the contents of `dist/` to the subdomain document root. Add an `.htaccess` rewrite rule to serve `index.html` for all routes (client-side routing).
