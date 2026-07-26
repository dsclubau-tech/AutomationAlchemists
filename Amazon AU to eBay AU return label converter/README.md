# Return Label Generator

A Next.js app for creating eBay-suitable AU return labels from a cropped return QR code, barcode, or printable carrier label image.

The current MVP keeps image processing in the browser by default. Supabase auth and label history are optional and activate only when environment variables are configured.

## Stack

- Next.js App Router with TypeScript
- Tailwind CSS
- `react-easy-crop` for screenshot cropping
- `html-to-image` for PNG/JPG export
- `@react-pdf/renderer` for PDF export
- Optional Supabase email/password auth and label history

## Local Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase Setup

Supabase is optional. Without env vars, the app skips auth redirects and runs locally.

To enable registration, login, and label history:

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Set:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The app also accepts `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` if you use Supabase's newer key names.

In Supabase Auth, keep the Email provider enabled and allow email/password signups. Users register at `/register`, then sign in at `/login`. If email confirmations are enabled in Supabase, users must confirm their email before logging in.

In Supabase Auth URL Configuration, set the Site URL and redirect URL for each environment:

```text
http://localhost:3000/auth/confirm
https://your-vercel-domain.vercel.app/auth/confirm
```

For a private MVP, create the first user from `/register` after env vars are configured, or add the user directly in Supabase Dashboard under Authentication > Users.

You can also create the first user from the terminal with the service-role key in `.env.local`:

```powershell
$env:BOOTSTRAP_USER_EMAIL="owner@example.com"
$env:BOOTSTRAP_USER_PASSWORD="replace-with-a-strong-password"
npm run supabase:create-user
```

Label history stores only metadata plus a SHA-256 hash of the cropped image data URL. It does not upload label images to Supabase Storage in this MVP.

## Workflow

1. Choose the carrier return method.
2. Upload the source screenshot.
3. Crop the QR, barcode, or printable label. The Australia Post printable-label template asks for both the mailing label and the return authorisation barcode.
4. Enter the item details.
5. Export the clean label as PNG, JPG, or PDF, or print the preview directly.

The generated label preview intentionally excludes source marketplace branding, source deadlines, and source order metadata.

## CP Bot Chrome Extension

This repo now includes `extension/`, a Manifest V3 Chrome extension called **CP Bot by Automation Alchemists**. It copies eBay AU Seller Hub buyer addresses into Amazon AU checkout/address forms, then logs fulfillment metadata to Supabase when the user is signed in.

Build it from the repo root:

```bash
npm run build:extension
```

Or from the extension folder:

```bash
cd extension
npm run build
```

Load `extension/dist` through `chrome://extensions` > Developer mode > Load unpacked.

For Supabase logging, run `supabase/cp_bot_fulfillments.sql` in the Supabase SQL editor. CP Bot uses the same public Supabase URL/anon key and the same user account as this web app. The extension never uses the service-role key and never automates the final Amazon place-order action.
