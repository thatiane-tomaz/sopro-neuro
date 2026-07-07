import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type MuralPost = {
  id: string;
  user_id: string;
  author_name: string | null;
  content: string;
  day_number: number | null;
  status: "pending" | "approved" | "rejected";
  color_hue: number;
  created_at: string;
  approved_at: string | null;
};

export function useMuralPosts() {
  return useQuery({
    queryKey: ["mural-posts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("mural_posts")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as MuralPost[];
    },
    staleTime: 60_000,
  });
}

export function useCreateMuralPost() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      content,
      authorName,
      dayNumber,
    }: {
      content: string;
      authorName?: string | null;
      dayNumber?: number | null;
    }) => {
      if (!user) throw new Error("Não autenticado");
      const hue = Math.floor(Math.random() * 360);
      const { data, error } = await (supabase as any)
        .from("mural_posts")
        .insert({
          user_id: user.id,
          content: content.trim(),
          author_name: authorName?.trim() || null,
          day_number: dayNumber ?? null,
          color_hue: hue,
        })
        .select()
        .single();
      if (error) throw error;
      return data as MuralPost;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mural-posts"] }),
  });
}

export function useDeleteMuralPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("mural_posts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mural-posts"] }),
  });
}