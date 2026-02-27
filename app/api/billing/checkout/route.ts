import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// POST /api/billing/checkout — create a Stripe Checkout session for Pro upgrade
export async function POST() {
  const session = await requireAuth();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, stripeCustomerId: true, plan: true },
  });

  if (!user) return NextResponse.json({ error: { code: "not_found" } }, { status: 404 });
  if (user.plan !== "free") {
    return NextResponse.json(
      { error: { code: "already_subscribed", message: "Already on Pro" } },
      { status: 400 }
    );
  }

  // Create or reuse the Stripe customer record
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await db.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?cancelled=true`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { userId: session.user.id },
    },
  });

  return NextResponse.json({ data: { url: checkoutSession.url } });
}
