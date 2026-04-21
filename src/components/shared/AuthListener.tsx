"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { useResearchStore } from "@/store/useResearchStore";

export default function AuthListener() {
  const router = useRouter();
  const pathname = usePathname();
  const resetStore = useResearchStore((state) => state.resetStore);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthListener] Event: ${event}`);

      if (event === "SIGNED_OUT") {
        resetStore();
        window.location.href = "/login";
      } else if (event === "SIGNED_IN") {
        if (pathname === "/login" || pathname === "/register") {
          window.location.href = "/";
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
