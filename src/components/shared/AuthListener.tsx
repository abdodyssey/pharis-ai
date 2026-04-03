"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { useResearchStore } from "@/store/useResearchStore";

export default function AuthListener() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const resetStore = useResearchStore((state) => state.resetStore);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthListener] Event: ${event}`);

      if (event === "SIGNED_OUT") {
        resetStore();
        router.push("/login");
        router.refresh();
      } else if (event === "SIGNED_IN") {
        router.refresh();
        // Redirect to dashboard if on auth pages
        if (pathname === "/login" || pathname === "/register") {
          router.push("/dashboard");
        }
      } else if (event === "TOKEN_REFRESHED") {
        console.log("[AuthListener] Token refreshed");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, resetStore, pathname]);

  return null;
}
