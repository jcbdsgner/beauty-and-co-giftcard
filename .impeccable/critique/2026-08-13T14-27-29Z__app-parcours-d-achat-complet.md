---
target: app (parcours d'achat complet)
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 3
timestamp: 2026-08-13T14-27-29Z
slug: app-parcours-d-achat-complet
---
Method: dual-agent (A: design-review subagent · B: detector/browser-evidence subagent)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No step indicator across a 7–9 screen flow; the recap badge is the only progress proxy and it truncates to ~10 characters on mobile. Payment does have a proper "Paiement en cours…" state. |
| 2 | Match System / Real World | 3 | Fluent French, correct FCFA formatting, Mobile Money listed first, real Dakar quartiers. Undercut by three different names for one destination and a nonsense "Autre / FCFA" tile label. |
| 3 | User Control and Freedom | 2 | Back is non-destructive throughout and the logo exit-confirm is well judged — but "Modifier" on the recap silently destroys the rest of the order (see P0). |
| 4 | Consistency and Standards | 2 | `/montant` hand-rolls its own card markup instead of reusing `OptionCard`; the header row is implemented twice (`FlowScreen` vs `BackLinkWithLogo`) with different rhythm; `/message`'s always-enabled Continue looks identical to every other screen's disabled-until-valid button. |
| 5 | Error Prevention | 1 | No email/phone format validation anywhere (`isValid` is just `.trim() !== ""`); amount bounds enforced only on one sub-screen and bypassable via URL; `/recapitulatif` and `/paiement` both render a fully live "Payer" button on a 0 FCFA empty order (independently confirmed by both assessments — see Priority Issues). |
| 6 | Recognition Rather Than Recall | 2 | The permanent recap badge is the right instrument and works on desktop; at 375px width it truncates every line ("100.000 F…", "Pour Awa …"), failing exactly where working memory is weakest. Delivery-mode consequences (fee, delay) are never shown at the point of decision. |
| 7 | Flexibility and Efficiency | 2 | Sane tab order, Enter-submits, autofocus on typed screens — but zero `autocomplete` attributes on name/email/phone fields anywhere, so no OS/browser autofill on a 4-field guest checkout. |
| 8 | Aesthetic and Minimalist Design | 3 | Genuinely restrained and attractive. Costs a point for ~350px of dead space above the title on every mobile flow screen, and for small rendered-CSS violations the detector caught (thin-border/wide-shadow combo on the landing card, a 10px label below the 11px legibility floor on the recap badge). |
| 9 | Error Recovery | 2 | The payment-failure message is excellent ("vos informations sont conservées — réessayez"). It's also the only error message in the entire app — no field-level errors, no explanation for disabled buttons. |
| 10 | Help and Documentation | 1 | No validity period, no salon-eligibility statement, no refund policy, no CGV, no support contact anywhere in the purchase flow. Two good inline hints exist (link validity, delivery fee breakdown) but they're the exception. |
| **Total** | | **20/40** | **Acceptable — significant improvements needed before users are happy** |

No heuristic was scored n/a; both 7 and 10 genuinely apply to this Operate-mode checkout.

## Design Specificity Verdict

**Distinctive skin, generic skeleton.**

What's genuinely authored for this product: a real WebGL fragment-shader watercolor background (domain-warped fbm, pointer-repelled sampling, a two-tone B&Co palette — not a stock effect); a deliberate three-typeface stack (Prata display, Cabinet Grotesk UI, Benedict script); a landing `TiltCard` with damped pointer-follow rotation and counter-sliding specular sheen that genuinely reads as "jewellery under glass" — the best moment in the product. Above all, the local commerce authorship is real: FCFA with correct thousands-grouping, Mobile Money (Wave, Orange Money) listed *before* card and PayPal, a closed 20-quartier Dakar+Mbour selector instead of a free-text city field, phone required for retrait/postal because SMS is the reliable channel there. This was designed for Dakar, not localized into it after the fact.

What's category-interchangeable: every screen from "Mode de livraison" through "Paiement" is the same object — pink wash, centered Prata heading, white rounded squares. Swap the labels and it's a generic SaaS onboarding wizard; nothing about the composition itself says "beauty salon" or "gift". The single biggest missed opportunity: the spec's decision to use **one fixed card design** (no design picker) is a gift to a designer — you could render that card on every screen and let it visibly fill in as the user decides amount, then recipient, then message. Instead the card appears nowhere in the flow: not on the landing, not on the recap (a plain data table), not on confirmation (a reference code in a box). A buyer never sees the thing they're buying.

**Deterministic scan**: the static/regex CLI detector (`detect.mjs --json app components`, 42 markup files) found **zero** anti-patterns — a genuinely clean pass by that engine's rules. But the same detector re-run *inside a live, rendered DOM* on 5 representative routes found **5 anti-patterns across 3 rules**: a thin-border/wide-shadow combo on the landing hero card, an under-11px functional label ("Votre carte", 10px) on the recap badge, and three low-contrast instances (3.9:1, need 4.5:1) on the payment screen's method labels — all `#a27576` on white, the site's signature accent color used as body/label text. This is a real coverage gap worth naming: the static engine catches markup/text patterns but nothing that only exists after layout and computed styles resolve (contrast, rendered shadow size). No false positives to flag — every browser-detector finding held up on visual inspection.

**Visual overlays**: not left open in a human-visible browser tab this run — evidence was gathered via headless Playwright automation (console capture + screenshots), not the harness's native browser-canvas path. No overlay is currently visible for you to inspect live; the findings above are the full transcript of what the injected detector reported.

## Overall Impression

The craft is real where it's been applied — the watercolor shader, the tilt card, the FlowScreen header grid, the Dakar-specific commerce logic — but that craft stops at the landing page. The purchase flow itself is a well-built, generically-composed wizard sitting inside a beautifully art-directed shell, and it has one bug (silent data loss on "Modifier") serious enough to actively cost completed orders, plus a second one (a live, payable button on an empty/expired order, with the full order — including the recipient's address and a private message — traveling in the URL) that both assessments found independently through completely different methods. The single biggest opportunity is showing the actual gift card somewhere in the flow; the single most urgent fix is the two P0s below.

