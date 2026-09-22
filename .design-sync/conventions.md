# Geo Pin Properties — building with this design system

Kenyan land & rental marketplace ("Find. Connect. Own."). Components are shadcn/ui on Radix,
styled with **Tailwind v4 utility classes bound to CSS tokens**. Everything is on
`window.GeoPin`.

## Setup

No root provider is needed; tokens live on `:root` in `styles.css`. Two components need a
wrapper or they throw:

- `Tooltip` → wrap in `TooltipProvider`.
- `Sidebar` → wrap in `SidebarProvider`. For an inline (non-fixed) sidebar use
  `<Sidebar collapsible="none">`.

Every primitive forwards native DOM props (`onClick`, `disabled`, `type`, `href`, `aria-*`)
even where its `.d.ts` lists only the custom props. Overlays (`Dialog`, `AlertDialog`,
`Sheet`, `Drawer`, `Popover`, `DropdownMenu`, `Tooltip`, `HoverCard`, `Select`) are Radix: pass
`open` to show them.

## Styling: token utilities only

Never hard-code hex. Use these token classes (`bg-*`, `text-*`, `border-*`, `ring-*`, with
opacity steps `/5 /10 /20 /30 /50 /80 /90`):

| Role                      | Classes                                                                |
| ------------------------- | ---------------------------------------------------------------------- |
| Page / surfaces           | `bg-background`, `bg-card`, `bg-muted`, `bg-popover`                   |
| Text                      | `text-foreground`, `text-muted-foreground`                             |
| Primary (navy #0A1C2E)    | `bg-primary text-primary-foreground` — default `Button`                |
| Brand (pin green #1A752A) | `bg-brand text-brand-foreground` — hero CTAs, logo, highlights         |
| Status                    | `text-success`, `text-warning`, `text-destructive` (+ `bg-*/10` tints) |
| Lines                     | `border-border`, `border-input`, `ring-ring`                           |

Font is Inter, applied by default (no class needed). Radius: `rounded-md` for controls, `rounded-lg`/`rounded-xl` for cards.

Brand rules:

- One green CTA per view: `<Button className="bg-brand text-brand-foreground hover:bg-brand/90">`.
  Secondary actions use the default navy `Button` or `variant="outline"`.
- Listing status chips: `<Badge className="border-transparent bg-success/10 text-success">Verified</Badge>`;
  pending = `bg-warning/10 text-warning`; sold/taken = `bg-muted text-muted-foreground`;
  disputed = `variant="destructive"`.
- Brand mark: use `Logo` (mark + wordmark) in headers and `LogoMark` for icons or avatars.
  Never redraw the pin.
- Prices: `KES 1,850,000` (sale) or `KES 45,000/mo` (rent); use `tabular-nums` in tables.

Layout rules from the product:

- A table of records is `Table` on desktop and a card list on mobile (`hidden md:block` /
  `md:hidden`). A card shows identity, one headline value, status and one line of context,
  and the whole card is the tap target.
- KPI rows are `grid grid-cols-3` (or `grid-cols-2`) on mobile, never one card per row.

Known limits: `Slider` renders one thumb (single value only). `ContextMenu` opens on right-click only.

## Where the truth lives

`styles.css` → imports `_ds_bundle.css` (all tokens on `:root`, plus every utility above).
Each component has its API in `components/<group>/<Name>/<Name>.d.ts` and usage examples in
`<Name>.prompt.md`.

## Example

```tsx
const { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge, Button } =
  window.GeoPin;

<Card className="w-80">
  <CardHeader>
    <div className="flex items-start justify-between gap-2">
      <CardTitle>Kitengela Prime Plot</CardTitle>
      <Badge className="border-transparent bg-success/10 text-success">Verified</Badge>
    </div>
    <CardDescription>KAJ/KTG/4521 · Kajiado County · 50 × 100 ft</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-2xl font-semibold text-foreground">KES 1,850,000</p>
  </CardContent>
  <CardFooter className="gap-2">
    <Button className="flex-1 bg-brand text-brand-foreground hover:bg-brand/90">
      Contact seller
    </Button>
    <Button variant="outline">Save</Button>
  </CardFooter>
</Card>;
```
