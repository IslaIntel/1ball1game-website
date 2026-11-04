# Winter Streetball capacity and waitlist

Six Winter Streetball groups, 12 children each for the whole program. Child 13 and later join a free waitlist and are never charged. The code is built and tested on this branch. It is **off** until `NEXT_PUBLIC_WINTER_CAP_ENABLED=true`; with the switch off, Winter checkout works exactly as it does on `main`.

## Derek’s answers (email “Changes to 1ball1game.org”, Nov 4)

| Question | Answer |
| --- | --- |
| Editor access to the sheet and its Apps Script | Done |
| Six groups, 12 each | Confirmed |
| Existing winter children to map into groups | None. All Winter and Spring sign-ups so far are tests |
| Which account sends parent emails | registration@1ball1game.org, a Google account (the sheet’s `App Settings` tab and `Email Log` already send as it) |
| Checkout hold | 30 minutes |
| Waitlist offer | 48 hours |
| Who offers open places | Derek, from the registration account |

## Sessions

| Day | Time | Group | Session ID |
| --- | --- | --- | --- |
| Monday | 5–6 pm | 2nd grade girls | `winter-2026-mon-1700-2g` |
| Monday | 6–7 pm | 2nd grade boys | `winter-2026-mon-1800-2b` |
| Wednesday | 5–6 pm | 4th grade girls | `winter-2026-wed-1700-4g` |
| Wednesday | 6–7 pm | 4th grade boys | `winter-2026-wed-1800-4b` |
| Thursday | 5–6 pm | 3rd grade girls | `winter-2026-thu-1700-3g` |
| Thursday | 6–7 pm | 3rd grade boys | `winter-2026-thu-1800-3b` |

## How it works

The registration spreadsheet stays the only list of record. No database.

- **Capacity script** (`apps-script/winter-capacity/Code.js`): a standalone Apps Script project, separate from Derek’s existing registration manager so nothing in that manager can break. It writes one row per child to a new tab, `Winter_2026_Enrollment`, in spreadsheet `1IYFeKojySg6eN9eOl5xikUeqod7CnO3eyyQX97r9TmM`. Every write runs inside `LockService.getScriptLock()`: it counts the children, writes the new child, then answers. Two families cannot both take the last place.
- **Counting:** `confirmed`, `checkout_hold` and `offer_reserved` take a place, scholarships included. `waitlisted`, `released` and `cancelled` do not. Enrollment status and payment status are separate columns.
- **IDs:** each family gets `registration_id = reg_<fingerprint>` (same family submitting again gets the same ID), and each child `player_id = <registration_id>:<n>`, the same `id:n` pattern the sheet’s Team Assignments tab uses.

Registration flow with the switch on:

1. The players step has a **Weekly session** picker per child, limited to that child’s grade, showing places left or “Full — Join the free waitlist” (`GET /api/sessions`).
2. Entering the review step calls `POST /api/register/reserve`. The script holds a place for each child who fits (30 minutes) and waitlists the rest. The parent sees every child’s result before paying.
3. Payment covers only children holding a place. The server reads that count from the script, never from the browser. A scholarship code covers only those children; a waitlisted child never redeems a code.
4. All children waitlisted: no Stripe at all. The button says “Join the free waitlist”, and `POST /api/register` saves them at $0.
5. The verified Stripe webhook (`payment_intent.succeeded`) confirms the places. Repeating it changes nothing, so a retried webhook cannot add a row, a charge or a seat.
6. `/api/cron/release-holds` runs every 5 minutes (`vercel.json`). For an expired hold or offer it cancels the Stripe payment first and frees the place only once Stripe reports the payment cannot succeed. A payment that went through at the last moment is confirmed instead.
7. Waves still receives its usual row, plus `registration_id`, `program`, `enrolled_count`, `waitlisted_count`, `enrollment_json`, and per child `player_N_player_id`, `player_N_session_id`, `player_N_enrollment_status`, `player_N_payment_status`, `player_N_waitlisted_at`.
8. Confirmation screen and email show each child as enrolled or “Waitlisted — no payment collected”. A waitlist-only family is never promised a place.

Waitlist offers: Derek opens the staff page (link below), sees counts and each group’s waitlist in timestamp order, and clicks **Offer next place**. The earliest waitlisted child gets `offer_reserved` for 48 hours and an email from registration@ with a link to `/register/offer?token=…`. They pay through Stripe there; nothing is ever charged automatically. When payment succeeds the script confirms the child and emails them. Unused offers expire through the same cron.

Spring interest registration and existing Fall rows are untouched.

## Turning it on

1. **Create the script** while signed in as registration@1ball1game.org: script.new, paste `Code.js`, and replace the manifest with `appsscript.json` (Project Settings → show manifest).
2. **Script properties:** `SHARED_SECRET` and `STAFF_KEY` (two long random strings), `SITE_URL=https://1ball1game.org`.
3. **Deploy** → New deployment → Web app → Execute as *me* (registration@), Who has access *Anyone*. Approve the Sheets and send-mail permissions. Copy the `/exec` URL.
4. **Vercel environment variables (Production and Preview):** `CAPACITY_SCRIPT_URL` (the `/exec` URL), `CAPACITY_SCRIPT_SECRET` (same as `SHARED_SECRET`), `CRON_SECRET` (any long random string).
5. **Test on the Vercel preview** with Stripe test keys and `NEXT_PUBLIC_WINTER_CAP_ENABLED=true` (checklist below).
6. Clear the test rows from `Winter_2026_Enrollment`, merge, set `NEXT_PUBLIC_WINTER_CAP_ENABLED=true` on Production, and redeploy.
7. Give Derek the staff page: `<exec URL>?key=<STAFF_KEY>`.

## Tests

`npm run test:capacity` runs `Code.js` in Node against an in-memory sheet (14 tests): 12th child placed and 13th waitlisted at $0, two families racing for the last place, mixed siblings, scholarships counting, repeated reserve, changing session, repeated payment confirmation, expiry and release, payment after release, release never touching a confirmed child, offers (earliest first, held, emailed, expiring), offer acceptance, and unknown sessions.

Also checked end to end with the site running against that script locally: the session picker shows “Full — Join the free waitlist”, a mixed sibling registration charges $175 for the one child with a place, and a waitlist-only family submits at $0 with no card, with the Waves row and email marked waitlisted.

Still to test on the preview with the deployed script and Stripe test mode: real lock contention (two browsers on the last place), card payment and webhook confirmation, hold expiry cancelling a real PaymentIntent, and an offer end to end.