## What's Working

1. **`FlowScreen`'s header is real engineering.** The 1fr/auto/1fr grid keeps the logo optically centered no matter how wide the recap badge or back-link get, and a reserved height plus a mirrored bottom spacer keep every screen's title at a constant vertical position regardless of how much the badge has grown. It's documented in the code and it works perfectly at desktop widths — its only failure is that the reserve was sized for desktop and applied unconditionally down to mobile (see Priority Issues).
2. **Local commerce authorship.** Mobile Money first, a real Dakar-quartier selector instead of free text, phone required specifically because SMS is the reliable notification channel for pickup/delivery, with the reasoning stated in code comments. Most builds in this space would have shipped generic Stripe Elements and a City text field; this one understood its market.
3. **The exit-confirm popup is the right pattern for a hard "no resume" rule.** Rather than a heavy dimmed modal, it's styled as a frosted panel descending from the logo — consistent with the rest of the UI's tone, and it stops the single most common accidental-exit path.

## Priority Issues

**[P0] "Modifier" on the Récapitulatif silently destroys the rest of the order.**
Why it matters: all order state lives in the URL query string, and the recap's "Modifier" links drop most of it — e.g. "Modifier · Mode de livraison" sends the user to `/mode-de-livraison` with no query at all, and "Modifier · Montant" carries only the delivery mode. This directly contradicts the two disciplines the project's own spec (`docs/userflow.md`) names explicitly: *"Modifier sur chaque bloc → renvoie à l'écran correspondant (données conservées)"* and *"Retour arrière non destructif"*. A user changing 50 000 → 100 000 FCFA at the last step loses their recipient, message, and address, and has to retype the whole order — most won't.
Fix: every `editHref` must carry the full current order as a query string, and each edited screen should return to the recap instead of re-walking the whole flow forward.
Suggested command: `/impeccable harden` (or a direct fix — this is a correctness bug, not a taste call).

