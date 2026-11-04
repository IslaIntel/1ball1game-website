// Runs Code.js in Node with in-memory stand-ins for the Apps Script services.
// Usage: node --test apps-script/winter-capacity/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import vm from "node:vm";

const SOURCE = readFileSync(new URL("./Code.js", import.meta.url), "utf8");
const SECRET = "test-secret";
const PRICE = 17500;
const MON_GIRLS = "winter-2026-mon-1700-2g";
const MON_BOYS = "winter-2026-mon-1800-2b";

function load() {
  const grid = [];
  const mail = [];
  let lockHeld = false;
  let lockAcquisitions = 0;

  const sheet = {
    getDataRange: () => ({ getValues: () => grid.map((r) => r.slice()) }),
    getRange: (row, col, numRows, numCols) => ({
      setValues: (values) => {
        assert.equal(numRows, 1);
        grid[row - 1] = values[0].slice(0, numCols);
      },
    }),
    appendRow: (values) => {
      assert.ok(lockHeld, "rows must only be written while holding the lock");
      grid.push(values.slice());
    },
    getLastRow: () => grid.length,
    setFrozenRows: () => {},
  };
  const spreadsheet = {
    getSheetByName: () => (grid.length ? sheet : null),
    insertSheet: () => sheet,
  };

  const context = {
    SpreadsheetApp: { openById: () => spreadsheet, flush: () => {} },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => {
          assert.equal(lockHeld, false, "lock must not be re-entered");
          lockHeld = true;
          lockAcquisitions++;
          return true;
        },
        releaseLock: () => {
          lockHeld = false;
        },
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (name) =>
          ({
            SHARED_SECRET: SECRET,
            STAFF_KEY: "staff",
            SITE_URL: "https://example.test",
            EMAIL_WEBHOOK_URL: "https://waves.example.test/hook",
            EMAIL_WEBHOOK_KEY: "email-key",
          })[name],
      }),
    },
    Utilities: { getUuid: () => randomUUID(), formatDate: (d) => d.toISOString() },
    UrlFetchApp: {
      fetch: (url, options) => {
        const body = JSON.parse(options.payload);
        assert.equal(body.key, "email-key");
        mail.push({ to: body.to, subject: body.subject, htmlBody: body.html });
        return { getResponseCode: () => 200 };
      },
    },
    ContentService: {
      createTextOutput: (text) => ({ setMimeType: () => ({ text }) }),
      MimeType: { JSON: "json" },
    },
    HtmlService: { createHtmlOutput: (html) => ({ setTitle: () => ({ html }) }) },
    Date,
    JSON,
    Math,
    Number,
    String,
    Object,
  };
  vm.createContext(context);
  vm.runInContext(SOURCE, context);

  const call = (action, body = {}, now = new Date("2026-11-10T15:00:00Z")) =>
    context.handleRequest_({ secret: SECRET, action, ...body }, now);

  return { call, grid, mail, context, locks: () => lockAcquisitions };
}

function child(n, sessionId, reg = "reg_a") {
  return { playerId: `${reg}:${n}`, sessionId, playerName: `Kid ${reg} ${n}` };
}

function fill(call, sessionId, count, now) {
  for (let i = 0; i < count; i++) {
    const reg = `reg_fill_${sessionId}_${i}`;
    const r = call(
      "reserve",
      { registrationId: reg, unitPriceCents: PRICE, parentEmail: `${i}@x.test`, children: [child(1, sessionId, reg)] },
      now,
    );
    assert.ok(r.ok);
    call("confirm", { registrationId: reg, paymentStatus: "paid", amountPaidCentsPerChild: PRICE }, now);
  }
}

test("rejects requests without the shared secret", () => {
  const { context } = load();
  const r = context.handleRequest_({ action: "availability" }, new Date());
  assert.equal(r.ok, false);
});

test("12th child gets a place, 13th is waitlisted at $0", () => {
  const { call } = load();
  fill(call, MON_GIRLS, 11);
  const twelfth = call("reserve", { registrationId: "r12", unitPriceCents: PRICE, children: [child(1, MON_GIRLS, "r12")] });
  assert.equal(twelfth.children[0].enrollmentStatus, "checkout_hold");
  assert.equal(twelfth.children[0].amountDueCents, PRICE);

  const thirteenth = call("reserve", { registrationId: "r13", unitPriceCents: PRICE, children: [child(1, MON_GIRLS, "r13")] });
  assert.equal(thirteenth.children[0].enrollmentStatus, "waitlisted");
  assert.equal(thirteenth.children[0].amountDueCents, 0);
  assert.ok(thirteenth.children[0].waitlistedAt);

  const s = call("availability").sessions.find((x) => x.id === MON_GIRLS);
  assert.equal(s.occupied, 12);
  assert.equal(s.remaining, 0);
  assert.equal(s.waitlistCount, 1);
  assert.equal(s.label, "Full — Join the free waitlist");
});

