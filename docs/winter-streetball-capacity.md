# Winter Streetball capacity and waitlist

Handoff for the next coding agent. Nothing in this document is built. The live site is unchanged.

Do not add a database. Derek’s pricing tier stays as it is. The registration spreadsheet is the only list of record. Copy the Complex Miami Wave pattern: the website asks an Apps Script web app on the sheet, the script takes `LockService.getScriptLock()`, counts the rows, and writes the child before it answers. Two submissions cannot take the same last place.

Reference implementation (not in this repo):

- `Desktop/complex/scripts/events-sheet/Code.gs`
- `Desktop/complex/lib/events/registrations.ts`
- `Desktop/complex/docs/events-google-sheet.md`

## What Derek asked for

Winter Streetball at https://1ball1game.org/register has six groups. Each group holds 12 children for the whole winter program. Child 13 and later join a free waitlist and are not charged.

| Day | Time | Group | Capacity | Session ID |
| --- | --- | --- | --- | --- |
| Monday | 5–6 pm | 2nd grade girls | 12 | `winter-2026-mon-1700-2g` |
| Monday | 6–7 pm | 2nd grade boys | 12 | `winter-2026-mon-1800-2b` |
| Wednesday | 5–6 pm | 4th grade girls | 12 | `winter-2026-wed-1700-4g` |
| Wednesday | 6–7 pm | 4th grade boys | 12 | `winter-2026-wed-1800-4b` |
| Thursday | 5–6 pm | 3rd grade girls | 12 | `winter-2026-thu-1700-3g` |
| Thursday | 6–7 pm | 3rd grade boys | 12 | `winter-2026-thu-1800-3b` |

Rules already agreed with the client:

- Enforce the cap in the sheet script before any payment starts.
- Count children, including scholarships. Count a child who is enrolled, who has an active checkout hold, or who has a reserved waitlist offer. Do not count a waitlisted child. Count children, not form rows and not revenue divided by price.
- Show remaining places on the form. When a group is full, show “Full — Join the free waitlist.” Check again on submit.
- Each child has their own session and enrollment status. Siblings can split. Show both outcomes before payment. Charge only the children who received a place. Keep the $175 winter price and the current scholarship behavior.
- A waitlist-only registration saves the child, the session, and a waitlist timestamp, sets amount due to $0, and never collects or authorizes a card. Confirmation page and email say “Waitlisted — no payment collected” and do not promise a place.
- Confirm enrollment from the verified Stripe webhook. Release an abandoned hold only after checkout can no longer collect payment. Suggested hold: 30 minutes, then cancel the PaymentIntent and release the row. Suggested waitlist offer: 48 hours. Derek has not confirmed those windows.
- Staff offer the next waitlist family, in timestamp order, with an expiring link. Never charge a waitlisted family automatically.
- Leave Spring interest registration alone. Leave existing Fall rows alone.
- Leave the cap off until current winter children are assigned to these six groups and the counts look right.

## How registration works today

Winter checkout has no session field and no capacity check. `RegistrationForm` collects grade and gender. Gender includes “Prefer not to say,” so the parent must choose the group explicitly. Grade must match the group.

Payment is a Stripe PaymentIntent for `playerCount *` the Winter Streetball price (`getWinterStreetballPrice`). A 100% scholarship redeems through `POST /api/register/scholarship` and skips the card. The webhook `payment_intent.succeeded` calls `submitRegistration`.

`submitRegistration` in `src/lib/submit-registration.ts` POSTs one JSON row to the Waves webhook (`REGISTER_WEBHOOK_URL`, default in that file). Waves appends the row to the Google Sheet. This app never calls Sheets or Apps Script.

Sheet:

- Spreadsheet ID: `1IYFeKojySg6eN9eOl5xikUeqod7CnO3eyyQX97r9TmM`
- Tab: `1B1G_Fall_2026_Registration_Import`

Spring uses `POST /api/register` with `paymentStatus: "not_required"`. Do not put Spring through the cap.

## What to build

1. Add a per-child session picker on the winter form and show remaining places from the sheet script.
2. On winter submit, call the script once per child, in form order, while the script holds its lock. The script writes the child as `checkout_hold`, `confirmed` (scholarship), or `waitlisted` before responding.
3. Start Stripe only for children in `checkout_hold`. Amount is the current unit price times those children. Apply a 100% scholarship only to children who received a place. Do not redeem a code for a waitlisted child.
4. On `payment_intent.succeeded`, tell the script to move those children from `checkout_hold` to `confirmed` and set payment status to `paid`. A repeated webhook must not add another row or another seat.
5. On hold expiry, cancel the PaymentIntent first. Release the seat only after Stripe reports the payment can no longer succeed.
6. Keep posting the existing Waves row so current sheet columns still fill. Add structured fields per child: registration ID, player ID, season (`Winter 2026`), program (`winter-streetball`), session ID, enrollment status, payment status, amount due, amount paid, waitlist timestamp, and reservation or offer expiration. Enrollment status and payment status stay separate.
7. Staff action, in the sheet script, offers the earliest waitlisted child a place and emails a pay link. Accepting the link uses the same payment path. No automatic charge.

Proposed columns, added without rewriting existing cells:

`registration_id`, `player_id`, `season`, `program`, `session_id`, `enrollment_status`, `payment_status`, `amount_due_cents`, `amount_paid_cents`, `waitlisted_at`, `reservation_expires_at`

Enrollment status: `confirmed`, `checkout_hold`, `waitlisted`, `offer_reserved`, `released`, `cancelled`.

Payment status: `unpaid`, `pending`, `paid`, `scholarship`, `failed`, `refunded`.

## Still needed from Derek before the cap is turned on

- Editor access to the spreadsheet and the Apps Script already attached to it. Extend that script if it already counts caps.
- Confirmation of the six groups and the limit of 12.
- A pass over existing winter children so each one is tagged to a session. Flag rows that do not match a group.
- Which Google account sends the parent emails. `registration@1ball1game.org` is a GoDaddy mailbox and cannot send Apps Script mail unless it is connected. Complex sends from the Google account that owns the sheet.
- Confirm the 30-minute checkout hold and the 48-hour waitlist offer.
- Who on staff offers the next waiting family. Put that action in the sheet.

## Test before enabling the limit

The 12th child enrolls. The 13th is waitlisted at $0 with no card. Two simultaneous submits cannot both take the last place. Mixed siblings charge only the enrolled child. A scholarship child counts toward 12. An abandoned payment releases its hold only after the PaymentIntent can no longer collect. A repeated Stripe webhook does not duplicate the row, the charge, or the seat. A waitlist offer reserves the place, expires, and never charges by itself. Spring interest registration and existing Fall rows still behave as they do now.
