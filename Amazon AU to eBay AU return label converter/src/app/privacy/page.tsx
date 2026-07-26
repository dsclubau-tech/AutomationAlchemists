import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Automation Alchemists",
  description:
    "Privacy policy for the Return Label Converter and CP Bot Chrome extension by Automation Alchemists.",
};

export default function PrivacyPage() {
  const lastUpdated = "18 July 2026";

  return (
    <div className="min-h-screen bg-slate-50/50 px-4 py-12">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200/80 bg-white/70 p-8 shadow-sm backdrop-blur-md sm:p-10">
        {/* Header */}
        <header className="mb-10 border-b border-slate-200 pb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Automation Alchemists &mdash; Return Label Converter &amp; CP Bot
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Last updated: {lastUpdated}
          </p>
        </header>

        {/* 1 — Introduction */}
        <Section id="introduction" title="1. Introduction &amp; Scope">
          <p>
            This Privacy Policy explains how the{" "}
            <strong>Return Label Converter</strong> web application and the{" "}
            <strong>CP Bot Chrome extension</strong>{" "}
            (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;the Service&rdquo;)
            collect, use, store, and protect your data. The Service is developed
            and operated by <strong>Automation Alchemists</strong>.
          </p>
          <p>
            The Service comprises two products that share a single Supabase
            backend and user account system:
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Return Label Converter</strong> &mdash; A web application
              for creating premium, clean eBay AU return labels from Amazon AU
              return QR codes, barcodes, or printable labels.
            </li>
            <li>
              <strong>CP Bot (CopyPaste Bot)</strong> &mdash; A Manifest V3
              Chrome extension for Australian eBay-to-Amazon dropship order
              fulfilment. It copies buyer addresses from eBay AU Seller Hub and
              fills Amazon AU checkout forms.
            </li>
          </ul>
          <p>
            By using either product, you agree to the practices described in
            this policy.
          </p>
        </Section>

        {/* 2 — Data We Collect */}
        <Section id="data-collected" title="2. Data We Collect">
          <p>
            All data is associated with your authenticated user account.
            The following tables detail what each product collects.
          </p>

          {/* 2a — Return Converter */}
          <h3 className="mt-6 mb-3 text-sm font-extrabold tracking-tight text-slate-800">
            2a. Return Label Converter
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="pb-2 pr-4">Category</th>
                  <th className="pb-2 pr-4">Data Fields</th>
                  <th className="pb-2">Storage Location</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                <DataRow
                  category="Uploaded Images"
                  fields="Return label, QR code, or barcode images uploaded for conversion"
                  storage="Supabase storage bucket (label-uploads, per-user folder, private)"
                />
                <DataRow
                  category="Generated Labels"
                  fields="Converted/rendered label output images (PNG, JPG, or PDF)"
                  storage="Generated client-side; not stored server-side"
                />
                <DataRow
                  category="Label History"
                  fields="Template ID, item name, quantity, order reference, uploaded code image URL"
                  storage="Supabase database (label_history table, per-user, row-level security)"
                />
              </tbody>
            </table>
          </div>

          {/* 2b — CP Bot */}
          <h3 className="mt-8 mb-3 text-sm font-extrabold tracking-tight text-slate-800">
            2b. CP Bot Chrome Extension
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="pb-2 pr-4">Category</th>
                  <th className="pb-2 pr-4">Data Fields</th>
                  <th className="pb-2">Storage Location</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                <DataRow
                  category="Authentication"
                  fields="Email address, Supabase session tokens"
                  storage="Supabase Auth, browser cookies, Chrome extension storage"
                />
                <DataRow
                  category="eBay AU Order Data"
                  fields="Order IDs, buyer names, street addresses (street lines, suburb, state, postcode, country), phone numbers (when present on the order), item titles, quantities, source URLs"
                  storage="Chrome session storage, Supabase cloud clipboard (auto-expires after 5&nbsp;minutes)"
                />
                <DataRow
                  category="Amazon AU Data"
                  fields="Order references, ASINs, Amazon account email"
                  storage="Supabase fulfillment logs"
                />
                <DataRow
                  category="Fulfillment Logs"
                  fields="eBay order ID, Amazon order reference, buyer name, postcode, item title, quantity, fulfilment status, address validation warnings, Amazon account"
                  storage="Supabase database (cp_bot_fulfillments table, per-user, row-level security)"
                />
                <DataRow
                  category="Activity &amp; Event Logs"
                  fields="Event type (e.g.&nbsp;paste success, checkout error, scan), eBay order ID, extension version, event detail metadata"
                  storage="Supabase database (cp_bot_activity_log table, per-user, row-level security)"
                />
                <DataRow
                  category="Gift Message Settings"
                  fields="Gift enabled flag, message text, sender name"
                  storage="Chrome local storage, Supabase settings (cp_bot_settings table)"
                />
                <DataRow
                  category="User Settings"
                  fields="Automation toggles (enabled, auto-select address, auto-mark ordered)"
                  storage="Chrome local storage, Supabase settings (cp_bot_settings table)"
                />
              </tbody>
            </table>
          </div>
        </Section>

        {/* 3 — How We Use Your Data */}
        <Section id="how-we-use" title="3. How We Use Your Data">
          <h3 className="mb-2 text-sm font-extrabold text-slate-700">
            Return Label Converter
          </h3>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Label conversion:</strong> Processing uploaded return
              label images (QR codes, barcodes, printable labels) and rendering
              clean, eBay-suitable return labels for download.
            </li>
            <li>
              <strong>History:</strong> Recording which labels you have
              converted so you can re-access or re-download them.
            </li>
          </ul>

          <h3 className="mt-4 mb-2 text-sm font-extrabold text-slate-700">
            CP Bot
          </h3>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Order fulfilment:</strong> Copying buyer shipping
              addresses from eBay AU order pages and filling them into Amazon AU
              checkout/address forms.
            </li>
            <li>
              <strong>Cross-device sync:</strong> Temporarily storing addresses
              in a cloud clipboard so you can copy on one device and paste on
              another (entries auto-expire after 5&nbsp;minutes).
            </li>
            <li>
              <strong>Fulfillment tracking:</strong> Logging which eBay orders
              have been fulfilled and their corresponding Amazon order
              references.
            </li>
            <li>
              <strong>Activity monitoring:</strong> Recording automation events
              (successes, failures, errors) so you can review your fulfilment
              history and diagnose issues.
            </li>
            <li>
              <strong>Authentication:</strong> Verifying your identity and
              securing access to your data.
            </li>
          </ul>
        </Section>

        {/* 4 — Data Storage & Security */}
        <Section id="storage-security" title="4. Data Storage &amp; Security">
          <ul className="ml-4 list-disc space-y-1">
            <li>
              Server-side data is stored in{" "}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline transition hover:text-blue-600"
              >
                Supabase
              </a>{" "}
              (hosted on AWS infrastructure). All data is transmitted over HTTPS
              (TLS encryption in transit).
            </li>
            <li>
              <strong>Row Level Security (RLS)</strong> is enforced on every
              database table — each user can only read, update, or delete their
              own rows.
            </li>
            <li>
              The extension never stores or transmits the Supabase service-role
              key. Only the public anon key is used, scoped by RLS policies.
            </li>
            <li>
              Local extension data (settings, cached orders) is stored in{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
                chrome.storage.local
              </code>{" "}
              and{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
                chrome.storage.session
              </code>
              , accessible only to the extension.
            </li>
            <li>
              Uploaded label images are stored in a private Supabase storage
              bucket with per-user folder isolation enforced by RLS.
            </li>
          </ul>
        </Section>

        {/* 5 — Data Retention & Deletion */}
        <Section
          id="retention-deletion"
          title="5. Data Retention &amp; Deletion"
        >
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Cloud clipboard entries</strong> auto-expire and are
              deleted after 5&nbsp;minutes.
            </li>
            <li>
              <strong>Fulfillment logs and activity logs</strong> are retained
              indefinitely for your records. You can request deletion at any
              time (see Section&nbsp;8).
            </li>
            <li>
              <strong>Label history and uploaded images</strong> are retained
              until you delete them from your account or request account
              deletion.
            </li>
            <li>
              <strong>Account deletion:</strong> If you delete your Supabase
              account, all associated data (fulfillments, activity logs,
              settings, label history, uploaded images) is automatically
              cascade-deleted.
            </li>
          </ul>
        </Section>

        {/* 6 — Third-Party Services */}
        <Section id="third-party" title="6. Third-Party Services">
          <p>The Service integrates with the following third-party providers:</p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>
              <strong>Supabase</strong> — Authentication, database, and file
              storage. See{" "}
              <a
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline transition hover:text-blue-600"
              >
                Supabase Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong>Vercel</strong> — Web application hosting, analytics, and
              performance monitoring (via Vercel Analytics and SpeedInsights).
              See{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline transition hover:text-blue-600"
              >
                Vercel Privacy Policy
              </a>
              .
            </li>
          </ul>
          <p className="mt-2">
            We do not sell, trade, or share your data with any other third
            parties.
          </p>
        </Section>

        {/* 7 — Chrome Extension Permissions */}
        <Section
          id="extension-permissions"
          title="7. Chrome Extension Permissions"
        >
          <p>
            The CP Bot extension requests the following permissions. Each is
            required for the functionality described:
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="pb-2 pr-4">Permission</th>
                  <th className="pb-2">Purpose</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                <PermRow
                  perm="ebay.com.au"
                  desc="Inject content scripts on eBay AU Seller Hub order pages to read buyer shipping addresses for cross-platform fulfillment."
                />
                <PermRow
                  perm="amazon.com.au"
                  desc="Inject content scripts on Amazon AU checkout and address pages to autofill scraped buyer addresses into shipping forms, and detect the active Amazon account."
                />
                <PermRow
                  perm="Web app domain"
                  desc="Bridge authentication between the hosted web application and the extension via the AuthBridge handshake."
                />
                <PermRow
                  perm="activeTab"
                  desc="Required for programmatic script injection on the currently active tab during order scanning."
                />
                <PermRow
                  perm="storage"
                  desc="Persist user settings, automation state, and cached order data locally within the extension."
                />
                <PermRow
                  perm="scripting"
                  desc="Programmatically inject content scripts into eBay order detail tabs during batch address scanning."
                />
                <PermRow
                  perm="tabs"
                  desc="Open eBay order detail pages in background tabs for batch scanning and detect Amazon sign-out navigation."
                />
                <PermRow
                  perm="webNavigation"
                  desc="Detect Amazon AU sign-out navigation events to update the Amazon account status indicator."
                />
              </tbody>
            </table>
          </div>
        </Section>

        {/* 8 — Your Rights */}
        <Section id="your-rights" title="8. Your Rights">
          <p>You have the right to:</p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>
              <strong>Access</strong> all data associated with your account via
              the CP Bot Admin dashboard and your Account page.
            </li>
            <li>
              <strong>Delete</strong> individual fulfillment records, activity
              logs, label history entries, and uploaded images at any time.
            </li>
            <li>
              <strong>Export</strong> your data by contacting us (see
              Section&nbsp;10).
            </li>
            <li>
              <strong>Delete your account</strong> entirely, which will
              cascade-delete all associated data across both products.
            </li>
            <li>
              <strong>Uninstall</strong> the CP Bot extension at any time. Local
              extension storage is automatically cleared on uninstall.
              Server-side data remains until account deletion.
            </li>
          </ul>
        </Section>

        {/* 9 — Changes to This Policy */}
        <Section id="changes" title="9. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. Changes will be
            posted on this page with an updated &ldquo;Last updated&rdquo; date.
            Continued use of the Service after changes constitutes acceptance of
            the revised policy.
          </p>
        </Section>

        {/* 10 — Contact */}
        <Section id="contact" title="10. Contact">
          <p>
            If you have questions about this Privacy Policy or want to exercise
            your data rights, please contact us at:
          </p>
          <p className="mt-2 font-semibold text-slate-700">
            dsclub.au@gmail.com
          </p>
        </Section>

        {/* Footer */}
        <footer className="mt-10 border-t border-slate-200 pt-6 text-center flex flex-col items-center gap-3">
          <Link
            href="/"
            className="text-xs font-bold text-blue-500 underline transition hover:text-blue-600"
          >
            &larr; Back to Return Label Converter
          </Link>
          <Link
            href="/cp-bot"
            className="text-xs font-bold text-blue-500 underline transition hover:text-blue-600"
          >
            &larr; Back to CP Bot
          </Link>
        </footer>
      </article>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper components                                                 */
/* ------------------------------------------------------------------ */

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-8">
      <h2 className="mb-3 text-lg font-extrabold tracking-tight text-slate-800">
        {title}
      </h2>
      <div className="space-y-2 text-sm leading-relaxed text-slate-600">
        {children}
      </div>
    </section>
  );
}

function DataRow({
  category,
  fields,
  storage,
}: {
  category: string;
  fields: string;
  storage: string;
}) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-2 pr-4 font-semibold text-slate-700 align-top">
        {category}
      </td>
      <td
        className="py-2 pr-4 align-top"
        dangerouslySetInnerHTML={{ __html: fields }}
      />
      <td
        className="py-2 align-top"
        dangerouslySetInnerHTML={{ __html: storage }}
      />
    </tr>
  );
}

function PermRow({ perm, desc }: { perm: string; desc: string }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-2 pr-4 font-semibold text-slate-700 align-top whitespace-nowrap">
        {perm}
      </td>
      <td className="py-2 align-top">{desc}</td>
    </tr>
  );
}
