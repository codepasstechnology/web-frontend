import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "land-eye-kenya-frontend";

const shots = ["Front view", "Access road", "Boundary beacon", "Neighbourhood"];

export const PhotoGallery = () => (
  <div className="px-12">
    <Carousel className="w-80">
      <CarouselContent>
        {shots.map((s, i) => (
          <CarouselItem key={s}>
            <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
              Photo {i + 1} · {s}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  </div>
);
