# Billing Setup

Requo uses two payment providers:

- **PayMongo** for QRPh payments (Philippines, PHP)
- **Lemon Squeezy** for card/global subscriptions (international, USD)

Both providers are optional. The app functions normally on the free plan when
billing is not configured — features requiring a paid plan show upgrade prompts
but the checkout action returns a "not configured" message.

---

## 1. Database Migration

Run the billing migration to create the required tables:

```bash
npm run db:migrate
```

This creates three tables:

| Table | Purpose |
|---|---|
| `workspace_subscriptions` | One row per workspace — tracks plan, status, provider, billing period |
| `billing_events` | Idempotent webhook event log (prevents double-processing) |
| `payment_attempts` | Audit trail for every payment attempt |

---

## 2. PayMongo Setup (QRPh)

### 2a. Create a PayMongo Account

1. Go to [paymongo.com](https://www.paymongo.com/) and sign up.
2. Complete business verification (required for live mode; test mode works immediately).

### 2b. Get API Keys

1. Go to **Dashboard → Developers → API Keys**.
2. Copy the **Secret Key** and **Public Key**.
   - Test keys start with `sk_test_` / `pk_test_`.
   - Live keys start with `sk_live_` / `pk_live_`.
3. Add to your `.env`:

```env
PAYMONGO_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxx
PAYMONGO_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2c. Configure Webhook

1. Go to **Dashboard → Developers → Webhooks**.
2. Click **Create Webhook**.
3. Set the webhook URL:
   - **Local (with ngrok):** `https://<your-ngrok-url>/api/billing/paymongo/webhook`
   - **Production:** `https://yourdomain.com/api/billing/paymongo/webhook`
4. Select these events:
   - `payment.paid`
   - `payment.failed`
   - `payment.expired` (if available)
5. After creation, copy the **Webhook Secret** (starts with `whsk_`).
6. Add to your `.env`:

```env
PAYMONGO_WEBHOOK_SECRET=whsk_xxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2d. Test the QRPh Flow

1. Start the app: `npm run dev`
2. Log in and go to a workspace overview or settings page.
3. Click **Upgrade to Pro**.
4. Select **QR Ph** as payment method.
5. Click **Generate QR code**.
6. In test mode, the QR code will render but you cannot scan it with a real banking app.
7. To simulate a successful payment, use the PayMongo test tools or send a test webhook event via their dashboard.

### PayMongo Test Webhook Simulation

PayMongo doesn't have a built-in webhook test button for QRPh, but you can:

1. Create a payment intent via the API or dashboard.
2. Use the PayMongo **test card number** flows for other payment methods to verify your webhook processing.
3. Or use a tool like `curl` to POST a simulated webhook event to your local endpoint:

```bash
curl -X POST http://localhost:3000/api/billing/paymongo/webhook \
  -H "Content-Type: application/json" \
  -H "paymongo-signature: t=1234567890,li=test_signature" \
  -d '{
    "data": {
      "id": "evt_test_123",
      "attributes": {
        "type": "payment.paid",
        "data": {
          "id": "pay_test_123",
          "attributes": {
            "amount": 29900,
            "currency": "PHP",
            "status": "paid",
            "metadata": {
              "workspace_id": "YOUR_WORKSPACE_ID",
              "plan": "pro"
            }
          }
        }
      }
    }
  }'
```

> **Note:** The signature check will fail with a fake signature. For local testing,
> you can temporarily skip verification or use ngrok to receive real test webhooks.

---

## 3. Lemon Squeezy Setup (Cards)

### 3a. Create a Lemon Squeezy Account

1. Go to [lemonsqueezy.com](https://www.lemonsqueezy.com/) and sign up.
2. Complete store setup (name, currency, etc.).

### 3b. Get API Key and Store ID

1. Go to **Settings → API** ([app.lemonsqueezy.com/settings/api](https://app.lemonsqueezy.com/settings/api)).
2. Click **Create API Key** with a descriptive name (e.g., "Requo Production").
3. Copy the API key.
4. Your **Store ID** is in the URL when viewing your store: `https://app.lemonsqueezy.com/stores/<STORE_ID>`.
5. Add to your `.env`:

```env
LEMONSQUEEZY_API_KEY=eyJ0eXAiOiJKV1QiLCJhb...
LEMONSQUEEZY_STORE_ID=12345
```

### 3c. Create Subscription Products

You need to create two products with **monthly recurring** variants:

#### Pro Plan ($4.99/mo)

1. Go to **Store → Products** and click **New Product**.
2. Set:
   - **Name:** `Requo Pro`
   - **Pricing:** `$4.99` per month (recurring subscription)
   - **Description:** `Unlimited inquiries & quotes, AI assistant, knowledge base, multiple businesses`
3. Save the product.
4. Click on the product to view its variants.
5. Copy the **Variant ID** from the URL: `https://app.lemonsqueezy.com/products/<product_id>/variants/<VARIANT_ID>`.

#### Business Plan ($9.99/mo)

1. Click **New Product** again.
2. Set:
   - **Name:** `Requo Business`
   - **Pricing:** `$9.99` per month (recurring subscription)
   - **Description:** `Everything in Pro plus team members, roles, and priority support`
3. Save and copy the Variant ID.

