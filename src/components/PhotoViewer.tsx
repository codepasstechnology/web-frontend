import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Full-screen, swipeable view of a listing's photos. `index === null` means closed. */
export function PhotoViewer({
  photos,
  title,
  index,
  onClose,
}: {
  photos: string[];
  title: string;
  index: number | null;
  onClose: () => void;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(index ?? 0);
  const many = photos.length > 1;

  useEffect(() => {
    if (index !== null) setCurrent(index);
  }, [index]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") api?.scrollPrev();
    if (e.key === "ArrowRight") api?.scrollNext();
  };

  return (
    <Dialog open={index !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        {/* Above the map listing panels (z-[1150]) and the open mobile nav (z-[1200]). */}
        <DialogOverlay className="z-[1300] bg-black" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onKeyDown={onKeyDown}
          className="fixed inset-0 z-[1300] flex flex-col text-white focus:outline-none"
        >
          <DialogTitle className="sr-only">{title} photos</DialogTitle>

          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium tabular-nums">
              {current + 1} / {photos.length}
            </span>
            <DialogPrimitive.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close photos"
                className="text-white hover:bg-white/10 hover:text-white"
              >
                <X />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center">
            <Carousel
              setApi={setApi}
              opts={{ startIndex: index ?? 0, loop: true }}
              className="w-full"
            >
              <CarouselContent className="ml-0">
                {photos.map((url, i) => (
                  <CarouselItem key={url} className="flex items-center justify-center pl-0">
                    <img
                      src={url}
                      alt={`${title}, photo ${i + 1} of ${photos.length}`}
                      className="max-h-[calc(100dvh-10rem)] w-full select-none object-contain"
                      draggable={false}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            {many && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Previous photo"
                  onClick={() => api?.scrollPrev()}
                  className="absolute left-2 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white sm:left-4"
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Next photo"
                  onClick={() => api?.scrollNext()}
                  className="absolute right-2 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white sm:right-4"
                >
                  <ChevronRight />
                </Button>
              </>
            )}
          </div>

          {many && (
            <div className="flex justify-center gap-2 overflow-x-auto px-4 py-3">
              {photos.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === current}
                  onClick={() => api?.scrollTo(i)}
                  className={cn(
                    "h-14 w-20 shrink-0 overflow-hidden rounded-md opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                    i === current && "opacity-100 ring-2 ring-white",
                  )}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
