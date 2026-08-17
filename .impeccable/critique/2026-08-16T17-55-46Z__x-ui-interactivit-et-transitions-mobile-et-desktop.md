---
target: UX/UI, interactivité et transitions (mobile et desktop)
total_score: 23
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
timestamp: 2026-08-16T17-55-46Z
slug: x-ui-interactivit-et-transitions-mobile-et-desktop
---
Method: dual-agent (A: design-review · B: detector/browser-evidence), both isolated, both completed.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Transitions + a payment loading state exist, but their inconsistency (forward fade vs. instant back-nav cut, snap-open recap panel) undercuts "the system behaves predictably" |
| 2 | Match System / Real World | 3 | FCFA, Dakar salons, French copy all correct and unchanged since last review |
| 3 | User Control and Freedom | 3 | SiteLogo leave-confirm and the back link work well; undermined by browser back/forward (see P1) |
| 4 | Consistency and Standards | 2 | Motion language is fragmented: 300ms eased fade (forward nav) vs. instant snap (back nav, recap panel) vs. spring-damped (tilt card, orbit) vs. hover-only everywhere else — no single motion "voice" |
| 5 | Error Prevention | 3 | Order-completeness gating, payment failure simulation, amount bounds all reasonable |
| 6 | Recognition Rather Than Recall | 3 | Recap badge/panel does real work; on mobile it's one tap away instead of always-visible |
| 7 | Flexibility and Efficiency | n/a | Deliberately guided single-path checkout |
| 8 | Aesthetic and Minimalist Design | 3 | Consistent and restrained; minor detector-flagged cosmetic issues (see Design Specificity) |
| 9 | Error Recovery | 3 | Payment-failure copy remains clear and reassuring |
| 10 | Help and Documentation | n/a | Not needed for a short guided gift-card purchase |
| **Total** | | **23/32** | **Good (72%)** |

## Design Specificity Verdict

**LLM assessment**: Genuinely specific to this product, not templated. The watercolor shader, diagonal-cut video reveal, orbital 3D card preview, and damped-tilt hero card are bespoke builds with real engineering behind their degrade paths to touch — not a starter-kit skin with a coat of paint. High floor for interactivity ambition; the gap this run surfaces is that ambition is unevenly distributed (see Priority Issues).

**Deterministic scan**: Static CLI pass (`detect.mjs` over `app/` `components/`) is clean. The live browser-injected detector (via `live-server.mjs`, run across 6 representative pages) found 3 total anti-patterns: a thin-border/wide-shadow combo on the Hero's `TiltCard` (cosmetic pattern flag), 35 characters of uppercase body text on `/apercu-carte`'s "GLISSEZ POUR FAIRE PIVOTER LA CARTE" instruction, and a `low-contrast` flag on the intro-gate's black caption text — almost certainly a **false positive**, since the detector diffs against the container's dark computed background-color and can't read the actual `<video>` pixels the text sits on.

**Interaction evidence**: Both assessments independently drove real interactions (not just static screenshots) across desktop (1440×900, mouse) and mobile (iPhone 13, touch) profiles: intro-gate tap and swipe both confirmed working, TiltCard hover-tilt confirmed via rotateX/Y sampling, the 3D card orbit confirmed rotating on drag on both viewports, the new recap eye-panel confirmed opening/closing correctly, and payment's simulated loading state confirmed via a real click-through to `/confirmation?...&ref=...`. Both assessments also independently landed on the same gap: no touch-specific press feedback exists anywhere in the codebase (see Priority Issues).

## Overall Impression

The bespoke, hand-engineered interactions (tilt, orbit, watercolor, diagonal-cut) are genuinely excellent and confirmed working correctly on both mobile and desktop. What holds this back from "Excellent" is that the *stock* interaction surface — hover/press states, keyboard navigation, and navigation-type-aware transitions — didn't get the same attention as the showpiece moments. The single most consequential finding: the carefully-tuned 300ms screen transition, which forward navigation gets, is completely absent on browser back/forward navigation — the exact behavior a 9-screen "go back and change something" checkout flow invites constantly, and which mobile users trigger via OS edge-swipe without even touching your back link.