test("two families racing for the last place: only one gets it", () => {
  const { call, locks } = load();
  fill(call, MON_GIRLS, 11);
  const before = locks();
  const a = call("reserve", { registrationId: "ra", unitPriceCents: PRICE, children: [child(1, MON_GIRLS, "ra")] });
  const b = call("reserve", { registrationId: "rb", unitPriceCents: PRICE, children: [child(1, MON_GIRLS, "rb")] });
  assert.equal(locks() - before, 2, "each reserve runs inside its own lock");
  const statuses = [a.children[0].enrollmentStatus, b.children[0].enrollmentStatus].sort();
  assert.equal(statuses.join(","), "checkout_hold,waitlisted");
});

test("siblings split: one held, one waitlisted, only the held one owes money", () => {
  const { call } = load();
  fill(call, MON_BOYS, 12);
  const r = call("reserve", {
    registrationId: "rs",
    unitPriceCents: PRICE,
    children: [child(1, MON_GIRLS, "rs"), child(2, MON_BOYS, "rs")],
  });
  const [girl, boy] = r.children;
  assert.equal(girl.enrollmentStatus, "checkout_hold");
  assert.equal(boy.enrollmentStatus, "waitlisted");
  assert.equal(girl.amountDueCents + boy.amountDueCents, PRICE);
});

test("scholarship children count toward the 12", () => {
  const { call } = load();
  fill(call, MON_GIRLS, 11);
  call("reserve", { registrationId: "rsch", unitPriceCents: PRICE, children: [child(1, MON_GIRLS, "rsch")] });
  call("confirm", { registrationId: "rsch", paymentStatus: "scholarship", amountPaidCentsPerChild: 0 });
  const s = call("availability").sessions.find((x) => x.id === MON_GIRLS);
  assert.equal(s.occupied, 12);
});

test("repeating reserve does not take a second place", () => {
  const { call } = load();
  const body = { registrationId: "rr", unitPriceCents: PRICE, children: [child(1, MON_GIRLS, "rr")] };
  call("reserve", body);
  call("reserve", body);
  call("reserve", body);
  const s = call("availability").sessions.find((x) => x.id === MON_GIRLS);
  assert.equal(s.occupied, 1);
});

test("changing the session gives the old place back", () => {
  const { call } = load();
  call("reserve", { registrationId: "rc", unitPriceCents: PRICE, children: [child(1, MON_GIRLS, "rc")] });
  call("reserve", { registrationId: "rc", unitPriceCents: PRICE, children: [child(1, MON_BOYS, "rc")] });
  const sessions = call("availability").sessions;
  assert.equal(sessions.find((x) => x.id === MON_GIRLS).occupied, 0);
  assert.equal(sessions.find((x) => x.id === MON_BOYS).occupied, 1);
});

test("repeated payment confirmation changes nothing the second time", () => {
  const { call, grid } = load();
  call("reserve", { registrationId: "rp", unitPriceCents: PRICE, children: [child(1, MON_GIRLS, "rp")] });
  call("attach_payment", { registrationId: "rp", paymentIntentId: "pi_1" });
  const first = call("confirm", { registrationId: "rp", paymentIntentId: "pi_1", amountPaidCentsPerChild: PRICE });
  const rowsAfterFirst = grid.length;
  const second = call("confirm", { registrationId: "rp", paymentIntentId: "pi_1", amountPaidCentsPerChild: PRICE });
  assert.equal(first.confirmed.length, 1);
  assert.equal(second.confirmed.length, 0);
  assert.equal(grid.length, rowsAfterFirst);
  assert.equal(call("availability").sessions.find((x) => x.id === MON_GIRLS).occupied, 1);
});

