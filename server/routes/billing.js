/**
 * Billing routes: subscription management, portal access, plan info
 */

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");
const authMiddleware = require("../middleware/auth");
const { getStripe } = require("../lib/stripe-client");
const { getPlan, getAllPlans } = require("../lib/billing/plans");

const router = express.Router();

/**
 * GET /api/billing/plans
 * Public endpoint: list available plans without auth.
 * Returns plan info and Stripe price IDs if configured.
 */
router.get("/plans", (req, res) => {
  try {
    const plans = getAllPlans();
    // Filter out null priceIds to keep response clean
    const sanitized = plans.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      priceId: p.priceId,
      features: p.features,
    }));
    res.json({ plans: sanitized });
  } catch (err) {
    console.error("[billing/plans]", err.message);
    res.status(500).json({ message: "Failed to fetch plans" });
  }
});

/**
 * GET /api/billing/subscription
 * Auth required: fetch the current organization's subscription.
 */
router.get("/subscription", authMiddleware, async (req, res) => {
  try {
    const organizationId = req.user.organization_id || req.user.company_id;
    if (!organizationId) {
      return res.status(400).json({ message: "No organization found for user" });
    }

    const result = await db.query(
      `SELECT id, organization_id, stripe_customer_id, stripe_subscription_id,
              plan_id, status, current_period_end, cancel_at_period_end,
              created_at, updated_at
       FROM subscriptions
       WHERE organization_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [organizationId]
    );

    const subscription = result.rows[0] || null;
    res.json({ subscription });
  } catch (err) {
    console.error("[billing/subscription]", err.message);
    res.status(500).json({ message: "Failed to fetch subscription" });
  }
});

/**
 * POST /api/billing/checkout
 * Auth required: initiate Stripe Checkout for a given plan.
 * Body: { planId, successUrl?, cancelUrl? }
 */
router.post("/checkout", authMiddleware, async (req, res) => {
  try {
    const { planId, successUrl, cancelUrl } = req.body;
    const organizationId = req.user.organization_id || req.user.company_id;

    if (!organizationId) {
      return res.status(400).json({ message: "No organization found for user" });
    }

    if (!planId) {
      return res.status(400).json({ message: "planId is required" });
    }

    const plan = getPlan(planId);
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    if (!plan.priceId) {
      return res.status(400).json({
        message: `Plan ${planId} does not have a Stripe price ID configured`,
      });
    }

    const stripe = getStripe();

    // Fetch or create Stripe customer keyed to organization_id
    let subscription = await db.query(
      `SELECT stripe_customer_id FROM subscriptions WHERE organization_id = $1 LIMIT 1`,
      [organizationId]
    );

    let stripeCustomerId = subscription.rows[0]?.stripe_customer_id;

    if (!stripeCustomerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        metadata: {
          organizationId,
          createdAt: new Date().toISOString(),
        },
      });
      stripeCustomerId = customer.id;
    }

    // Create Checkout Session
    const finalSuccessUrl =
      successUrl || `${process.env.APP_BASE_URL || "http://localhost:3000"}/billing/success`;
    const finalCancelUrl =
      cancelUrl || `${process.env.APP_BASE_URL || "http://localhost:3000"}/billing/cancel`;

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        organizationId,
        planId,
      },
    });

    // Store or update subscription record with Stripe customer ID
    await db.query(
      `INSERT INTO subscriptions (id, organization_id, stripe_customer_id, plan_id, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (organization_id) DO UPDATE
       SET stripe_customer_id = $3
       WHERE subscriptions.organization_id = $2`,
      [uuidv4(), organizationId, stripeCustomerId, planId, "incomplete"]
    );

    res.json({ url: session.url });
  } catch (err) {
    console.error("[billing/checkout]", err.message);
    res.status(500).json({ message: "Failed to create checkout session" });
  }
});

/**
 * POST /api/billing/portal
 * Auth required: return Stripe Billing Portal URL for subscription management.
 */
router.post("/portal", authMiddleware, async (req, res) => {
  try {
    const organizationId = req.user.organization_id || req.user.company_id;
    if (!organizationId) {
      return res.status(400).json({ message: "No organization found for user" });
    }

    const result = await db.query(
      `SELECT stripe_customer_id FROM subscriptions WHERE organization_id = $1 LIMIT 1`,
      [organizationId]
    );

    const stripeCustomerId = result.rows[0]?.stripe_customer_id;
    if (!stripeCustomerId) {
      return res.status(404).json({ message: "No Stripe customer found for organization" });
    }

    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: process.env.APP_BASE_URL || "http://localhost:3000",
    });

    res.json({ url: portalSession.url });
  } catch (err) {
    console.error("[billing/portal]", err.message);
    res.status(500).json({ message: "Failed to create billing portal session" });
  }
});

module.exports = router;