## What's Working

1. **Forward-navigation transition engineering** — verified via opacity sampling every 15ms: a clean sequential 150ms exit → 150ms enter fade (300ms total), engineered specifically to avoid a white-flash remount of the WebGL watercolor canvas. Hard plumbing, well solved.
2. **Pointer-Events-based interactions correctly avoid hover-only dead ends** — TiltCard, the watercolor pointer-repel, and the 3D card's orbit controls are all built to degrade to touch, not just fail silently on mobile. Confirmed by direct drag/touch testing on both device profiles.
3. **Small details show real care** — the 3D card's auto-rotate yields the instant you grab it and resumes 2.5s after release; the swipe-to-open gate uses an honest 40px threshold; SiteLogo's popover has both click-outside and Escape-to-close.

## Priority Issues

**New this run** (interactivity/transitions lens):

**[P1] Browser back/forward navigation completely bypasses the screen transition.**
Why it matters: Forward in-app clicks fade smoothly (1→0→1 over ~300ms, confirmed by opacity sampling). The identical navigation triggered via the browser's native back button showed opacity pinned at 1 for the entire sample window — an instant, unanimated swap. `ScreenTransition` (`components/ui/screen-transition.tsx`) only intercepts `<a>` clicks in the capture phase; it has no `popstate` handling, so back/forward-button clicks and mobile OS edge-swipe-back — both extremely common in a linear "go back and change something" flow — currently read as broken next to the hand-tuned forward fade.
Fix: Detect back/forward navigation type (`performance.getEntriesByType("navigation")[0].type === "back_forward"`, or a `popstate` listener) and force the same enter-phase sequencing on it that forward navigation gets.
Suggested command: `/impeccable animate`

**[P2] No touch-appropriate press feedback anywhere — every interactive surface relies purely on `:hover`.** *(independently confirmed by both assessments — codebase-wide grep found zero `active:` classes; live touch-and-hold testing on OptionCard showed literally no visual change before release)*
Why it matters: `Button`, `OptionCard`, and calendar day cells all use only `hover:` classes. On touch devices, `:hover` either never fires or fires-and-sticks unpredictably after a tap, so nothing in the flow confirms "yes, I registered your tap" — on a checkout flow, in a mobile-first market (Mobile Money is the default payment method here), that's a real gap, not a nice-to-have.
Fix: Add `active:scale-[0.97]` / `active:bg-[...]` equivalents alongside the existing hover classes on `Button`, `OptionCard`, and calendar day buttons.
Suggested command: `/impeccable delight`

**[P2] The new mobile recap panel (eye-button toggle) snaps open/closed with zero transition.**
Why it matters: Screenshotted 30ms after tap: the panel is already fully rendered — a raw conditional mount (`{open && (...)}`) with no transition class, in `components/ui/recap-badge.tsx`. Every other piece of chrome in this app got motion attention; the one interactive element added this session is the one that snaps, which reads as unfinished right next to its siblings.
Fix: A short (150–200ms) scale+opacity or slide-down enter/exit, ideally reusing the existing screen-transition timing constants for consistency.
Suggested command: `/impeccable polish`

**[P3] Calendar has no keyboard-efficient navigation — 47 tab stops for one month, no arrow-key roving tabindex.**
Why it matters: Confirmed via DOM count and a live ArrowRight test that didn't move focus. A keyboard user picking a date in week 5 needs 30+ Tab presses.
Fix: Standard calendar-grid pattern — `role="grid"`/`role="gridcell"`, one row-scoped `tabindex=0`, arrow keys move focus within the grid.
Suggested command: `/impeccable harden`

**[P3] Two cosmetic detector findings**: a thin-border/wide-shadow combo on the Hero's `TiltCard`, and 35 characters of uppercase body text on `/apercu-carte`'s rotation-instruction line. Neither is functionally broken; both are worth a look in a polish pass.
Suggested command: `/impeccable polish`

