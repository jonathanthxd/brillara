import { WelcomeForm } from "@/components/onboarding/WelcomeForm";
import { getVisitorSession } from "@/lib/server/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const session = await getVisitorSession();

  if (session) {
    redirect("/inicio");
  }

  return <WelcomeForm />;
}
