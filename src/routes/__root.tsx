import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";

const AUTH_BG_URLS = [
  "https://images.unsplash.com/photo-1535342604578-a175d3fc4f22?w=1920&q=90&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1598941101837-e3fdd6d94b24?w=1920&q=90&auto=format&fit=crop",
];

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Geo Pin Properties Kenya — Verified Land & Property Intelligence" },
      {
        name: "description",
        content:
          "Explore plotted land parcels, verified properties, and rentals across Kenya using interactive GIS-powered maps.",
      },
      {
        property: "og:title",
        content: "Geo Pin Properties Kenya — Verified Land & Property Intelligence",
      },
      {
        property: "og:description",
        content:
          "Explore plotted land parcels, verified properties, and rentals across Kenya using interactive GIS-powered maps.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Geo Pin Properties" },
      { property: "og:image", content: `${import.meta.env.VITE_SITE_URL ?? ""}/og-image.png` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Geo Pin Properties — Find. Connect. Own." },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `${import.meta.env.VITE_SITE_URL ?? ""}/og-image.png` },
      { name: "theme-color", content: "#1A752A" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      ...(import.meta.env.VITE_CPANEL
        ? []
        : [
            { rel: "stylesheet", href: appCss },
            { rel: "preconnect", href: "https://fonts.googleapis.com" },
            { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" as const },
            {
              rel: "stylesheet",
              href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
            },
            { rel: "preload", as: "image", href: AUTH_BG_URLS[0] },
            { rel: "preload", as: "image", href: AUTH_BG_URLS[1] },
          ]),
    ],
  }),
  shellComponent: import.meta.env.VITE_CPANEL ? undefined : RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("lv_theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}})()`;

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

// The home page, the marketing pages, blog posts and the map pages bring their own chrome.
const OWN_CHROME_PATHS = new Set([
  "/",
  "/pricing",
  "/blog",
  "/about",
  "/help",
  "/contact",
  "/land",
  "/rentals",
  "/explore",
]);
const NO_NAVBAR_PREFIXES = [
  "/dashboard",
  "/manager",
  "/login",
  "/loading",
  "/register",
  "/forgot-password",
  "/reset-password",
];

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { pathname } = useLocation();
  const showNavbar =
    !OWN_CHROME_PATHS.has(pathname) &&
    !pathname.startsWith("/blog/") &&
    !NO_NAVBAR_PREFIXES.some((p) => pathname.startsWith(p));
  const showFooter = showNavbar;

  useEffect(() => {
    AUTH_BG_URLS.forEach((url) => {
      new Image().src = url;
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {showNavbar && <Navbar scrollAware />}
        <Outlet />
        {showFooter && <SiteFooter />}
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