**Confirmed still open from the 2026-08-13/14 critiques** (not new, but the user should know these weren't part of the fixes made so far):

**[P1] Payment screen still doesn't carry the emotional weight of the transaction's peak moment.** Confirmed unchanged: plain white card, generic method icons, no recipient/amount restated inside the card. The new "Paiement en cours…" loading state is a same-color text swap with no spinner/pulse — functional but minimal, easy to miss on a slow connection, at the single highest-stakes moment in the flow.
Suggested command: `/impeccable delight`

**[P2] Hero's "Prendre rendez-vous" / "notre boutique en ligne" links still go nowhere** (`href="#"`, on both the intro-gate and the Hero underneath — the first screen every visitor sees, twice).
Suggested command: `/impeccable harden`

**[P2] No step/progress indicator across the ~9-screen flow**; the recap badge is the only progress proxy, and it's now one tap away on mobile instead of always-visible.
Suggested command: `/impeccable shape`

**[P3] Disabled "Continuer" buttons still give no textual reason why** (color change only) — confirmed still true, e.g. an under-minimum custom amount disables the button with no inline "too low" message even though a static hint exists above the field.
Suggested command: `/impeccable clarify`

**Already fixed since the last critique** (verified, no action needed): recap badge mobile overlap/overflow, back-link mobile wrapping, the `/coordonnees-destinataire` two-screen split, the `#a27576` contrast token, the `/recapitulatif` white-rectangle rendering bug, and the `/montant/personnalise` native number spinner.

## Persona Red Flags

**Sam (Accessibility/Keyboard)**: Hits the calendar's 47-tab-stop path directly. Focus rings are present and visible everywhere tested, but purely the browser default (`outline: auto`) — no custom focus-ring design exists in `app/globals.css`, and it clips awkwardly against the `rounded-3xl`/`rounded-full` shapes used throughout.

**Casey (Distracted Mobile User)**: Hits the hover-only/no-active-state gap directly on every tap in the flow, and is also the persona most likely to trigger the P1 back/forward-transition bypass via OS edge-swipe-back, turning a slick checkout into one with an unexplained flash-cut mid-flow.

**Jordan (First-Timer / efficiency expectations)**: Would notice the back-nav inconsistency fast — "the app remembers how it just moved me forward" is an expectation once trained by the forward transition — and would find the calendar's 47-tab-stop path actively punishing if navigating by keyboard.

## Minor Observations

- TiltCard's tilt-tracking listens on `window`, not the card element itself — it tracks pointer position anywhere on the page, not just while hovering the card. Worth confirming that's intentional (it currently reads as a deliberate "ambient" effect, not obviously a bug).
- SiteLogo's icon-only popover button has no visible text content, but its accessible name almost certainly resolves via the nested logo image's `alt` text — flagged by Assessment B as initially confusing during testing, not a confirmed accessibility bug.
- The recap-badge eye-toggle button remains in the DOM at desktop viewport (just CSS-hidden via `sm:hidden`) — expected/correct, noted only so it isn't misread as a stray element by a future automated pass.
- Payment's method buttons ("Mobile Money", "Carte bancaire", "PayPal") share one `handlePay` handler and all disable/relabel correctly during the simulated 700ms loading state.

## Questions to Consider

- If browser back/forward looks broken next to your hand-tuned forward transition, is the fix animating it too — or would a bolder move (locking navigation to the in-app back link only) be more honest than a half-fix?
- Every *bespoke* interaction (tilt, orbit, watercolor, diagonal cut) got real engineering attention, while every *stock* interaction (hover states, focus rings, calendar keyboard nav) got none — is that a resourcing signal worth naming, i.e. is delight work crowding out baseline-interactivity work?
- The recap panel now has real information architecture (collapsed vs. inline) but no motion budget yet — was that an intentional cut, or does "done" currently stop at "renders correctly" before "moves correctly"?
