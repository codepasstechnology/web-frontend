import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "land-eye-kenya-frontend";
import { useForm } from "react-hook-form";

export const ListingForm = () => {
  const form = useForm({ defaultValues: { parcel: "KAJ/KTG/4521", price: "" } });
  return (
    <Form {...form}>
      <form className="grid w-80 gap-4">
        <FormField
          control={form.control}
          name="parcel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parcel number</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>As printed on the title deed.</FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asking price (KES)</FormLabel>
              <FormControl>
                <Input placeholder="1,850,000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="button">Save listing</Button>
      </form>
    </Form>
  );
};
