import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' })
  : null;

export type { Stripe };

export interface CreateCheckoutSessionParams {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession({
  priceId,
  customerId,
  customerEmail,
  metadata,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams): Promise<{ sessionId: string; url: string }> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    customer: customerId,
    customer_email: customerId ? undefined : customerEmail,
    metadata,
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  });

  return { sessionId: session.id, url: session.url || '' };
}

export interface CreateCustomerPortalSessionParams {
  customerId: string;
  returnUrl: string;
}

export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: CreateCustomerPortalSessionParams): Promise<{ url: string }> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return { url: session.url };
}

export interface CreateOneTimePaymentParams {
  amount: number;
  currency?: string;
  customerEmail?: string;
  description?: string;
  metadata?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
}

export async function createOneTimePayment({
  amount,
  currency = 'usd',
  customerEmail,
  description,
  metadata,
  successUrl,
  cancelUrl,
}: CreateOneTimePaymentParams): Promise<{ sessionId: string; url: string }> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          product_data: { name: description || 'CortexBuild Payment' },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    customer_email: customerEmail,
    metadata,
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return { sessionId: session.id, url: session.url || '' };
}

export async function getCustomer(customerId: string): Promise<Stripe.Customer | null> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      return null;
    }
    return customer;
  } catch {
    return null;
  }
}

export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch {
    return null;
  }
}

export async function cancelSubscription(
  subscriptionId: string,
  atPeriodEnd = true
): Promise<Stripe.Subscription | null> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  try {
    if (atPeriodEnd) {
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
    return await stripe.subscriptions.cancel(subscriptionId);
  } catch {
    return null;
  }
}

export async function createUsageRecord(
  subscriptionItemId: string,
  quantity: number,
  timestamp?: number
): Promise<Stripe.UsageRecord | null> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  try {
    return await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
      quantity,
      timestamp: timestamp || Math.floor(Date.now() / 1000),
      action: 'increment',
    });
  } catch {
    return null;
  }
}

export async function listPrices(): Promise<Stripe.Price[]> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const prices = await stripe.prices.list({
    active: true,
    limit: 100,
  });

  return prices.data;
}

export async function getProduct(productId: string): Promise<Stripe.Product | null> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  try {
    return await stripe.products.retrieve(productId);
  } catch {
    return null;
  }
}

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event | null {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return null;
  }
}

export { uuidv4 };
