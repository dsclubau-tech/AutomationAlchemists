/**
 * Pure helper for authentication flow state transitions.
 */

export const SIGNUP_CONFIRMATION_NOTICE =
  'Account created. Check your email to confirm your account, then sign in.';

export interface SignUpSuccessTransitionInput {
  email: string;
  hasSession?: boolean;
}

export interface SignUpSuccessTransitionState {
  isSignUp: boolean;
  prefilledEmail: string;
  clearedPassword: string;
  notice: string | null;
  shouldNavigate: boolean;
}

/**
 * Calculates transition state after a sign-up attempt.
 * For unconfirmed accounts (standard Supabase email confirmation flow):
 * 1. Switches to Sign in tab (`isSignUp: false`).
 * 2. Pre-fills email address (never password).
 * 3. Clears password.
 * 4. Displays persistent notice banner above the form.
 * 5. Prevents automatic navigation/sign-in.
 */
export function getSignUpSuccessState(input: SignUpSuccessTransitionInput): SignUpSuccessTransitionState {
  const trimmedEmail = (input.email || '').trim();

  if (input.hasSession) {
    return {
      isSignUp: false,
      prefilledEmail: trimmedEmail,
      clearedPassword: '',
      notice: null,
      shouldNavigate: true,
    };
  }

  return {
    isSignUp: false,
    prefilledEmail: trimmedEmail,
    clearedPassword: '',
    notice: SIGNUP_CONFIRMATION_NOTICE,
    shouldNavigate: false,
  };
}
