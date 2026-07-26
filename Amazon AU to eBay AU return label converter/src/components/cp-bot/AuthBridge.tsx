"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

export function AuthBridge() {
  const lastState = useRef<{ signedIn: boolean; session: Session | null }>({
    signedIn: false,
    session: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const supabase = createClient();
    const source = window.location.hostname === "localhost" ? "localhost" : "vercel";
    const origin = window.location.origin;

    const dispatchAuthState = (signedIn: boolean, session: Session | null, isSignOutEvent = false) => {
      lastState.current = { signedIn, session };
      
      const detail = {
        source,
        origin,
        signedIn,
        isSignOutEvent,
        user: session?.user
          ? { id: session.user.id, email: session.user.email || "" }
          : null,
        accessToken: session?.access_token || null,
        refreshToken: session?.refresh_token || null,
        timestamp: Date.now(),
      };
      


      window.dispatchEvent(
        new CustomEvent("cp_bot_auth_bridge", { detail })
      );
    };

    // 1. Get current session and dispatch initial state
    void supabase.auth.getSession().then(({ data: { session } }) => {
      dispatchAuthState(Boolean(session?.user), session);
    });

    // 2. Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {

      const isSignOutEvent = event === "SIGNED_OUT";
      dispatchAuthState(Boolean(session?.user), session, isSignOutEvent);
    });

    // 3. Listen for requests from the extension bridge
    const handleRequestAuth = () => {

      void supabase.auth.getSession().then(({ data: { session } }) => {
        dispatchAuthState(Boolean(session?.user), session);
      });
    };
    window.addEventListener("cp_bot_request_auth", handleRequestAuth);

    const handleLoginRequest = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { accessToken, refreshToken } = customEvent.detail || {};
      if (accessToken && refreshToken) {

        void supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(({ data: { session } }) => {
          if (session) {

            dispatchAuthState(true, session);
          }
        }).catch((err) => {
          console.error("[AuthBridge] Failed to setSession from extension tokens:", err);
        });
      }
    };
    window.addEventListener("cp_bot_auth_login_request", handleLoginRequest);

    // 4. Fast heartbeat — getSession() reads from local storage (zero network cost)
    const interval = setInterval(() => {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        dispatchAuthState(Boolean(session?.user), session);
      });
    }, 3000);

    // 5. Instant dispatch when tab becomes visible (e.g. user switches back)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void supabase.auth.getSession().then(({ data: { session } }) => {
          dispatchAuthState(Boolean(session?.user), session);
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // 6. beforeunload final "leaving" heartbeat
    const handleBeforeUnload = () => {
      dispatchAuthState(lastState.current.signedIn, lastState.current.session);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
      window.removeEventListener("cp_bot_request_auth", handleRequestAuth);
      window.removeEventListener("cp_bot_auth_login_request", handleLoginRequest);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return null;
}
export default AuthBridge;
