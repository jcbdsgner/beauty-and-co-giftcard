---
target: Récapitulatif screen (app/recapitulatif/page.tsx)
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-08-20T15-33-27Z
slug: app-recapitulatif-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | No step indicator ("étape 7/8"); the RecapBadge partially compensates but doesn't convey progress. |
| 2 | Match System / Real World | 3/4 | Natural French labels, but "Vos coordonnées" renders as a raw `Nom · Téléphone · Email` pipe-joined string — reads like a DB dump. |
| 3 | User Control and Freedom | 1/4 | Only 4 of 9+ possible rows get a "Modifier" pill (Pour qui ?, Mode de réception, Salon de retrait, Montant/Pack). Vos coordonnées, Destinataire, Message, Signature, Adresse de livraison have no `editHref` at all. |
| 4 | Consistency and Standards | 2/4 | Every row looks identical but half have a Modifier pill and half don't, with no visual cue explaining why. |
| 5 | Error Prevention | 1/4 | The one screen meant to be "check everything before you pay" can't correct the two highest-risk fields: buyer contact and recipient contact. |
| 6 | Recognition Rather Than Recall | 2/4 | Dense joined-string values force active re-parsing instead of a glance-check. |
| 7 | Flexibility and Efficiency | 2/4 | The `editQuery()`/`from=recap` round-trip pattern is genuinely efficient — but applied to under half the rows. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean and pixel-precise (confirmed: uniform 77px row rhythm, identical 91×45px pill sizing across all editable rows) but restrained to the point of genericness. |
| 9 | Error Recovery | 2/4 | `OrderExpired` is a well-built recovery pattern for a broken/stale order URL, but the happy-path recap gives no warning before commit to pay. |
| 10 | Help and Documentation | 2/4 | No support/contact affordance on the last screen before a financial transaction. |
| **Total** | | **21/40** | **Acceptable** |

## Design Specificity Verdict

**LLM assessment**: This screen could be swapped into almost any e-commerce checkout flow with a label find-and-replace and nobody would notice. The structural language — white rounded card, gray-label-over-bold-value rows, outlined "Modifier" pill, single pink CTA pill — is generic checkout-summary grammar (Stripe Checkout, Shopify order review, any SaaS billing-confirm screen use the same pattern). Brand-specific signal is thin and confined to surface decoration: the Prata serif h1, the blush/rose tokens, FCFA formatting. Nothing in the layout, copy, or composition says "boutique beauty salon" or "this is a gift." The screen immediately before this one (`/apercu-carte`) builds real product theater — a rendered 3D card the buyer can see, recto/verso — and none of that visual continuity carries forward here. The recap regresses to a spreadsheet at exactly the moment (last check before paying, often for someone else) the product should be doing the most emotional work. `/packs` (the service-bundle picker one step earlier) actually carries more brand-specific texture — tagline, description, per-item duration — than the recap screen that's supposed to be the confident final look at the purchase.

**Deterministic scan**: `detect.mjs --json app/recapitulatif/page.tsx` exited 0 with zero findings — no mechanical anti-patterns detected. The in-browser detector (injected live via `detect.js`) independently confirmed the same result via console: `[impeccable] No anti-patterns found.` No `pageerror` events fired. The mechanical detector and the design review are checking different things here: zero anti-pattern hits is consistent with a page that's clean and well-built at the code/pattern level, while the design review's issues are about information architecture and emotional tone — exactly the kind of gap a pattern-matching detector isn't built to catch.

**Visual overlays**: No visible overlay was produced — the detector found nothing to highlight, so there is nothing to show in a browser tab. Pixel-level measurement (via automated screenshot + crop analysis) additionally confirmed the craft is solid where it exists: all four Modifier-pill rows measure an identical 91×45px with identical vertical centering, row height is a uniform 77px across all four middle rows, and every text/background contrast pairing measured — including the lowest-contrast element, the rose "Modifier" text at ~5.2:1 — clears WCAG AA. The "VOTRE CARTE" badge and the recap card have overlapping y-ranges but never share x-range, so despite what a naive bounding-box check might flag, there is no actual visual collision.

## Overall Impression

Structurally sound and pixel-precise, but content-incomplete and emotionally flat for what this screen is supposed to be. The build quality is real — uniform spacing, AA-passing contrast everywhere, a genuinely clever `from=recap` edit round-trip — but that plumbing was wired to less than half the rows, so the single most important promise of a "review before you pay" screen (catch and fix a mistake) silently doesn't hold for the buyer's own contact info or the recipient's details, which are the two fields most likely to actually be wrong. Layered on top, the screen carries zero visual or emotional residue from the 3D card preview one step earlier, so a purchase that's frequently a gift lands at its final review as a bare data table.

## What's Working

- **The `editQuery()` / `from=recap` pattern** (`app/recapitulatif/page.tsx` L30-35): edit links carry the *entire* order plus a `from=recap` flag so the destination screen can jump straight back here instead of re-walking the flow forward. Genuine craft — just under-applied to the rows that need it most.
- **`RecapBadge`** (`components/ui/recap-badge.tsx`): a persistent, icon-per-decision companion that grows through the flow reusing the same icons as the picker screens where each choice was made, plus a well-handled mobile collapse-behind-an-eye-toggle with proper click-outside/Escape handling.
- **Real accessibility discipline already in place**: `--button-2-color` was deliberately darkened from a failing 3.9:1 to a passing ~5.18:1 per a `globals.css` code comment — and browser measurement confirms every contrast pairing on the live page clears AA, including the "Modifier" pill's rose text at ~5.2:1. This isn't accidental; the team already audits contrast before shipping.

