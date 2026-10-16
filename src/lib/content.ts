import { queryOptions, useQuery } from "@tanstack/react-query";
import { api, type BlogPost, type Faq, type Paginated } from "./api";

export interface LegalDoc {
  name: string;
  version: string;
  content: string;
  effective_date: string | null;
  published_at: string;
}

export type LegalDocType = "terms" | "privacy" | "data-usage" | "cookie-policy";

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

export function blogPostQuery(slug: string) {
  return queryOptions({
    queryKey: ["blog-post", slug],
    queryFn: () => api.get<BlogPost>(`/blog/${slug}`),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useLegalDoc(type: LegalDocType) {
  return useQuery({
    queryKey: ["legal-doc", type],
    queryFn: () => api.get<LegalDoc>(`/legal/${type}`),
    staleTime: 5 * 60_000,
    retry: false,
  });
}
