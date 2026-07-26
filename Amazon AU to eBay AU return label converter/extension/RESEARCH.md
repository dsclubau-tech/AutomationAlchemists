# PasteMe Research Notes

Date reviewed: 2026-06-21.

## Sources

- Chrome Web Store listing: https://chromewebstore.google.com/detail/pasteme/mldpfbeejkkbecmfingchdolpfpglnog
- YouTube oEmbed metadata for the supplied video: https://www.youtube.com/watch?v=0XYrGsaOleY
- Trackerbot public site: https://www.trackerbot.me/trackerbot-amazon

## Publicly visible PasteMe behavior

The Chrome Web Store listing describes PasteMe by Trackerbot as a dropshipping tool that helps users manage and fulfill orders faster. The listing advertises:

- Copy/paste of single or multiple buyer addresses to suppliers.
- Copy/paste from one computer to another.
- Add Amazon items to cart in one click.
- Insert an "Ordered" note in one click.
- Free-trial activation by installing the extension and signing in with Trackerbot credentials.

The public listing payload exposes an MV3-style manifest with content scripts for Seller Hub order pages across multiple eBay marketplaces, including `*.ebay.com.au/sh/ord*/*`. It also includes extension permissions such as `activeTab`, `tabs`, `storage`, `scripting`, and `notifications`.

The supplied YouTube URL resolves to the title "PasteMe by Trackerbot - copy/paste chrome extension" by Trackerbot.

## CP Bot product interpretation

CP Bot should reproduce the useful workflow pattern, not PasteMe's full marketplace spread:

- Source is only eBay Australia Seller Hub orders.
- Destination is only Amazon Australia checkout/address forms.
- The extension must never click "Place order" or complete checkout.
- Address data should be copied into clipboard and Chrome session storage so a user can move between tabs.
- "Mark ordered" can only be DOM/local/Supabase logging in this MVP; it is not an eBay API write.
- Supabase is used only for authenticated fulfillment logs tied to the existing return-label-generator account.

## Implementation implications

- DOM scraping must be tolerant because eBay Seller Hub markup changes.
- Amazon forms are React-backed, so setting `.value` is not enough; the extension dispatches `input`, `change`, and `blur` events after each field update.
- Public Supabase anon keys can be embedded in the extension build, but service-role keys must never be embedded.
- Host permissions should stay narrow: `*.ebay.com.au` and `*.amazon.com.au` only.
