---
title: "Code Review — Contact Form Phone Validation (2026-09-25)"
type: audit-log
status: active
created: 2026-09-25
updated: 2026-09-26
ai_generated: true
review_status: fixed
canonical: false
---

# Scope

`/code-review` run against ChardWorkz. Working tree was clean and in sync with origin, so the review target fell back to the tip commit `8184ba1` ("Contact form validation fix") — `frontend/src/app/customer_home/contact/contact_page/contact.html` + `contact.ts`.

Cross-checked against `frontend/src/app/core/utils/ph-phone.util.ts` and the analogous phone-warning pattern already in `frontend/src/app/register/register/register.ts`.

# Findings (4)

1. **`contact.ts:151` — stale success message can coexist with a fresh validation error.** The new phone-validation early-return in `onSubmit` never resets the `submitted` signal. A user who successfully submits once, then resubmits with a cleared/invalid phone, sees both "Your email app should now be open..." and "Enter a valid phone number." at the same time.

2. **`contact.ts:130` — `onPhoneInput` never clears/recomputes `phoneWarning`.** After a failed submit sets the warning text, typing a corrected valid number doesn't clear it — the stale error stays on screen until the next Send click.

3. **`contact.ts:150` — phone validity is judged from the `customerPhoneDisplay` signal, not the live DOM value.** Unlike name/email/message (read directly from the element), the phone check depends on the `(input)` event having fired. Any autofill path that sets the field's value without a native `input` event leaves the signal empty, so a visually-filled, correct number gets rejected.

4. **Root cause / design note:** Contact reimplements PH-phone-warning as a manually set/cleared signal instead of reusing the live computed-getter pattern already established in `register.ts` (`get customerPhoneWarning()`, recomputed on every check, never stale). Findings 1–3 stem from this divergence; adopting the same computed-getter approach would fix all three at once.

# Recommendation

Not fixed yet — findings only, per the review scope. Suggest port `register.ts`'s computed-getter pattern into `contact.ts` rather than patching the three symptoms separately.

# Resolution (2026-09-26)

Fixed in `29d24e0` — `phoneWarning` is now a computed getter (mirrors `register.ts`'s `customerPhoneWarning`) instead of a manually set/cleared signal. Resolves all 4 findings: it recomputes live off `customerPhoneDisplay()` so it clears on correction (#2), a failed submit resets `submitted` so the stale success message can't coexist with a fresh error (#1), and it now shares the same live-signal-based validity check as the accepted `register.ts` pattern (#3/#4).
