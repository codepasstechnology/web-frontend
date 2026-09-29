import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

export interface Notification {
  id: string;
  data: { type: string; message?: string; reference?: string };
  read_at: string | null;
  created_at: string;
}

const KEY = ["notifications"];

export function useNotifications() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<Notification[]>("/user/notifications"),
    staleTime: 60_000,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/user/notifications/read-all"),
    onMutate: () => {
      const now = new Date().toISOString();
      queryClient.setQueryData<Notification[]>(KEY, (prev) =>
        prev?.map((n) => ({ ...n, read_at: n.read_at ?? now })),
      );
    },
  });
}
