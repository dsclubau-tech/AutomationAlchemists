import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// ── Singleton auth state (shared across all useAuth consumers) ──
let currentSession: Session | null = null;
let initialized = false;
const listeners: Set<(session: Session | null) => void> = new Set();

function broadcast(session: Session | null) {
  currentSession = session;
  initialized = true;
  listeners.forEach(fn => fn(session));
}

// Module-level listener — runs once when this module is first imported.
// All components that call useAuth() share this single source of truth.
supabase.auth.onAuthStateChange((_event, session) => {
  broadcast(session);
});

supabase.auth.getSession().then(({ data: { session } }) => {
  broadcast(session);
});

// Visibility change handler — re-validate session when user returns to tab.
// Fixes the "inactive tab for 5+ minutes" bug where the token expires silently.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      const { data: { session } } = await supabase.auth.getSession();
      broadcast(session);
    }
  });
}

// ── Hook ──
export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(currentSession);
  const [loading, setLoading] = useState(!initialized);

  useEffect(() => {
    const listener = (s: Session | null) => {
      setSession(s);
      setLoading(false);
    };
    listeners.add(listener);

    // If session was already resolved before this component mounted
    if (initialized) {
      setSession(currentSession);
      setLoading(false);
    }

    return () => { listeners.delete(listener); };
  }, []);

  const user: User | null = session?.user ?? null;

  const signUp = async (email: string, password: string, fullName?: string, metadata?: {
    country?: string;
    phone?: string;
    referral_source?: string;
    terms_accepted?: boolean;
  }) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          country: metadata?.country,
          phone: metadata?.phone,
          referral_source: metadata?.referral_source,
          terms_accepted: metadata?.terms_accepted,
        },
      },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };
};
