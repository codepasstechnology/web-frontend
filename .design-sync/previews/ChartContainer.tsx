import { ChartContainer, ChartTooltipContent, type ChartConfig } from "land-eye-kenya-frontend";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

const data = [
  { day: "Mon", views: 186 },
  { day: "Tue", views: 305 },
  { day: "Wed", views: 237 },
  { day: "Thu", views: 273 },
  { day: "Fri", views: 209 },
  { day: "Sat", views: 314 },
  { day: "Sun", views: 264 },
];

const config = { views: { label: "Listing views", color: "var(--brand)" } } satisfies ChartConfig;

export const WeeklyViews = () => (
  <ChartContainer config={config} className="h-56 w-[28rem]">
    <BarChart data={data}>
      <CartesianGrid vertical={false} />
      <XAxis dataKey="day" tickLine={false} axisLine={false} />
      <Bar dataKey="views" fill="var(--color-views)" radius={4} />
    </BarChart>
  </ChartContainer>
);

export const TooltipContent = () => (
  <div className="w-48">
    <ChartContainer config={config} className="h-auto">
      <ChartTooltipContent
        active
        label="Saturday"
        payload={[{ name: "views", dataKey: "views", value: 314, color: "var(--brand)", payload: { views: 314 } }]}
      />
    </ChartContainer>
  </div>
);
