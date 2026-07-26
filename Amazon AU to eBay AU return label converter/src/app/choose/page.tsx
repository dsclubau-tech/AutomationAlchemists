import { redirect } from "next/navigation";
import { getAppAuthContext } from "@/lib/auth-context";
import { AppChooser } from "@/components/app-chooser";

export const dynamic = "force-dynamic";

export default async function ChoosePage() {
  const auth = await getAppAuthContext();

  if (auth.authEnabled && !auth.userId) {
    redirect("/login");
  }

  return <AppChooser />;
}
