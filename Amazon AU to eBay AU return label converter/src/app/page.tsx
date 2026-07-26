import { AppShell } from "@/components/app-shell";
import { LabelWizard } from "@/components/label-wizard";
import { getAppAuthContext } from "@/lib/auth-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default async function Home() {
  const auth = await getAppAuthContext();

  return (
    <AppShell authEnabled={auth.authEnabled} userEmail={auth.userEmail}>
      <ErrorBoundary>
        <LabelWizard authEnabled={auth.authEnabled} userId={auth.userId} />
      </ErrorBoundary>
    </AppShell>
  );
}
