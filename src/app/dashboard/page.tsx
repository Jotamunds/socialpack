import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getProfile } from "@/lib/profile-store";
import { getSessionEmail } from "@/lib/session";

export const instant = false;

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const email = await getSessionEmail();
  if (!email) {
    redirect("/login");
  }

  const profile = await getProfile(email);

  return <DashboardClient initialProfile={profile} userEmail={email} />;
}
