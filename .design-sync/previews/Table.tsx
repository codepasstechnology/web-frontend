import {
  Badge,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "land-eye-kenya-frontend";

const rows = [
  { parcel: "KAJ/KTG/4521", county: "Kajiado", price: "1,850,000", status: "Verified", views: 412 },
  { parcel: "KBU/RUIRU/882", county: "Kiambu", price: "3,200,000", status: "Pending", views: 96 },
  { parcel: "NKU/NAIV/1190", county: "Nakuru", price: "950,000", status: "Sold", views: 1204 },
];

const tone: Record<string, string> = {
  Verified: "bg-success/10 text-success",
  Pending: "bg-warning/10 text-warning",
  Sold: "bg-muted text-muted-foreground",
};

export const MyListings = () => (
  <Table className="w-[40rem]">
    <TableCaption>Your land listings</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead>Parcel</TableHead>
        <TableHead>County</TableHead>
        <TableHead className="text-right">Price (KES)</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Views</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map((r) => (
        <TableRow key={r.parcel}>
          <TableCell className="font-medium">{r.parcel}</TableCell>
          <TableCell>{r.county}</TableCell>
          <TableCell className="text-right tabular-nums">{r.price}</TableCell>
          <TableCell>
            <Badge className={`border-transparent ${tone[r.status]}`}>{r.status}</Badge>
          </TableCell>
          <TableCell className="text-right tabular-nums">{r.views}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
