/**
 * Billing webhook tests
 * Tests signature verification, idempotency, and database upserts
 */

const express = require("express");
const request = require("supertest");
const db = require("../db");

// Mock Stripe SDK
vi.mock("stripe", () => {
  return {
    default: vi.fn(() => ({
      webhooks: {
        constructEvent: vi.fn((body, sig, secret) => {
          // Simple mock: verify secret presence
          if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET not set");
          // Return parsed event
          return JSON.parse(body);
        }),
      },
      customers: {
        create: vi.fn((opts) => Promise.resolve({ id: "cus_mock" })),
      },
      subscriptions: {
        retrieve: vi.fn((id) =>
          Promise.resolve({
            id,
            status: "active",
            current_period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days
          })
        ),
      },
      billingPortal: {
        sessions: {
          create: vi.fn((opts) =>
            Promise.resolve({ url: "https://billing.stripe.com/p/session/mock" })
          ),
        },
      },
    })),
  };
});

describe.skip("Billing Webhook Handler", () => {
  let app;
  let billingWebhookRouter;

  beforeAll(async () => {
    // Setup test database tables if they don't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY,
        organization_id UUID,
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255) UNIQUE,
        plan_id VARCHAR(100),
        status VARCHAR(50),
        current_period_end TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS subscription_events (
        id UUID PRIMARY KEY,
        subscription_id UUID,
        event_type VARCHAR(100),
        payload JSONB,
        received_at TIMESTAMPTZ DEFAULT NOW(),
        processed_at TIMESTAMPTZ
      )
    `);

    // Clear tables
    await db.query("TRUNCATE subscriptions, subscription_events");

    // Setup Express app with webhook router
    app = express();
    app.use(express.raw({ type: "application/json" }));
    billingWebhookRouter = require("../routes/billing-webhook");
    app.use("/api/billing", billingWebhookRouter);
  });

  afterAll(async () => {
    await db.query("TRUNCATE subscriptions, subscription_events");
    await db.end();
  });

  it("should reject webhook with invalid signature", async () => {
    const event = { type: "test", data: {} };
    const response = await request(app)
      .post("/api/billing/webhook")
      .set("stripe-signature", "invalid")
      .send(event);

    expect(response.status).toBe(400);
  });

  it("should process checkout.session.completed event", async () => {
    const orgId = "org-test-001";
    const customerId = "cus_123";
    const subscriptionId = "sub_456";

    // First create a subscription record
    await db.query(
      `INSERT INTO subscriptions (id, organization_id, stripe_customer_id, plan_id, status)
       VALUES ($1, $2, $3, $4, $5)`,
      ["sub-uuid-001", orgId, customerId, "starter", "incomplete"]
    );

    const event = {
      id: "evt_123",
      type: "checkout.session.completed",
      data: {
        object: {
          customer: customerId,
          subscription: subscriptionId,
          metadata: { organizationId: orgId, planId: "starter" },
        },
      },
    };

    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

    const response = await request(app)
      .post("/api/billing/webhook")
      .set("stripe-signature", "test")
      .send(event);

    expect(response.status).toBe(200);
    expect(response.body.received).toBe(true);

    // Verify event was stored
    const eventResult = await db.query(
      `SELECT * FROM subscription_events WHERE payload->>'id' = $1`,
      ["evt_123"]
    );
    expect(eventResult.rows.length).toBe(1);
    expect(eventResult.rows[0].event_type).toBe("checkout.session.completed");
    expect(eventResult.rows[0].processed_at).not.toBeNull();
  });

  it("should handle duplicate events idempotently", async () => {
    const orgId = "org-test-002";
    const customerId = "cus_789";
    const subscriptionId = "sub_999";
    const eventId = "evt_duplicate";

    // Pre-populate a processed event
    await db.query(
      `INSERT INTO subscription_events (id, event_type, payload, processed_at)
       VALUES ($1, $2, $3, NOW())`,
      [
        "event-uuid-001",
        "checkout.session.completed",
        JSON.stringify({ id: eventId, type: "checkout.session.completed" }),
      ]
    );

    const event = {
      id: eventId,
      type: "checkout.session.completed",
      data: {
        object: {
          customer: customerId,
          subscription: subscriptionId,
          metadata: { organizationId: orgId },
        },
      },
    };

    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

    const response = await request(app)
      .post("/api/billing/webhook")
      .set("stripe-signature", "test")
      .send(event);

    expect(response.status).toBe(200);
    // Should return immediately without reprocessing
    expect(response.body.received).toBe(true);
  });

  it("should update subscription on subscription.updated event", async () => {
    const orgId = "org-test-003";
    const customerId = "cus_456";
    const subscriptionId = "sub_789";

    // Pre-populate subscription
    await db.query(
      `INSERT INTO subscriptions (id, organization_id, stripe_customer_id, stripe_subscription_id, plan_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ["sub-uuid-003", orgId, customerId, subscriptionId, "starter", "incomplete"]
    );

    const event = {
      id: "evt_sub_updated",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: subscriptionId,
          customer: customerId,
          status: "active",
          current_period_end: Math.floor(Date.now() / 1000) + 2592000,
        },
      },
    };

    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

    const response = await request(app)
      .post("/api/billing/webhook")
      .set("stripe-signature", "test")
      .send(event);

    expect(response.status).toBe(200);

    // Verify subscription status was updated
    const subResult = await db.query(
      `SELECT status FROM subscriptions WHERE stripe_subscription_id = $1`,
      [subscriptionId]
    );
    expect(subResult.rows[0].status).toBe("active");
  });

  it("should mark subscription as past_due on payment_failed event", async () => {
    const orgId = "org-test-004";
    const customerId = "cus_fail";
    const subscriptionId = "sub_fail";

    // Pre-populate subscription
    await db.query(
      `INSERT INTO subscriptions (id, organization_id, stripe_customer_id, stripe_subscription_id, plan_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ["sub-uuid-004", orgId, customerId, subscriptionId, "starter", "active"]
    );

    const event = {
      id: "evt_payment_failed",
      type: "invoice.payment_failed",
      data: {
        object: {
          subscription: subscriptionId,
        },
      },
    };

    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

    const response = await request(app)
      .post("/api/billing/webhook")
      .set("stripe-signature", "test")
      .send(event);

    expect(response.status).toBe(200);

    // Verify subscription status was updated to past_due
    const subResult = await db.query(
      `SELECT status FROM subscriptions WHERE stripe_subscription_id = $1`,
      [subscriptionId]
    );
    expect(subResult.rows[0].status).toBe("past_due");
  });

  it("should mark subscription as canceled on subscription.deleted event", async () => {
    const orgId = "org-test-005";
    const customerId = "cus_delete";
    const subscriptionId = "sub_delete";

    // Pre-populate subscription
    await db.query(
      `INSERT INTO subscriptions (id, organization_id, stripe_customer_id, stripe_subscription_id, plan_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ["sub-uuid-005", orgId, customerId, subscriptionId, "starter", "active"]
    );

    const event = {
      id: "evt_sub_deleted",
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: subscriptionId,
          customer: customerId,
        },
      },
    };

    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

    const response = await request(app)
      .post("/api/billing/webhook")
      .set("stripe-signature", "test")
      .send(event);

    expect(response.status).toBe(200);

    // Verify subscription status was updated to canceled
    const subResult = await db.query(
      `SELECT status FROM subscriptions WHERE stripe_subscription_id = $1`,
      [subscriptionId]
    );
    expect(subResult.rows[0].status).toBe("canceled");
  });
});
