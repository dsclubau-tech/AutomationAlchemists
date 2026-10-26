import { supabase } from '@/integrations/supabase/client';
import { sanitizeNext } from '@/lib/trial';

export interface StartTrialCheckoutOptions {
  returnPath?: string;
  user?: any;
  toast?: any;
}

/**
 * Initiates card-required free trial checkout for RCCP.
 * - If user is signed out: redirects to signup with sanitized return path.
 * - If user is signed in: invokes create-checkout-session edge function and redirects to Stripe.
 */
export const startTrialCheckout = async (options?: StartTrialCheckoutOptions): Promise<void> => {
  const { returnPath, user, toast } = options || {};

  // 1. Unauthenticated -> redirect to signup with sanitized return path
  if (!user) {
    const rawPath = returnPath || (typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/tools/rccp');
    const safeNext = sanitizeNext(rawPath);
    window.location.href = `/auth?mode=signup&next=${encodeURIComponent(safeNext)}`;
    return;
  }

  // 2. Authenticated -> request checkout session from edge function
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        product_slug: 'rccp',
        quantity: 1,
      },
    });

    if (error) {
      let errorMessage = error.message || 'Unable to start trial checkout.';
      if (typeof error === 'object' && error !== null && 'context' in error) {
        try {
          const body = await (error as any).context.json();
          if (body?.error) {
            errorMessage = body.error;
          }
        } catch {
          // ignore json parse error
        }
      }
      if (toast) {
        toast({
          title: 'Trial Checkout Notice',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No checkout URL returned.');
    }
  } catch (err: any) {
    console.error('startTrialCheckout error:', err);
    if (toast) {
      toast({
        title: 'Trial Checkout Notice',
        description: err.message || 'Unable to start checkout session. Please try again.',
        variant: 'destructive',
      });
    }
  }
};

/**
 * Redirects the user to the Stripe Billing Customer Portal.
 */
export const redirectToBillingPortal = async (toast?: any): Promise<void> => {
  try {
    const { data, error } = await supabase.functions.invoke('create-portal-session');

    if (error) {
      let errorMessage = 'Unable to access billing portal.';
      if (typeof error === 'object' && error !== null && 'context' in error) {
        try {
          const body = await (error as any).context.json();
          if (body?.code === 'no_customer') {
            errorMessage = 'No active Stripe subscription found to manage.';
          } else if (body?.error) {
            errorMessage = body.error;
          }
        } catch {
          // ignore
        }
      }
      if (toast) {
        toast({
          title: 'Billing Portal',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No portal URL returned.');
    }
  } catch (err: any) {
    console.error('redirectToBillingPortal error:', err);
    if (toast) {
      toast({
        title: 'Billing Portal',
        description: err.message || 'Unable to access billing portal.',
        variant: 'destructive',
      });
    }
  }
};

export const handleGetAccessLogic = (slug: string, user: any, toast: any) => {
    if (import.meta.env.VITE_CHECKOUT_ENABLED !== 'true') {
        window.location.href = "/contact";
        return;
    }

    if (!user) {
        toast({
            title: "Authentication Required",
            description: "Please sign in or create an account to get access to this tool.",
            variant: "destructive"
        });
        setTimeout(() => {
            const currentPath = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}${window.location.hash}` : '/';
            window.location.href = `/auth?next=${encodeURIComponent(currentPath)}`;
        }, 1500);
        return;
    }

    const existingCartStr = localStorage.getItem('cart');
    let cart = existingCartStr ? JSON.parse(existingCartStr) : [];
    if (!cart.includes(slug)) {
        cart.push(slug);
    }
    localStorage.setItem('cart', JSON.stringify(cart));

    window.location.href = "/cart";
};
