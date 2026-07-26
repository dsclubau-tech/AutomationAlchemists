# CP Bot by Automation Alchemists

CP Bot is a Manifest V3 Chrome extension for Australian eBay-to-Amazon dropship order fulfillment. It copies buyer addresses from eBay AU Seller Hub order pages and fills Amazon AU checkout/address forms. It does not place Amazon orders.

## Build

From the extension folder:

```bash
npm run build
```

That writes the loadable extension to:

```text
extension/dist
```

From the repo root you can also run:

```bash
npm run build:extension
```

## Load Unpacked

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click **Load unpacked**.
4. Select `extension/dist`.

## Login

The popup signs in with the same Supabase project as the return-label-generator app. Build the extension after `.env.local` contains:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
```

The extension stores its Supabase session in `chrome.storage.local`. If Supabase env vars are not present, CP Bot still copies/pastes locally but fulfillment logs are stored only in local extension storage.

## Workflow

1. Open an eBay AU Seller Hub order list at `https://www.ebay.com.au/sh/ord/*`.
2. Open an individual order details page, such as `https://www.ebay.com.au/mesh/ord/details?...`.
3. CP Bot appears as a draggable widget and reads the full Post to address from the order details page.
4. Click **Copy** on the detected order.
5. Open Amazon AU checkout or address pages.
6. Click **Paste eBay address** in the CP Bot widget.
7. Manually review the Amazon AU address form.
8. Manually place the Amazon order yourself.
9. Click **Mark ordered** and enter the Amazon order reference if available.

The Seller Hub all-orders list usually shows only the postcode, not the full street address. CP Bot therefore captures the complete buyer address from the order details page.

## Kill Switch

Open the CP Bot Chrome popup and enable **Disable extension automation** to pause all automation. While enabled, CP Bot does not scan eBay order details, copy addresses, paste into Amazon AU, auto-select Use this address, dismiss checkout prompts, or mark orders.

## Return Label App Link

After an order is copied or marked, the Amazon widget can open the return-label-generator app with:

```text
/?orderRef=<ebay-order-id>&itemName=<title>&quantity=<qty>
```

The existing converter reads those query parameters and pre-fills the eBay order reference, item name, and quantity fields.

## Supabase SQL

Run this SQL in Supabase:

```text
supabase/cp_bot_fulfillments.sql
```

It creates `public.cp_bot_fulfillments`, grants authenticated Data API access, and enables RLS so users can only manage their own rows.

## Permissions

The extension requests the following permissions in `manifest.json`. Each is required for the functionality described below and maps to the Chrome Web Store's permission justification field.

### Host Permissions

| Host | Justification |
|---|---|
| `*.ebay.com.au` | Content script injects on eBay AU Seller Hub order pages (`/sh/ord/`, `/mesh/ord/details`) to scrape buyer shipping addresses for cross-platform fulfilment. |
| `*.amazon.com.au` | Content script injects on Amazon AU checkout/address pages to autofill scraped addresses into the shipping form, and on the sign-in page (`/ap/signin`) to detect the active Amazon account. |
| `amazon-au-ebay-au-return-label-conv.vercel.app` | Content script bridges authentication between the hosted web application and the extension (AuthBridge handshake). The `webapp-bridge.js` and `inject.js` scripts relay Supabase session tokens so the extension can sync fulfillment data with the web app. |

> **Note:** `http://localhost:3000/*` is present in the source manifest for local development but is **automatically stripped** from production/publish builds by the build script (see `extension/scripts/build-extension.mjs`).

### Chrome API Permissions

| Permission | Justification |
|---|---|
| `storage` | Persists user settings (automation toggles, gift message options), cached order data, and Supabase auth session locally within the extension via `chrome.storage.local` and `chrome.storage.session`. |
| `tabs` | Opens eBay order detail pages in background tabs for batch scanning, and detects Amazon sign-out navigation to update the Amazon account status indicator in the popup. |
| `webNavigation` | Listens for `onBeforeNavigate` events on Amazon AU sign-out URLs (`/gp/flex/sign-out.html`) to detect when the user signs out of Amazon, updating the account status display in the popup and widget. |

## Security Notes

- The extension is AU-only: eBay AU and Amazon AU host permissions only.
- It uses DOM scraping and form filling, not eBay or Amazon APIs.
- It never stores source address screenshots.
- It never embeds the Supabase service-role key.
- It never clicks Amazon's final place-order button.
- The Auto Select "Use this address" setting only submits the address form. It does not click Place order, Buy now, or any final purchase button.
- It never bypasses CAPTCHA, 2FA, browser fingerprinting, rate limits, or account warnings.
- If eBay or Amazon shows a security challenge, CP Bot stops automation and asks you to complete that step manually.

