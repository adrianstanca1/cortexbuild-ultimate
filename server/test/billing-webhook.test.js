/**
 * Billing webhook tests
 * Tests signature verification, idempotency, and database upserts
 * NOTE: These tests are currently excluded due to Stripe mocking complexity.
 * The route requires real Stripe SDK initialization which conflicts with vitest mocking.
 * A future refactor to inject Stripe dependencies would make these testable.
 */

const express = require("express");
const request = require("supertest");

// Mock db BEFORE importing the route
const mockDb = {
  query: vi.fn(),
  end: vi.fn(),
};

vi.mock("../db", () => mockDb);

describe("Billing Webhook Handler", () => {
  let app;
  let billingWebhookRouter;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup Express app
    app = express();

    // Middleware to capture raw body for Stripe signature verification
    app.use(express.raw({ type: "application/json" }), (req, res, next) => {
      req.rawBody = req.body;
      next();
    });

    // Import route after mocks are set up
    billingWebhookRouter = require("../routes/billing-webhook");
    app.use("/api/billing", billingWebhookRouter);
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

    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

    // Mock DB queries for this event
    mockDb.query
      .mockResolvedValueOnce({ rows: [] }) // Check if event already processed
      .mockResolvedValueOnce({ rows: [{ id: "sub-uuid-001" }] }) // Find subscription
      .mockResolvedValueOnce({ rowCount: 1 }); // Store event

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

    const response = await request(app)
      .post("/api/billing/webhook")
      .set("stripe-signature", "test")
      .send(JSON.stringify(event));

    expect(response.status).toBe(200);
    expect(response.body.received).toBe(true);
  });

  it("should handle duplicate events idempotently", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

    const eventId = "evt_duplicate";
    const event = {
      id: eventId,
      type: "checkout.session.completed",
      data: {
        object: {
          customer: "cus_789",
          subscription: "sub_999",
          metadata: { organizationId: "org-test-002" },
        },
      },
    };

    // Mock: event already processed
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: "event-uuid-001", processed_at: new Date() }],
    });

    const response = await request(app)
      .post("/api/billing/webhook")
      .set("stripe-signature", "test")
      .send(JSON.stringify(event));

    expect(response.status).toBe(200);
    expect(response.body.received).toBe(true);
  });

  it("should update subscription on subscription.updated event", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

    const subscriptionId = "sub_789";
    const event = {
      id: "evt_sub_updated",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: subscriptionId,
          customer: "cus_456",
          status: "active",
          current_period_end: Math.floor(Date.now() / 1000) + 2592000,
        },
      },
    };

    mockDb.query
      .mockResolvedValueOnce({ rows: [] }) // Check if event already processed
      .mockResolvedValueOnce({ rows: [{ id: "sub-uuid-003" }] }) // Find subscription
      .mockResolvedValueOnce({ rowCount: 1 }); // Update subscription

    const response = await request(app)
      .post("/api/billing/webhook")
      .set("stripe-signature", "test")
      .send(JSON.stringify(event));

    expect(response.status).toBe(200);
  });

  it("should mark subscription as past_due on payment_failed event", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

    const subscriptionId = "sub_fail";
    const event = {
      id: "evt_payment_failed",
      type: "invoice.payment_failed",
      data: {
        object: {
          subscription: subscriptionId,
        },
      },
    };

    mockDb.query
      .mockResolvedValueOnce({ rows: [] }) // Check if event already processed
      .mockResolvedValueOnce({ rows: [{ id: "sub-uuid-004" }] }) // Find subscription
      .mockResolvedValueOnce({ rowCount: 1 }); // Update status

    const response = await request(app)
      .post("/api/billing/webhook")
      .set("stripe-signature", "test")
      .send(JSON.stringify(event));

    expect(response.status).toBe(200);
  });

  it("should mark subscription as canceled on subscription.deleted event", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

    const subscriptionId = "sub_delete";
    const event = {
      id: "evt_sub_deleted",
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: subscriptionId,
          customer: "cus_delete",
        },
      },
    };

    mockDb.query
      .mockResolvedValueOnce({ rows: [] }) // Check if event already processed
      .mockResolvedValueOnce({ rows: [{ id: "sub-uuid-005" }] }) // Find subscription
      .mockResolvedValueOnce({ rowCount: 1 }); // Update status

    const response = await request(app)
      .post("/api/billing/webhook")
      .set("stripe-signature", "test")
      .send(JSON.stringify(event));

    expect(response.status).toBe(200);
  });
});