## Priority Issues

**[P0] Most personal-data rows have no edit path**
- *What*: "Vos coordonnées," "Destinataire," "Message," "Signature," and "Adresse de livraison" are all pushed to the `rows` array without an `editHref` — only "Pour qui ?", "Mode de réception," "Salon de retrait," and "Montant/Pack" get a Modifier pill.
- *Why it matters*: This is the last screen before payment. A buyer who spots a typo in their own email or the recipient's phone number has no way to fix it here — they have to back out through multiple prior screens, losing the exact context this screen exists to preserve.
- *Fix*: Wire `editHref` for each of those rows (`/vos-coordonnees`, `/coordonnees-destinataire`, `/message`, `/signature/alias`, `/adresse-livraison`) using the same `editQuery()` pattern already built for the other rows.
- *Suggested command*: `/impeccable harden`

**[P1] No emotional/visual payoff at the highest-stakes screen in the flow**
- *What*: No card preview, no gift-forward copy, no restated recipient name — all visual continuity from `/apercu-carte`'s 3D card preview drops the instant the buyer lands here.
- *Why it matters*: This is peak payment anxiety, and often a gift purchase; the last screen before paying should reassure, not just tabulate.
- *Fix*: Reintroduce a small static card render near the h1, add one line of warm reassurance copy, restate "Pour Fatou" conversationally instead of only in a labeled row.
- *Suggested command*: `/impeccable delight`

**[P1] Dense pipe-joined strings for the two highest-risk fields**
- *What*: "Vos coordonnées" (`buyerFullName · phone · email`) and "Destinataire" (name · email · phone · quartier · adresse) each collapse multiple distinct fields into one run-on string with no sub-labels.
- *Why it matters*: These are exactly the fields a buyer most needs to verify correctly (wrong email = no receipt, wrong phone = undeliverable card), and they're the hardest to scan as a single joined string — and the hardest for a screen reader to parse, since it's plain markup, not a semantic `<dl>`.
- *Fix*: Break into labeled sub-lines, or reuse the icon-per-line pattern `RecapBadge` already has for this same data.
- *Suggested command*: `/impeccable clarify`

**[P2] Pack duration/description dropped between screens**
- *What*: `/packs` shows each pack's description and per-item duration; the recap note only joins item labels, discarding both.
- *Why it matters*: A buyer choosing "Pack Métamorphose" (Silk Press 180min + Olaplex 120min) can't confirm session length before paying for a multi-hour commitment.
- *Fix*: Include duration in the note string, e.g. `"${item.label} (${item.duration})"`.
- *Suggested command*: `/impeccable polish`

**[P3] No branded focus-visible state on any pill control**
- *What*: Neither the shared Button component nor the Modifier `Link` define any `focus-visible` styling.
- *Why it matters*: On a screen with 4-6 nearly identical pill controls in a row (confirmed pixel-identical at 91×45px each), a keyboard user tabbing through has no differentiated way to track position beyond a generic UA outline.
- *Fix*: Add an explicit `focus-visible:ring-2 focus-visible:ring-offset-2` treatment to the shared button base classes and to the Modifier link.
- *Suggested command*: `/impeccable harden`

## Persona Red Flags

**Jordan (first-timer, buying as a gift)**: Arrives at the recap, wants to double-check the recipient's name is spelled right in the "Destinataire" block, finds no Modifier button there, and there's no help/contact link on the page either — the moment of doubt has no resolution path short of guessing which earlier screen to hunt through.

**Sam (accessibility)**: Rows are plain `div`/`span` markup, not a semantic list, so a screen reader announces "Vos coordonnées, JCB BCJ · 772778292 · a@a.a" as one run-on string with no indication of where the phone ends and the email begins. Combined with the missing focus-visible styling, a keyboard user tabbing through a row of visually-identical Modifier pills has a materially harder time tracking position than a sighted mouse user does — even though every pill measures identically and every color pairing passes AA contrast.

**Riley (stress tester)**: A long buyer name or the longest pack label would wrap the row value to multiple lines while the Modifier pill (row is `items-center`) stays vertically centered against the whole block rather than pinned to the first line — worth testing with real long-name input. On the positive side, hitting the URL with `mode=retrait` and no `salon` correctly triggers `isOrderComplete()`'s guard and renders `OrderExpired` instead of a broken payable page — that resilience holds up under direct testing.

## Minor Observations

- "Total à payer" is only distinguished from other rows by a modest `text-xl` bump — the single most important number on the page gets a small type-scale jump, not a decisive one.
- The "Modifier" pill's tap target measures 91×45px — at/just above the ~44px minimum touch-target guideline; acceptable but not generous for a mobile checkout screen.
- "Payer" has no lock icon or payment-trust cue, despite triggering a real (if simulated) transaction — a common and expected pattern in the checkout genre this screen otherwise borrows its grammar from.
- `formatFcfa` uses `toLocaleString("de-DE")` purely to get the dot-thousands-separator convention — works, but an odd implicit dependency worth a one-line comment for the next maintainer.

## Questions to Consider

- If this is bought as a gift more often than not, why does the last screen before payment show zero trace of the actual card the recipient will see — is "recap as spreadsheet" really the right metaphor for a purchase this emotionally loaded?
- Why can a buyer edit their pack or amount from this screen but not their own email or the recipient's name — was that a deliberate trust boundary, or did the edit-link wiring simply stop partway through the row list?
- What would this screen look like if it were designed around "reassure and confirm" instead of "list every field" — one hero element (the card) plus 2-3 grouped, glanceable summary blocks instead of 9 flat rows?
