import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Returns whether the current authenticated user's email is on the freelist
 * (free access whitelist). Treats expired entries as not on the list.
 */
export const useIsFreelist = () => {
  const { user } = useAuth();
  const email = user?.email?.toLowerCase() || null;

  const { data, isLoading } = useQuery({
    queryKey: ["freelist", email],
    enabled: !!email,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!email) return false;
      const { data, error } = await supabase
        .from("freelist_users")
        .select("id, expires_at")
        .ilike("email", email)
        .limit(1);
      if (error) {
        console.error("Error checking freelist:", error);
        return false;
      }
      const row = data?.[0];
      if (!row) return false;
      if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
        return false;
      }
      return true;
    },
  });

  return { isFreelist: !!data, loading: isLoading };
};