Add both to your `.env`:

```env
LEMONSQUEEZY_PRO_VARIANT_ID=123456
LEMONSQUEEZY_BUSINESS_VARIANT_ID=789012
```

### 3d. Configure Webhook

1. Go to **Settings → Webhooks** ([app.lemonsqueezy.com/settings/webhooks](https://app.lemonsqueezy.com/settings/webhooks)).
2. Click **Add Webhook**.
3. Set the webhook URL:
   - **Local (with ngrok):** `https://<your-ngrok-url>/api/billing/lemonsqueezy/webhook`
   - **Production:** `https://yourdomain.com/api/billing/lemonsqueezy/webhook`
4. Set a **Signing Secret** (generate a strong random string, e.g., `openssl rand -hex 32`).
5. Select these events:
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_expired`
   - `subscription_payment_success`
   - `subscription_payment_failed`
6. Save the webhook.
7. Add the signing secret to your `.env`:

```env
LEMONSQUEEZY_WEBHOOK_SECRET=your_random_signing_secret_here
```

### 3e. Test the Card Flow

1. Start the app: `npm run dev`
2. Log in and go to a workspace overview or settings page.
3. Click **Upgrade to Pro**.
4. Select **Card** as payment method.
5. Click **Continue to checkout**.
6. You'll be redirected to the Lemon Squeezy hosted checkout page.
7. Use the Lemon Squeezy **test card number:**

| Field | Value |
|---|---|
| Card number | `4242 4242 4242 4242` |
| Expiry | Any future date (e.g., `12/30`) |
| CVC | Any 3 digits (e.g., `123`) |
| Name | Any name |
| Email | Your email |

8. Complete the payment.
9. The webhook fires → your workspace is upgraded to Pro.
10. Verify: go back to the workspace overview — the billing card should show **Active** with a renewal date.

### Lemon Squeezy Test Mode

Lemon Squeezy uses test mode automatically when your store is in test mode:

1. Go to **Store Settings**.
2. Ensure **Test Mode** is enabled (toggle at the top of the dashboard).
3. All API calls and webhooks use test data — no real charges.
4. To switch to live, toggle test mode off and use production API keys.

---

## 4. Local Development with ngrok

Both providers require a publicly accessible URL for webhooks. For local development:

1. Install ngrok: [ngrok.com/download](https://ngrok.com/download)
2. Start your app: `npm run dev`
3. Start ngrok:

```bash
ngrok http 3000
```

4. Copy the `https://xxxx.ngrok-free.app` URL.
5. Update webhook URLs in both provider dashboards to use this ngrok URL.
6. **Important:** Update your `.env` to set `BETTER_AUTH_URL` to the ngrok URL too, since it's used for return URLs:

```env
BETTER_AUTH_URL=https://xxxx.ngrok-free.app
```

> **Tip:** ngrok free tier generates a new URL each time. Use a paid plan for a
> stable subdomain, or use a tool like [localtunnel](https://theboroer.github.io/localtunnel-www/)
> as an alternative.

---

## 5. Environment Variable Reference

```env
# PayMongo (QRPh for Philippines)
PAYMONGO_SECRET_KEY=sk_test_...        # Secret key from PayMongo dashboard
PAYMONGO_PUBLIC_KEY=pk_test_...        # Public key from PayMongo dashboard
PAYMONGO_WEBHOOK_SECRET=whsk_...       # Webhook signing secret

# Lemon Squeezy (cards for international)
LEMONSQUEEZY_API_KEY=eyJ0eXAi...       # API key from LS settings
LEMONSQUEEZY_STORE_ID=12345            # Store ID from LS dashboard URL
LEMONSQUEEZY_WEBHOOK_SECRET=...        # Your custom webhook signing secret
LEMONSQUEEZY_PRO_VARIANT_ID=123456     # Pro plan variant ID
LEMONSQUEEZY_BUSINESS_VARIANT_ID=789012 # Business plan variant ID
```

---

## 6. Pricing

| Plan | PHP (QRPh) | USD (Card) |
|---|---|---|
| Free | ₱0 | $0 |
| Pro | ₱299/mo | $4.99/mo |
| Business | ₱599/mo | $9.99/mo |

Pricing is defined in `lib/billing/plans.ts`. The marketing pricing page shows
USD by default (statically rendered). The in-app checkout dialog detects the
user's region from request headers and defaults to the appropriate currency.

---

## 7. Troubleshooting

### Webhook not firing

- Verify the webhook URL is correct and publicly accessible.
- Check the provider dashboard for failed delivery attempts.
- Ensure your app is running and the route handler exists.

### Signature verification failing

- Ensure the webhook secret in `.env` matches exactly what's in the provider dashboard.
- For PayMongo, the secret starts with `whsk_`.
- For Lemon Squeezy, it's the custom secret you set when creating the webhook.

### Workspace not upgrading after payment

- Check server logs for webhook processing errors.
- Verify the `workspace_id` in the payment metadata matches an existing workspace.
- Check the `billing_events` table for the event record and whether `processed_at` is set.
- Check the `workspace_subscriptions` table for the subscription status.

### "Not configured" error on checkout

- Ensure the relevant provider env vars are set and non-empty.
- Restart the dev server after changing `.env`.
