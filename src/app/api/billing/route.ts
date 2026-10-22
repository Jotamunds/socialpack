import { NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { getSubscription, PLANS } from "@/lib/subscription-store";

export async function GET() {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const subscription = await getSubscription(email);

  const res = NextResponse.json({
    subscription,
    plans: PLANS,
    remaining: Math.max(0, subscription.generationQuota - subscription.usedGenerations),
    packsCreatedCount: subscription.packsCreatedCount ?? subscription.usedGenerations,
  });

  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  return res;
}
