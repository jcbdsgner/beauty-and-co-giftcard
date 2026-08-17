---
target: app/ (tous les écrans du site)
total_score: 25
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 3
timestamp: 2026-08-14T17-33-20Z
slug: app-tous-les-crans-du-site
---
Method: dual-agent (A: aeeb2607d1345786f · B: abc7035bd77522662)

## ⚠️ Before the findings: a concurrent-session flag

While this review ran, git status and process listing showed **another active Claude Code session editing this same repo right now** — `app/template.tsx` and `components/ui/page-transition.tsx` were deleted, a new `components/ui/screen-transition.tsx` was added, and `components/canvas/watercolor-background.tsx` was modified, all with very recent mtimes (the newest just minutes old). Assessment B independently noticed this too (stray screenshots mid-edit, a dev-server restart on port 3000 during its scan). This review did not touch or revert any of it. It means: findings about the transition system or watercolor background should be treated as a snapshot of a moving target, and one flagged rendering gap (see below) traced back to that restart rather than to real code.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Recap badge + progress read clearly; disabled "Continuer" never says which field is missing; payment failure is the only screen that establishes an inline-error pattern |
| 2 | Match System / Real World | 4 | Mobile Money-first payment order, FCFA formatting, real salon names, Senegalese context throughout |
| 3 | User Control and Freedom | 3 | Back-link everywhere, Récapitulatif "Modifier" links preserve state; no way to abandon the whole purchase except stepping back one screen at a time |
| 4 | Consistency and Standards | 2 | Core FlowScreen/OptionCard/TextField pattern is followed almost everywhere, which is exactly why the breaks stand out — see Priority Issues |
| 5 | Error Prevention | 3 | Continue disabled until valid, "at least one of phone/email" stated up front; no inline format hints before submit |
| 6 | Recognition Rather Than Recall | 3 | Recap badge is the standout feature; Récapitulatif shows the same info twice (badge + full list) |
| 7 | Flexibility and Efficiency | n/a | Deliberately linear guided checkout by design — accelerators aren't the point of a first-purchase flow |
| 8 | Aesthetic and Minimalist Design | 4 | One idea per screen, restrained palette, no decorative noise — the strongest heuristic in the review |
| 9 | Error Recovery | 3 | Payment-failure and expired-order states are calm and recoverable; but they're the only two error patterns in the whole site |
| 10 | Help and Documentation | n/a | Not needed for a short guided gift-card purchase |
| **Total** | | **25/32** | **Good (78%)** |

## Design Specificity Verdict

**LLM assessment**: This reads as authored for this brand, not a generic checkout template. The ribbon-unboxing video gate with a diagonal-cut reveal, Mobile Money defaulting ahead of card/PayPal, the two real salon names (Sea Plaza, Almadies), and Senegalese demo names in "Mes cartes cadeaux" (Modou Fall, Aïssatou Ndiaye) are all specific, considered choices a template wouldn't make. It commits to one visual idea (watercolor shader background, serif display + hand-lettered logo, pill controls) and repeats it across ~24 screens instead of improvising per page. Where it slips toward generic: the "Simuler un échec" checkbox is an unstyled native checkbox in an otherwise fully custom UI, the custom-amount field shows the browser's native number spinner, and — most visible — the Hero's two CTAs ("Prendre rendez-vous", "notre boutique en ligne") are wired to `href="#"` on the very first screen every visitor sees.

**Deterministic scan**: `detect.mjs --json` returned zero findings against both `app/` and `components/`, verified against a synthetic anti-pattern file to confirm the detector itself is working (it correctly flagged a deliberate bounce-easing test case). URL-mode/browser scanning failed outright — Puppeteer isn't installed in this environment and no system Chromium exists — so Assessment B fell back to manual screenshot inspection via Safari for the 5 representative pages plus 2 mobile passes.

**Visual evidence**: A rendering gap Assessment B flagged on Récapitulatif — the "Montant" row showing no value — does **not** reproduce against the current source (`formatFcfa(carried.amount)` is present and correct in `app/recapitulatif/page.tsx`); it's almost certainly a stale capture from the concurrent session's dev-server restart noted above, not a real bug. One genuine visual finding stands: on the Landing page at mobile width, the white "PRENDRE RENDEZ-VOUS" / "NOTRE BOUTIQUE EN LIGNE" text sits over a brighter region of the background photo than at desktop width, and legibility suffers there specifically.

## Overall Impression

A well above-average, specifically-authored checkout flow (25/32, "Good") let down by a handful of concrete, fixable inconsistencies rather than any broad weakness. The strongest thing here — the recap badge that lets a buyer watch their gift take shape across a long flow — is undermined by its own positioning bug on exactly the two screens where the flow gets most content-dense. The single biggest opportunity: the payment screen, the highest-stakes moment in the journey, is currently the least differentiated screen in the product.

## What's Working

1. **The recap badge system** (`components/ui/recap-badge.tsx`) — icon-per-line, reuses the same icons the picker screens used to make each choice, grows as decisions are made. The single best piece of craft in the product.
2. **Payment-method localization** — Mobile Money (Wave, Orange Money) ahead of card/PayPal is a detail only a team that thought about the actual Dakar market would get right.
3. **Compositional restraint** — the OptionCard/TextField/FlowScreen system is genuinely reused, not reinvented, across ~20 flow screens.

## Priority Issues

