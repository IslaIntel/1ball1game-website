# Winter Streetball capacity and waitlist

Six Winter Streetball groups, 12 children each for the whole program. Child 13 and later join a free waitlist and are never charged. The code is built and tested on this branch. It is **off** until `NEXT_PUBLIC_WINTER_CAP_ENABLED=true`; with the switch off, Winter checkout works exactly as it does on `main`.

## Where it stands (Nov 4, 2026)

The cap is on for this branch’s Vercel preview only. Production, including https://1ball1game.org, is unchanged.

Done:

- Standalone Apps Script project “1B1G Winter Streetball capacity” (script id `1eBMZcZnZe5p2rjkV4JJiyqrwnQDspSjnRJ-pHKBu4i4067zevuo9auAu`). Time zone is Eastern (`America/New_York`). Deployed as a web app, execute as Julius, access Anyone. Script properties are set. The `/exec` URL is in Vercel and is not copied here.
- Waves flow “1B1G Winter Streetball offer emails” is published. It sends from “Registration (1ball1game)”. The published flow does not check `EMAIL_WEBHOOK_KEY`; the webhook URL has to stay private and is stored only in the script properties.
- Column DH of `1B1G_Fall_2026_Registration_Import` is headed `registration_id`. The Register flow (https://waves.islaintel.com/projects/j8Ijs5ZElEgqR3dz8Xd3K/flows/oQwh7JAcfDrZ8CgUvymgO) maps `{{trigger['body']['registration_id']}}` to that header and is published.
- Preview env on project `1ball1game-website`, branch `feature/winter-streetball-capacity` only: `CAPACITY_SCRIPT_URL`, `CAPACITY_SCRIPT_SECRET`, `CRON_SECRET`, and `NEXT_PUBLIC_WINTER_CAP_ENABLED=true`. Those names are not set on Production.
- Preview rebuilt and ready: https://1ball1game-website-git-feature-winter-streetba-0a48c1-islaintel.vercel.app/register

Still open, and the reason it is not on the live site:

- The preview bundle uses the live Stripe publishable key (`pk_live_…`). A completed card payment on this preview would be a real charge. Do not enter a real card there. The paid, hold-expiry, and offer checks still need a test-mode run.
- A preview registration writes to the real registration sheet and can email the address typed into the form. Use an obviously fake child name, and delete those rows from both tabs before production.
- Derek offers places from the staff page. Give him that link only when he says to go live. Do not put `STAFF_KEY` or the other secrets in email or in this file.
- Derek asked for an update on the evening of Nov 4. The reply below is drafted and not sent.

## Draft reply to Derek (not sent)

Reply on the thread “Changes to 1ball1game.org” from julius@islaintel.com. To: derek.davison10@gmail.com. Cc: otto@islaintel.com.

Hi Derek,

Sorry this took longer than the last note suggested. We sat down and walked through the Winter cap together so I could see it finished before writing you.

The live site is unchanged. The test copy is ready for you to look at:

https://1ball1game-website-git-feature-winter-streetba-0a48c1-islaintel.vercel.app/register

Each of the six groups stops at 12 children. A child who gets a place is the only one who would be charged, still $175, scholarships included. Child 13 and later join the free waitlist and are not asked for a card. The confirmation says “Waitlisted — no payment collected.” Your existing registration sheet and manager are untouched. New children are listed on a separate tab, Winter_2026_Enrollment. Parent emails, including waitlist and offer notes, go out from registration@1ball1game.org. An unfinished payment holds a place for 30 minutes. A waitlist offer stays open for 48 hours, and you send that offer from the registration account. Nobody is charged unless they accept.

Please use a name that is obviously a test, such as Test Child. This copy is connected to your real registration sheet, so that row will show up, and we will delete every test row before anything goes live.

One caution: the payment screen on this copy is the real card form. Please stop when you reach it and do not enter a card. You can still see the session list and how many places are left. Right now every group is open, because there are no real Winter sign-ups.

Here is the check we want you to see before we go further:

1. Open the link and choose Winter Streetball, Monday 5–6 pm, 2nd grade girls. You should see places remaining.
2. Enter one fake parent and one child named Test Child. Stop at the card screen.
3. The cases we still need to confirm with you are the 12th child getting a place, the 13th child joining the free waitlist at $0, one sibling in and one waiting with a charge only for the child who got a place, an abandoned payment giving the place back, and you offering the next family a link to accept and pay.

We will not turn this on at 1ball1game.org until you say so. If the preview looks right, tell me and we will deploy it.

Best,
Julius

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

## Emails

- Registration emails stay on Waves. The site posts its row to the Waves webhook; the "Email Parent Confirmation" step already sends `parent_email_subject` / `parent_email_html` for Winter, so enrolled, mixed and "Waitlisted — no payment collected" emails go out from registration@ through Waves with no flow change. The team email includes each child's session and status.
- The waitlist **offer** email and the **enrolled after accepting an offer** email are built by the capacity script and handed to a small Waves flow, "1B1G Winter Streetball offer emails" (Catch Webhook → Gmail send with the "Registration (1ball1game)" connection). Every parent email therefore comes from registration@ through Waves. The published flow does not check `EMAIL_WEBHOOK_KEY`. Keep the webhook URL private.

## Waves column mapping

Waves' "Insert Row" step maps fields by header name. Column DH of `1B1G_Fall_2026_Registration_Import` is `registration_id`, and the published Register flow maps `{{trigger['body']['registration_id']}}` to that header. The other new fields stay in `Winter_2026_Enrollment`. DG is still `player_6_notes`.

## Turning it on

The script no longer needs to run as registration@ (Waves sends the emails), so anyone who can edit the sheet can deploy it. Julius owns the sheet.

1. **Waves:** create the "1B1G Winter Streetball offer emails" flow above and publish it. Note its webhook URL and pick a long random `EMAIL_WEBHOOK_KEY`.
2. **Create the script** (signed in as the sheet owner or an editor): script.new, paste `Code.js`, and replace the manifest with `appsscript.json` (Project Settings → show manifest).
3. **Script properties:** `SHARED_SECRET`, `STAFF_KEY` (long random strings), `SITE_URL=https://1ball1game.org`, `EMAIL_WEBHOOK_URL`, `EMAIL_WEBHOOK_KEY`.
4. **Deploy** → New deployment → Web app → Execute as *me*, Who has access *Anyone*. Approve the Sheets and external-request permissions. Copy the `/exec` URL.
5. **Vercel environment variables (Preview first):** `CAPACITY_SCRIPT_URL` (the `/exec` URL), `CAPACITY_SCRIPT_SECRET` (same as `SHARED_SECRET`), `CRON_SECRET` (long random string), and `NEXT_PUBLIC_WINTER_CAP_ENABLED=true` for the preview branch only.
6. **Test on the preview.** The current preview uses the live Stripe key, so do not complete a real card payment there. Switch that preview to test keys before the paid checks in the list below.
7. **Sheet:** done. `registration_id` is the header in column DH, and the Register flow maps it.
8. Clear the test rows from `Winter_2026_Enrollment` and from the import tab, merge, set the same variables on Production with `NEXT_PUBLIC_WINTER_CAP_ENABLED=true`, and redeploy. Do this only after Derek says to go live.
9. Give Derek the staff page: `<exec URL>?key=<STAFF_KEY>`. Do not send the key until then.

## Tests

`npm run test:capacity` runs `Code.js` in Node against an in-memory sheet (14 tests): 12th child placed and 13th waitlisted at $0, two families racing for the last place, mixed siblings, scholarships counting, repeated reserve, changing session, repeated payment confirmation, expiry and release, payment after release, release never touching a confirmed child, offers (earliest first, held, emailed, expiring), offer acceptance, and unknown sessions.

Also checked end to end with the site running against that script locally: the session picker shows “Full — Join the free waitlist”, a mixed sibling registration charges $175 for the one child with a place, and a waitlist-only family submits at $0 with no card, with the Waves row and email marked waitlisted.

Still to test against the deployed script: real lock contention (two browsers on the last place), card payment and webhook confirmation, hold expiry cancelling a real PaymentIntent, and an offer end to end. The ready preview currently loads a live Stripe key, so those card checks need test keys first. Derek’s look at the form should stop before the card screen.