**[P0] `/recapitulatif` and `/paiement` render a fully live, payable "Payer" on an empty 0 FCFA order — and the full order, including the recipient's address and private message, travels in the URL.**
Why it matters: both assessments hit this independently — the design review by loading the routes with no query string (every field showed "—", total "0 FCFA", Payer button fully enabled), and the detector/browser pass by screenshotting `/paiement` and observing the same 0 FCFA state. Since state lives entirely in the URL, any truncated, shared, bookmarked, or stale link drops a visitor onto a payable checkout for nothing — and separately, the recipient's home address and the gift message end up in browser history, server access logs, and `Referer` headers. On a shared phone, the next person can read the whole order out of the URL bar.
Fix: a single completeness guard on both routes that replaces the page with "Votre parcours a expiré" and disables Payer when required fields are missing. Longer term, move order state out of the URL (sessionStorage or a short-lived server draft) to remove the PII exposure while keeping the "no resume before payment" decision intact.
Suggested command: direct fix, then `/impeccable audit` to check for other state-dependency gaps.

**[P1] The mobile flow layout hides the choices it's asking the user to make.**
Why it matters: measured at 375×800, the first interactive element on every flow screen sits at y≈356 (44% of the viewport is header/reserved void before any content), and `/mode-de-livraison`'s content is 1212px tall in an 800px viewport — the third delivery option, "Livraison", is entirely below the fold with no scroll affordance, on the very first screen of the purchase flow. Root cause: `FlowScreen`'s header reserve (sized for the desktop recap badge's worst case) applies unconditionally on mobile too.
Fix: make the reserve responsive (small on mobile, full size from `sm:` up), and consider moving the recap badge out of the header into a compact single-line strip or collapsed chip on narrow viewports.
Suggested command: `/impeccable adapt`.

**[P1] The recap badge is illegible on mobile, and delivery-mode cards carry no cost/timing information.**
Why it matters: the badge caps at 120px wide below `sm` with truncation on every line, so at mobile width it reads "100.000 F…", "Pour Awa …", "Signé Ta s…" — the one component built to keep prior decisions visible degrades into noise exactly where it matters most. Compounding this, `docs/userflow.md` explicitly specs delivery-mode cards with *"description courte : délai, gratuité/frais, ce que reçoit le destinataire"*, but the shipped cards are bare icon+label. The user picks "Livraison" with no idea it adds 2 000 FCFA until the recap screen, five steps later — undisclosed fees at checkout are a classic trust-breaker. The detector's browser pass independently caught a related symptom here: a 10px "Votre carte" label on the badge, under the 11px legibility floor.
Fix: add a two-line delay/fee/recipient-experience description under each delivery-mode card; widen or restructure the recap badge for mobile instead of truncating.
Suggested command: `/impeccable clarify` for the copy, `/impeccable adapt` for the mobile badge layout.

**[P1] The payment screen — the highest-stakes moment in the flow — has no trust signals and no primary action.**
Why it matters: three equal-weight outline buttons, no brand-color primary anywhere on the page, no lock icon, no "paiement sécurisé" line, no processor named, no CGV link. The detector independently flagged the exact color used for all three method labels (`#a27576` on white) as failing contrast at 3.9:1 against the 4.5:1 AA requirement — the same color the design review flagged as systemically under-contrast across every "Modifier" pill and outline button in the app. A demo-only "Simuler un échec de paiement" checkbox sits directly beneath the payment methods, inside the same card, at the exact moment a first-time buyer is deciding whether to trust the page with money.
Fix: promote the most-used method (Mobile Money) to the brand-filled primary style; add one reassurance line under the amount; move the demo checkbox out of the payment card into a footer note or behind a `?demo=1` flag; darken `#a27576` toward AA compliance sitewide (it's the base color of the button-2/accent token, so this is a one-place fix with wide reach).
Suggested command: `/impeccable colorize` for the contrast fix, `/impeccable polish` for the trust-signal layout.

## Persona Red Flags

**Casey (distracted mobile user)** — the sharpest failures land here.
- Opens "Mode de livraison" on a 375-wide phone and sees only two of three delivery options; the third requires an unsignaled scroll.
- The recap badge she'd rely on to re-orient after an interruption shows her "100.000 F…" — she can't confirm the amount she picked.
- Zero `autocomplete` attributes across every name/email/phone field in the flow — no iOS/Android autofill on a guest checkout that asks her to type her name, email, and a 9-digit phone number by hand.
- The Payer button on the recap sits roughly two screens down from where she lands, with no sticky bottom bar.
- The exit-confirm dialog's buttons are roughly 36px tall with ~12px between them — under common touch-target guidance.

**Riley (stress tester)** — finds a live payable empty order in about 30 seconds.
- Loads `/recapitulatif` and `/paiement` with no query string: every field "—", total "0 FCFA", Payer fully enabled on both (P0 above).
- Types `notanemail` into any email field: accepted everywhere, all the way through to a "confirmed" order — validation is just "not empty".
- Clicks "Modifier · Mode de livraison" and watches the recipient, message, and address vanish (P0 above).
- Reads "les informations saisies ne seront pas conservées" in the exit dialog, refreshes the page instead of navigating away, and finds everything still there — since state lives in the URL, refresh actually *does* survive, so the warning over-promises what it protects against.

**Sam (accessibility)** — several concrete AA-level failures, one systemic.
- The accent color used for every "Modifier" pill, every outline-button label, and the payment method names computes to roughly 3.9–4:1 against white — below the 4.5:1 AA threshold for normal text. It's one token, so it's a one-place fix with sitewide reach.
- Disabled buttons give no explanation for *why* they're disabled — a screen-reader user reaches a disabled Continue with no field-error text pointing at what's missing.
- No visible field labels anywhere in the flow — placeholder + `aria-label` only, which screen readers handle but low-vision and cognitive users lose the moment they start typing.
- The exit-confirm dialog is marked `role="dialog" aria-modal="true"` with no focus trap and no autofocus — keyboard focus stays on the page behind an element announced as modal.
- No `prefers-reduced-motion` handling anywhere in the codebase — the landing card runs a continuous float animation and a pointer-follow tilt with no reduced-motion fallback.
- In that same exit dialog, the destructive choice ("Revenir à l'accueil", which discards the order) is styled as the filled brand-primary, and the safe choice ("Annuler") as the ghost button — inverted weighting for anyone relying on visual prominence to choose.

## Minor Observations

- Three different labels for one destination: "Gérer mes cartes" (landing), "Voir mes cartes cadeaux" (confirmation), "Mes cartes cadeaux" (the page itself).
- The landing puts the secondary CTA ("Gérer mes cartes") before the primary purchase action on mobile.
- The "Autre" custom-amount tile inherits the preset tiles' "FCFA" subtitle, reading as "Autre FCFA", with no hint of the amount's min/max bounds until the next screen.
- `/montant` reimplements its own card markup instead of reusing the shared `OptionCard` component — two systems to keep in sync going forward.
- The detector's browser pass flagged the landing hero card's border+shadow combination (a very thin border paired with a very wide, soft shadow) as a specific rendered anti-pattern worth a look, even though it reads fine at a glance.
- `/signature/alias` doesn't prefill from a previously entered alias, so navigating back to edit it means retyping from scratch.
- `/message`'s Continue button is always enabled (correct — message is optional) but looks visually identical to every other screen's disabled-until-valid button, so the difference reads as inconsistency rather than intent.
- `/mes-cartes-cadeaux/liste` renders a blank screen (just the heading) while reading from localStorage, with no skeleton or spinner.
- The confirmation screen's copy-to-clipboard has no failure handling, so on an insecure origin it can silently do nothing.

## Questions to Consider

- Why does the buyer never see the card? With a single fixed design (no picker, by the product's own spec), the card is a constant you could render on every screen and let visibly fill in as amount, recipient, and message are chosen — turning seven form screens into "watch your gift take shape."
- If nothing is meant to persist before payment, why does the full order — including a private message and a home address — travel in the URL? Refresh already survives today (contradicting the exit warning), so the current model gets the worst of both: it isn't actually stateless, and it isn't private either.
- What would a confident version of the payment screen look like? Right now it's the plainest screen in the product at the exact moment of highest stakes.