**[P1] Recap badge overlaps the logo on mobile, on every `fillViewport` screen (Aperçu de la carte, Récapitulatif).**
Why it matters: `components/ui/flow-screen.tsx` absolutely-positions the badge at `top-8 right-6` on `fillViewport` screens regardless of viewport width, while the logo is independently centered in the header grid. At 390px, the math overlaps directly — badge spans roughly x163–366, logo spans roughly x152–238, same vertical position. Confirmed by Assessment A's mobile screenshot and independently by the CSS math. This is exactly the class of bug the project's own code comments say it already fought once (the non-`fillViewport` branch has a whole documented 3-column-grid solution for this) — the `fillViewport` branch never got the same treatment.
Fix: give the badge a responsive position on `fillViewport` screens (stack below the header row on narrow widths, or shrink/reflow instead of floating at a fixed corner), and consider suppressing it specifically on Récapitulatif, where the same information is already shown twice.
Suggested command: `/impeccable layout`

**[P1] Recipient's name and contact are split across two full-screen steps; the buyer's equivalent isn't.**
Why it matters: `/coordonnees-destinataire` (Prénom + Nom) and `/coordonnees-destinataire/contact` (Téléphone + Email) split one logical "who is this for" entity into two screens, while `/vos-coordonnees` (the buyer, same shape of data — name + email) is a single screen. Cross-screen inconsistency in chunking for structurally identical data — it silently makes the "for someone else" path two steps longer with no rationale visible in the UI.
Fix: either combine into one screen matching the buyer pattern, or make the split legible (e.g. sub-step styling instead of a fresh H1 and a fresh "screen" feel).
Suggested command: `/impeccable shape`

**[P1] The payment screen doesn't carry the emotional weight of the transaction's peak moment.**
Why it matters: real money, spent on a gift, for someone else — the single highest-stakes moment in the flow — renders as a plain white card with three payment rows and a generic lock icon. No recipient/amount recap inside the card itself (only in the small corner badge), nothing that acknowledges what's actually happening. Per the peak-end rule, this is the wrong screen to go generic on, right between the visual warmth of the 3D card preview and the well-executed Confirmation screen.
Fix: restate "15.000 FCFA · Pour Awa Diop" inside the payment card itself, and consider one warm line acknowledging the gift.
Suggested command: `/impeccable delight`

**[P2] Two prominent Hero links go nowhere.**
Why it matters: "Prendre rendez-vous" and "notre boutique en ligne" appear on both the video gate and the Hero underneath — the first screen every visitor sees, twice — each wired to `href="#"`. They're styled, `target="_blank"`-flagged, and visually promise an external destination.
Fix: wire real URLs (once available) or remove until they exist, rather than shipping a broken affordance in the highest-visibility spot on the site.
Suggested command: `/impeccable harden`

**[P3] Native OS spinner breaks the pill aesthetic on the one custom-amount field.**
Why it matters: `/montant/personnalise` uses `<input type="number">`, the only spot in the entire flow where OS chrome (up/down spinner arrows) intrudes on an otherwise fully custom, pill-shaped control.
Fix: `inputMode="numeric"` with `type="text"`, or suppress the spinner via `appearance: textfield`.
Suggested command: `/impeccable polish`

## Persona Red Flags

**Jordan (First-Timer)**: On `/coordonnees-destinataire`, nothing explains why recipient info spans two screens back-to-back — a first-timer doesn't know how much more is coming. Across `/coordonnees-destinataire`, `/vos-coordonnees`, `/adresse-livraison`, the disabled "Continuer" button gives no textual cue about which field is still missing — only a color change.

**Sam (Accessibility-Dependent)**: Genuine strength first — every field carries a distinct `aria-label`, and OptionCard renders as real `<a>`/`<button>` elements, more accessible than most visually-polished sites bother to be. Red flag: all fields rely on placeholder-only visible labels (no persistent `<label>`) — once typed into, the visible prompt disappears. `/lien-envoye` drops the logo and back-link entirely, the only screen in the site to do so — a keyboard user landing there has no in-page way back.

**Riley (Stress Tester)**: The expired-order state is handled cleanly with one-click "Recommencer" — good defensive design. But `/confirmation` with no `ref` param renders a reference card with a bare "—" next to a still-active-looking copy button. The "at least one of phone/email" constraint on Contact du destinataire is only ever a disabled-button state, never a tested inline-error path — the only true error state in the whole site is payment failure.

## Minor Observations

- The OptionCard grids (Mode de livraison, Montant, Pour qui, Signature, Quand l'envoyer) are the flow's most visually consistent, polished rhythm — worth protecting as the template for any future screen.
- FCFA thousands-separator formatting (period, e.g. "15.000 FCFA") is applied correctly and consistently sitewide.
- The retrait QR code on Confirmation is worth confirming as genuinely scannable before ship, given the copy explicitly instructs presenting it in-salon.
- `/connexion`'s secondary action ("Recevoir un lien par email") is a bare text link directly under a full-width pill button; every other secondary action sitewide (e.g. Confirmation's "Voir mes cartes cadeaux") uses an outlined pill instead.
- Disabled-gray and the pink/red payment-failure banner are the only two feedback colors in the UI — fine for current scope, worth knowing if more states get added later.
- Récapitulatif's row list scrolls internally (`overflow-y-auto`, `max-h-full`) for long orders instead of pushing "Payer" off-screen — good defensive detail.
- Landing/mobile: the two footer link labels lose contrast where they cross a bright region of the background photo at that specific viewport width — worth a quick check across a couple of device widths.

## Questions to Consider

- Why does "who is this gift for" take two screens while "who is buying it" takes one — is there a reason that should be visible in the UI, or should the screens simply merge?
- What is the recap badge actually for on the Récapitulatif screen itself, given the page already is the full recap?
- Would collapsing 2-3 of the smallest single-field steps meaningfully shorten time-to-purchase without breaking the "one decision at a time" discipline that earns real credit elsewhere?
- What would it take to bring the payment screen up to the same level of care as the landing gate, even modestly?