test("abandoned holds show up as expired after 30 minutes, then release", () => {
  const { call } = load();
  const start = new Date("2026-11-10T15:00:00Z");
  call("reserve", { registrationId: "rx", unitPriceCents: PRICE, children: [child(1, MON_GIRLS, "rx")] }, start);
  call("attach_payment", { registrationId: "rx", paymentIntentId: "pi_x" }, start);

  assert.equal(call("expired", {}, new Date("2026-11-10T15:29:00Z")).expired.length, 0);
  const expired = call("expired", {}, new Date("2026-11-10T15:31:00Z")).expired;
  assert.equal(expired.length, 1);
  assert.equal(expired[0].paymentIntentId, "pi_x");

  // Still counts until the site has cancelled the payment and released it.
  assert.equal(call("availability").sessions.find((x) => x.id === MON_GIRLS).occupied, 1);
  call("release", { playerIds: ["rx:1"], reason: "Hold expired" });
  assert.equal(call("availability").sessions.find((x) => x.id === MON_GIRLS).occupied, 0);
});

test("payment that lands after release is still confirmed, never lost", () => {
  const { call } = load();
  call("reserve", { registrationId: "rl", unitPriceCents: PRICE, children: [child(1, MON_GIRLS, "rl")] });
  call("attach_payment", { registrationId: "rl", paymentIntentId: "pi_l" });
  call("release", { playerIds: ["rl:1"] });
  const r = call("confirm", { registrationId: "rl", paymentIntentId: "pi_l", amountPaidCentsPerChild: PRICE });
  assert.equal(r.confirmed.length, 1);
});

test("release never removes a confirmed child", () => {
  const { call } = load();
  call("reserve", { registrationId: "rk", unitPriceCents: PRICE, children: [child(1, MON_GIRLS, "rk")] });
  call("confirm", { registrationId: "rk", amountPaidCentsPerChild: PRICE });
  const r = call("release", { playerIds: ["rk:1"] });
  assert.equal(r.released.length, 0);
});

test("waitlist offer goes to the earliest child, reserves the place, emails, and expires", () => {
  const { call, mail } = load();
  fill(call, MON_GIRLS, 12);
  call("reserve", { registrationId: "w1", parentEmail: "first@x.test", unitPriceCents: PRICE, children: [child(1, MON_GIRLS, "w1")] }, new Date("2026-11-10T15:00:00Z"));
  call("reserve", { registrationId: "w2", parentEmail: "second@x.test", unitPriceCents: PRICE, children: [child(1, MON_GIRLS, "w2")] }, new Date("2026-11-10T15:05:00Z"));

  assert.equal(call("offer", { sessionId: MON_GIRLS }).ok, false, "no offer while full");

  call("cancel", { playerIds: [`reg_fill_${MON_GIRLS}_0:1`] });
  const now = new Date("2026-11-11T12:00:00Z");
  const offered = call("offer", { sessionId: MON_GIRLS, unitPriceCents: PRICE }, now);
  assert.equal(offered.ok, true);
  assert.equal(offered.child.playerId, "w1:1");
  assert.equal(offered.child.paymentStatus, "unpaid", "an offer never charges");
  assert.equal(mail.length, 1);
  assert.equal(mail[0].to, "first@x.test");

  const s = call("availability", {}, now).sessions.find((x) => x.id === MON_GIRLS);
  assert.equal(s.occupied, 12, "the offered place is held");
  assert.equal(s.waitlistCount, 1);

  const token = mail[0].htmlBody.match(/token=([a-f0-9]+)/)[1];
  assert.equal(call("offer_lookup", { token }, now).ok, true);
  assert.equal(call("offer_lookup", { token }, new Date("2026-11-13T12:01:00Z")).ok, false);
  assert.equal(call("expired", {}, new Date("2026-11-13T12:01:00Z")).expired[0].playerId, "w1:1");
});

test("accepting an offer confirms the child and sends the enrolled email", () => {
  const { call, mail } = load();
  fill(call, MON_GIRLS, 12);
  call("reserve", { registrationId: "wo", parentEmail: "p@x.test", unitPriceCents: PRICE, children: [child(1, MON_GIRLS, "wo")] });
  call("cancel", { playerIds: [`reg_fill_${MON_GIRLS}_0:1`] });
  call("offer", { sessionId: MON_GIRLS });
  call("attach_payment", { playerIds: ["wo:1"], paymentIntentId: "pi_o" });
  const r = call("confirm", { playerIds: ["wo:1"], paymentIntentId: "pi_o", amountPaidCentsPerChild: PRICE, notify: true });
  assert.equal(r.confirmed[0].enrollmentStatus, "confirmed");
  assert.equal(mail.at(-1).subject, "Welcome to Winter Streetball at Lemon Road!");
});

test("unknown session is rejected before anything is written", () => {
  const { call, grid } = load();
  const r = call("reserve", { registrationId: "ru", children: [child(1, "nope", "ru")] });
  assert.equal(r.ok, false);
  assert.equal(grid.length, 0);
});
