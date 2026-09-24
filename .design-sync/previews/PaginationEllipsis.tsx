import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "land-eye-kenya-frontend";

export const BetweenPages = () => (
  <Pagination>
    <PaginationContent>
      <PaginationItem>
        <PaginationLink href="#">1</PaginationLink>
      </PaginationItem>
      <PaginationItem>
        <PaginationEllipsis />
      </PaginationItem>
      <PaginationItem>
        <PaginationLink href="#" isActive>
          8
        </PaginationLink>
      </PaginationItem>
    </PaginationContent>
  </Pagination>
);
