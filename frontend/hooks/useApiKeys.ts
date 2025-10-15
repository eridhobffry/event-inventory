"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiKey } from "@/lib/api";
import { useUser } from "@stackframe/stack";
import { toast } from "sonner";

export function useApiKeys() {
  const user = useUser();

  return useQuery({
    queryKey: ["apiKeys"],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const token = await user.getAuthJson().then((auth) => auth.accessToken);
      return api.getApiKeys(token);
    },
    enabled: !!user,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: async (data: { name: string; expiresInDays?: number }) => {
      if (!user) throw new Error("Not authenticated");
      const token = await user.getAuthJson().then((auth) => auth.accessToken);
      return api.createApiKey(data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
      toast.success("API key created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create API key: ${error.message}`);
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      const token = await user.getAuthJson().then((auth) => auth.accessToken);
      return api.deleteApiKey(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
      toast.success("API key revoked successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to revoke API key: ${error.message}`);
    },
  });
}
