import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

// A dark-ink pill in both themes; the icon carries the success/error colour
// (the -subtle tints are the ones that read on an ink background).
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-[14px] group-[.toaster]:border-transparent group-[.toaster]:bg-foreground group-[.toaster]:font-semibold group-[.toaster]:text-background group-[.toaster]:shadow-[0_14px_34px_rgba(0,0,0,0.28)]",
          description: "group-[.toast]:font-normal group-[.toast]:text-background/75",
          actionButton: "group-[.toast]:bg-brand group-[.toast]:text-brand-foreground",
          cancelButton: "group-[.toast]:bg-background/15 group-[.toast]:text-background",
          success: "[&_[data-icon]]:text-brand-subtle",
          error: "[&_[data-icon]]:text-destructive-subtle",
          warning: "[&_[data-icon]]:text-warning-subtle",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
