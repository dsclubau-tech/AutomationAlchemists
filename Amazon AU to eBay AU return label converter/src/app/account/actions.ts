"use server";

import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function getPasswordValue(formData: FormData, name: string) {
  return String(formData.get(name) || "");
}

function accountRedirect(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);

  return `/account?${searchParams.toString()}`;
}

export async function changePassword(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect(accountRedirect({ password_error: "Password changes require Supabase auth." }));
  }

  const oldPassword = getPasswordValue(formData, "oldPassword");
  const newPassword = getPasswordValue(formData, "newPassword");
  const confirmPassword = getPasswordValue(formData, "confirmPassword");

  if (!oldPassword || !newPassword || !confirmPassword) {
    redirect(accountRedirect({ password_error: "Enter your old password and new password." }));
  }

  if (newPassword.length < 8) {
    redirect(accountRedirect({ password_error: "New password must be at least 8 characters." }));
  }

  if (newPassword !== confirmPassword) {
    redirect(accountRedirect({ password_error: "New password and confirmation do not match." }));
  }

  if (oldPassword === newPassword) {
    redirect(accountRedirect({ password_error: "New password must be different from the old password." }));
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    redirect(accountRedirect({ password_error: "Your session expired. Sign in again before changing password." }));
  }

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: oldPassword,
  });

  if (authError) {
    redirect(accountRedirect({ password_error: "Old password is incorrect." }));
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    redirect(accountRedirect({ password_error: updateError.message }));
  }

  redirect(accountRedirect({ password_changed: "1" }));
}
