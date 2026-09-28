# Build Log

## 2026-09-28
- **Requested:** Update Contact page cards: remove business hours, redesign contact details card with icons and functional links. Audit repo for other business hours.
- **Built:** 
  - Removed "Temporal Availability" card from `src/pages/ContactPage.tsx`. 
  - Redesigned "Get in touch" card with a mailto link, custom WhatsApp SVG links for both offices, and a Google Maps link for the Australia office.
  - Audited repo for business hours: confirmed no display text or JSON-LD contains business hours outside of admin settings.
- **Files touched:** 
  - `src/pages/ContactPage.tsx`
- **Deviations:** 
  - Bangladesh address was left as plain text since the room/floor specifics do not resolve sensibly on Google Maps.
