import { useQuery } from "@tanstack/react-query";
import { api, type BlogPost, type Faq, type Paginated } from "./api";

export function useFaqs() {
  return useQuery({
    queryKey: ["faqs"],
    queryFn: () => api.get<Faq[]>("/faqs"),
    staleTime: 5 * 60_000,
  });
}

export function useBlogPosts() {
  return useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => (await api.get<Paginated<BlogPost>>("/blog")).data,
    staleTime: 5 * 60_000,
  });
}
