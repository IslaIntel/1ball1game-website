/**
 * Winter Streetball capacity counter.
 *
 * A standalone Apps Script project that keeps the per-child enrollment list for
 * Winter 2026 in its own tab of the registration spreadsheet. The website asks
 * this script for a place before it starts payment. Every change runs inside
 * LockService.getScriptLock(), so two families can never take the same last place.
 *
 * It does not touch the existing registration manager script or any other tab.
 *
 * Script properties (Project Settings → Script properties):
 *   SHARED_SECRET  long random string, also set as CAPACITY_SCRIPT_SECRET on Vercel
 *   STAFF_KEY      long random string for the staff page link
 *   SITE_URL       https://1ball1game.org
 *   EMAIL_WEBHOOK_URL  Waves "1B1G Winter offer emails" webhook URL
 *   EMAIL_WEBHOOK_KEY  key that Waves flow checks before sending
 *
 * Deploy as a web app: Execute as = me (any account that can edit the sheet),
 * Who has access = Anyone. Emails go out through Waves from
 * registration@1ball1game.org, like every other registration email.
 */

var SPREADSHEET_ID = '1IYFeKojySg6eN9eOl5xikUeqod7CnO3eyyQX97r9TmM';
var TAB_NAME = 'Winter_2026_Enrollment';
var SEASON = 'Winter 2026';
var PROGRAM = 'winter-streetball';
var CAPACITY = 12;
var HOLD_MINUTES = 30;
var OFFER_HOURS = 48;
var LOCK_WAIT_MS = 20000;

var SESSIONS = [
  { id: 'winter-2026-mon-1700-2g', day: 'Monday', time: '5–6 pm', group: '2nd grade girls' },
  { id: 'winter-2026-mon-1800-2b', day: 'Monday', time: '6–7 pm', group: '2nd grade boys' },
  { id: 'winter-2026-wed-1700-4g', day: 'Wednesday', time: '5–6 pm', group: '4th grade girls' },
  { id: 'winter-2026-wed-1800-4b', day: 'Wednesday', time: '6–7 pm', group: '4th grade boys' },
  { id: 'winter-2026-thu-1700-3g', day: 'Thursday', time: '5–6 pm', group: '3rd grade girls' },
  { id: 'winter-2026-thu-1800-3b', day: 'Thursday', time: '6–7 pm', group: '3rd grade boys' },
];

var HEADERS = [
  'registration_id',
  'player_id',
  'season',
  'program',
  'session_id',
  'player_name',
  'parent_name',
  'parent_email',
  'enrollment_status',
  'payment_status',
  'amount_due_cents',
  'amount_paid_cents',
  'payment_intent_id',
  'waitlisted_at',
  'reservation_expires_at',
  'offer_token',
  'created_at',
  'updated_at',
  'notes',
];

/** Statuses that take one of the 12 places. */
var OCCUPYING = { confirmed: true, checkout_hold: true, offer_reserved: true };
/** Statuses that still belong to a live registration. */
var ACTIVE = { confirmed: true, checkout_hold: true, offer_reserved: true, waitlisted: true };

// ---------------------------------------------------------------------------
// Web app entry points
// ---------------------------------------------------------------------------

function doPost(e) {
  var request;
  try {
    request = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'Invalid JSON.' });
  }
  return json_(handleRequest_(request, new Date()));
}

function doGet(e) {
  var params = (e && e.parameter) || {};
  if (params.key && params.key === prop_('STAFF_KEY')) {
    return HtmlService.createHtmlOutput(renderStaffPage_(params.key, params.message || ''))
      .setTitle('Winter Streetball places');
  }
  return json_({ ok: true, sessions: availability_(readRows_()) });
}

/** Called from the staff page buttons. */
function staffOffer(key, sessionId) {
  if (!key || key !== prop_('STAFF_KEY')) throw new Error('Not allowed.');
  var result = withLock_(function () {
    return offer_({ sessionId: sessionId }, new Date());
  });
  if (!result.ok) throw new Error(result.error);
  return 'Offer sent to ' + result.child.parentEmail + ' for ' + result.child.playerName + '.';
}

function handleRequest_(request, now) {
  if (!request.secret || request.secret !== prop_('SHARED_SECRET')) {
    return { ok: false, error: 'Not allowed.' };
  }
  var action = request.action;
  switch (action) {
    case 'availability':
      return { ok: true, sessions: availability_(readRows_()) };
    case 'registration':
      return { ok: true, children: registrationChildren_(readRows_(), request.registrationId) };
    case 'waitlist':
      return { ok: true, waitlist: waitlist_(readRows_(), request.sessionId) };
    case 'offer_lookup':
      return offerLookup_(readRows_(), request.token, now);
    case 'expired':
      return { ok: true, expired: expired_(readRows_(), now) };
    case 'reserve':
    case 'attach_payment':
    case 'confirm':
    case 'release':
    case 'cancel':
    case 'offer':
      return withLock_(function () {
        if (action === 'reserve') return reserve_(request, now);
        if (action === 'attach_payment') return attachPayment_(request, now);
        if (action === 'confirm') return confirm_(request, now);
        if (action === 'release') return release_(request, now);
        if (action === 'cancel') return cancel_(request, now);
        return offer_(request, now);
      });
    default:
      return { ok: false, error: 'Unknown action.' };
  }
}

// ---------------------------------------------------------------------------
// Actions (all writes run inside the script lock)
// ---------------------------------------------------------------------------

/**
 * Give each child a place or a waitlist spot, in form order.
 * Safe to repeat: a child who already holds a place in the same session keeps it.
 */
function reserve_(request, now) {
  var registrationId = String(request.registrationId || '');
  var children = request.children || [];
  var unitPrice = Number(request.unitPriceCents) || 0;
  if (!registrationId || !children.length) return { ok: false, error: 'Missing children.' };

  for (var c = 0; c < children.length; c++) {
    if (!sessionById_(children[c].sessionId)) {
      return { ok: false, error: 'Unknown session ' + children[c].sessionId + '.' };
    }
  }

  var rows = readRows_();
  var holdUntil = addMinutes_(now, HOLD_MINUTES).toISOString();

  children.forEach(function (child) {
    var existing = findActiveRow_(rows, child.playerId);

    if (existing && existing.session_id === child.sessionId) {
      var status = existing.enrollment_status;
      if (status === 'checkout_hold') {
        updateRow_(existing, { reservation_expires_at: holdUntil }, now);
      } else if (status === 'waitlisted' && occupied_(rows, child.sessionId) < CAPACITY) {
        // A place opened up since they joined the waitlist.
        updateRow_(existing, {
          enrollment_status: 'checkout_hold',
          payment_status: 'pending',
          amount_due_cents: unitPrice,
          reservation_expires_at: holdUntil,
        }, now);
      }
      return;
    }

    if (existing) {
      // Parent changed the session: give the old place back first.
      updateRow_(existing, {
        enrollment_status: 'released',
        reservation_expires_at: '',
        notes: appendNote_(existing.notes, 'Session changed to ' + child.sessionId),
      }, now);
    }

    var hasPlace = occupied_(rows, child.sessionId) < CAPACITY;
    appendRow_(rows, {
      registration_id: registrationId,
      player_id: child.playerId,
      season: SEASON,
      program: PROGRAM,
      session_id: child.sessionId,
      player_name: child.playerName || '',
      parent_name: request.parentName || '',
      parent_email: request.parentEmail || '',
      enrollment_status: hasPlace ? 'checkout_hold' : 'waitlisted',
      payment_status: hasPlace ? 'pending' : 'unpaid',
      amount_due_cents: hasPlace ? unitPrice : 0,
      amount_paid_cents: 0,
      payment_intent_id: '',
      waitlisted_at: hasPlace ? '' : now.toISOString(),
      reservation_expires_at: hasPlace ? holdUntil : '',
      offer_token: '',
      notes: '',
    }, now);
  });

  return { ok: true, children: registrationChildren_(rows, registrationId) };
}

/** Record which Stripe payment covers the held places, so expiry can cancel it. */
function attachPayment_(request, now) {
  var rows = readRows_();
  var touched = 0;
  rows.forEach(function (row) {
    if (!matchesTarget_(row, request)) return;
    if (row.enrollment_status !== 'checkout_hold' && row.enrollment_status !== 'offer_reserved') return;
    updateRow_(row, { payment_intent_id: request.paymentIntentId }, now);
    touched++;
  });
  return { ok: true, updated: touched };
}

/**
 * Mark held places as confirmed after a verified payment or scholarship.
 * Repeating it changes nothing, so a repeated Stripe webhook cannot add a seat.
 */
function confirm_(request, now) {
  var rows = readRows_();
  var paymentStatus = request.paymentStatus || 'paid';
  var paidEach = Number(request.amountPaidCentsPerChild) || 0;
  var confirmed = [];

  rows.forEach(function (row) {
    if (!matchesTarget_(row, request)) return;
    var status = row.enrollment_status;
    var samePayment = request.paymentIntentId && row.payment_intent_id === request.paymentIntentId;

    if (status === 'confirmed') return;
    if (status === 'checkout_hold' || status === 'offer_reserved' || (status === 'released' && samePayment)) {
      var note = status === 'released'
        ? appendNote_(row.notes, 'Payment completed after the hold was released; confirmed anyway')
        : row.notes;
      updateRow_(row, {
        enrollment_status: 'confirmed',
        payment_status: paymentStatus,
        amount_paid_cents: paidEach,
        amount_due_cents: 0,
        payment_intent_id: request.paymentIntentId || row.payment_intent_id,
        reservation_expires_at: '',
        offer_token: '',
        notes: note,
      }, now);
      confirmed.push(row);
    }
  });

  if (request.notify) {
    confirmed.forEach(function (row) {
      sendEnrolledEmail_(row);
    });
  }

  return { ok: true, confirmed: confirmed.map(publicChild_) };
}

/** Give back held or offered places. Never touches a confirmed child. */
function release_(request, now) {
  var rows = readRows_();
  var ids = toSet_(request.playerIds);
  var released = [];
  rows.forEach(function (row) {
    if (!ids[row.player_id]) return;
    if (row.enrollment_status !== 'checkout_hold' && row.enrollment_status !== 'offer_reserved') return;
    updateRow_(row, {
      enrollment_status: 'released',
      payment_status: row.payment_status === 'pending' ? 'unpaid' : row.payment_status,
      amount_due_cents: 0,
      reservation_expires_at: '',
      offer_token: '',
      notes: appendNote_(row.notes, request.reason || 'Released'),
    }, now);
    released.push(row.player_id);
  });
  return { ok: true, released: released };
}

/** Staff cancellation of a confirmed or waitlisted child. */
function cancel_(request, now) {
  var rows = readRows_();
  var ids = toSet_(request.playerIds);
  var cancelled = [];
  rows.forEach(function (row) {
    if (!ids[row.player_id] || !ACTIVE[row.enrollment_status]) return;
    updateRow_(row, {
      enrollment_status: 'cancelled',
      reservation_expires_at: '',
      offer_token: '',
      notes: appendNote_(row.notes, request.reason || 'Cancelled by staff'),
    }, now);
    cancelled.push(row.player_id);
  });
  return { ok: true, cancelled: cancelled };
}

/** Offer an open place to the earliest waitlisted child (or a chosen one). */
function offer_(request, now) {
  var rows = readRows_();
  var session = sessionById_(request.sessionId);
  if (!session) return { ok: false, error: 'Unknown session.' };
  if (occupied_(rows, session.id) >= CAPACITY) {
    return { ok: false, error: session.group + ' is full. Release or cancel a place first.' };
  }

  var waiting = waitlistRows_(rows, session.id);
  var target = request.playerId
    ? waiting.filter(function (row) { return row.player_id === request.playerId; })[0]
    : waiting[0];
  if (!target) return { ok: false, error: 'Nobody is waiting for ' + session.group + '.' };

  var token = Utilities.getUuid().replace(/-/g, '');
  updateRow_(target, {
    enrollment_status: 'offer_reserved',
    payment_status: 'unpaid',
    amount_due_cents: Number(request.unitPriceCents) || 17500,
    reservation_expires_at: addMinutes_(now, OFFER_HOURS * 60).toISOString(),
    offer_token: token,
  }, now);

  sendOfferEmail_(target, session, token);
  return { ok: true, child: publicChild_(target) };
}

// ---------------------------------------------------------------------------
// Read-only views
// ---------------------------------------------------------------------------

function availability_(rows) {
  return SESSIONS.map(function (session) {
    var occupied = occupied_(rows, session.id);
    var remaining = Math.max(0, CAPACITY - occupied);
    return {
      id: session.id,
      day: session.day,
      time: session.time,
      group: session.group,
      capacity: CAPACITY,
      occupied: occupied,
      remaining: remaining,
      waitlistCount: waitlistRows_(rows, session.id).length,
      label: remaining > 0 ? remaining + (remaining === 1 ? ' place left' : ' places left') : 'Full — Join the free waitlist',
    };
  });
}

function waitlist_(rows, sessionId) {
  return waitlistRows_(rows, sessionId).map(publicChild_);
}

function registrationChildren_(rows, registrationId) {
  return rows
    .filter(function (row) { return row.registration_id === registrationId && ACTIVE[row.enrollment_status]; })
    .map(publicChild_);
}

function expired_(rows, now) {
  return rows
    .filter(function (row) {
      if (row.enrollment_status !== 'checkout_hold' && row.enrollment_status !== 'offer_reserved') return false;
      return row.reservation_expires_at && new Date(row.reservation_expires_at).getTime() <= now.getTime();
    })
    .map(publicChild_);
}

function offerLookup_(rows, token, now) {
  if (!token) return { ok: false, error: 'Missing offer.' };
  var row = rows.filter(function (r) { return r.offer_token === token; })[0];
  if (!row || row.enrollment_status !== 'offer_reserved') {
    return { ok: false, error: 'This offer is no longer available.' };
  }
  if (new Date(row.reservation_expires_at).getTime() <= now.getTime()) {
    return { ok: false, error: 'This offer has expired.' };
  }
  return { ok: true, child: publicChild_(row) };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function occupied_(rows, sessionId) {
  return rows.filter(function (row) {
    return row.session_id === sessionId && OCCUPYING[row.enrollment_status];
  }).length;
}

function waitlistRows_(rows, sessionId) {
  return rows
    .filter(function (row) { return row.session_id === sessionId && row.enrollment_status === 'waitlisted'; })
    .sort(function (a, b) { return new Date(a.waitlisted_at).getTime() - new Date(b.waitlisted_at).getTime(); });
}

function findActiveRow_(rows, playerId) {
  return rows.filter(function (row) { return row.player_id === playerId && ACTIVE[row.enrollment_status]; })[0];
}

function matchesTarget_(row, request) {
  if (request.playerIds && request.playerIds.length) return toSet_(request.playerIds)[row.player_id] === true;
  return row.registration_id === request.registrationId;
}

function publicChild_(row) {
  return {
    registrationId: row.registration_id,
    playerId: row.player_id,
    sessionId: row.session_id,
    playerName: row.player_name,
    parentEmail: row.parent_email,
    enrollmentStatus: row.enrollment_status,
    paymentStatus: row.payment_status,
    amountDueCents: Number(row.amount_due_cents) || 0,
    amountPaidCents: Number(row.amount_paid_cents) || 0,
    paymentIntentId: row.payment_intent_id || '',
    waitlistedAt: row.waitlisted_at || '',
    reservationExpiresAt: row.reservation_expires_at || '',
  };
}

function sessionById_(id) {
  return SESSIONS.filter(function (s) { return s.id === id; })[0];
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) {
    return { ok: false, error: 'Busy. Please try again.' };
  }
  try {
    return fn();
  } finally {
    SpreadsheetApp.flush();
    lock.releaseLock();
  }
}

function sheet_() {
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(TAB_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(TAB_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Every row as an object, with _row set to its sheet row number. */
function readRows_() {
  var sheet = sheet_();
  var values = sheet.getDataRange().getValues();
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = { _row: i + 1, _sheet: sheet };
    for (var h = 0; h < HEADERS.length; h++) {
      var value = values[i][h];
      row[HEADERS[h]] = value instanceof Date ? value.toISOString() : value === undefined ? '' : value;
    }
    if (row.player_id) rows.push(row);
  }
  rows._sheet = sheet;
  return rows;
}

function appendRow_(rows, fields, now) {
  var stamp = now.toISOString();
  var row = { created_at: stamp, updated_at: stamp };
  HEADERS.forEach(function (h) { if (fields[h] !== undefined) row[h] = fields[h]; });
  var sheet = rows._sheet;
  sheet.appendRow(HEADERS.map(function (h) { return row[h] === undefined ? '' : row[h]; }));
  row._row = sheet.getLastRow();
  row._sheet = sheet;
  rows.push(row);
  return row;
}

function updateRow_(row, fields, now) {
  Object.keys(fields).forEach(function (key) { row[key] = fields[key]; });
  row.updated_at = now.toISOString();
  row._sheet
    .getRange(row._row, 1, 1, HEADERS.length)
    .setValues([HEADERS.map(function (h) { return row[h] === undefined ? '' : row[h]; })]);
}

function appendNote_(existing, note) {
  return existing ? existing + ' | ' + note : note;
}

function toSet_(list) {
  var set = {};
  (list || []).forEach(function (item) { set[item] = true; });
  return set;
}

function addMinutes_(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function prop_(name) {
  return PropertiesService.getScriptProperties().getProperty(name);
}

function json_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Emails: handed to Waves, which sends them from registration@1ball1game.org
// ---------------------------------------------------------------------------

function sendEmail_(to, subject, html) {
  var url = prop_('EMAIL_WEBHOOK_URL');
  if (!url) throw new Error('EMAIL_WEBHOOK_URL is not set.');
  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ key: prop_('EMAIL_WEBHOOK_KEY'), to: to, subject: subject, html: html }),
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() >= 300) {
    throw new Error('Email webhook failed with ' + response.getResponseCode());
  }
}

function sendOfferEmail_(row, session, token) {
  var link = (prop_('SITE_URL') || 'https://1ball1game.org') + '/register/offer?token=' + token;
  var deadline = Utilities.formatDate(
    new Date(row.reservation_expires_at), 'America/New_York', "EEEE, MMMM d 'at' h:mm a",
  );
  var when = session.day + 's, ' + session.time + ' (' + session.group + ')';
  sendEmail_(
    row.parent_email,
    'A Winter Streetball place is open for ' + row.player_name,
      '<p>Hi ' + escapeHtml_(row.parent_name || 'there') + ',</p>' +
      '<p>Good news: a place opened up in Winter Streetball at Lemon Road for <strong>' +
      escapeHtml_(row.player_name) + '</strong> — ' + escapeHtml_(when) + '.</p>' +
      '<p>We are holding it until <strong>' + escapeHtml_(deadline) + ' (Eastern)</strong>. ' +
      'To take it, register and pay $175 here:</p>' +
      '<p><a href="' + link + '">Accept this place</a></p>' +
      '<p>Nothing is charged unless you accept and pay. If you no longer need the place, ' +
      'you can ignore this email and it will go to the next family.</p>' +
      '<p>Best,<br>The 1B1G Team</p>',
  );
}

function sendEnrolledEmail_(row) {
  var session = sessionById_(row.session_id);
  var when = session ? session.day + 's, ' + session.time + ' (' + session.group + ')' : row.session_id;
  sendEmail_(
    row.parent_email,
    'Welcome to Winter Streetball at Lemon Road!',
      '<p>Hi ' + escapeHtml_(row.parent_name || 'there') + ',</p>' +
      '<p>Your payment is complete and <strong>' + escapeHtml_(row.player_name) +
      '</strong> is enrolled in Winter Streetball at Lemon Road: ' + escapeHtml_(when) + '.</p>' +
      '<p>Sessions run the weeks of Nov 30th – Jan 18th (make up week of Jan 25th) at the ' +
      'Lemon Road Elementary Gym.</p>' +
      '<p>See you on the court,<br>The 1B1G Team</p>',
  );
}

// ---------------------------------------------------------------------------
// Staff page
// ---------------------------------------------------------------------------

function renderStaffPage_(key) {
  var rows = readRows_();
  var sections = availability_(rows).map(function (s) {
    var waiting = waitlistRows_(rows, s.id);
    var list = waiting.length
      ? '<ol>' + waiting.map(function (w) {
          return '<li>' + escapeHtml_(w.player_name) + ' — ' + escapeHtml_(w.parent_email) +
            ' <small>(waiting since ' + escapeHtml_(String(w.waitlisted_at).slice(0, 16).replace('T', ' ')) + ' UTC)</small></li>';
        }).join('') + '</ol>'
      : '<p class="muted">Nobody waiting.</p>';
    var button = waiting.length && s.remaining > 0
      ? '<button onclick="offer(\'' + s.id + '\', this)">Offer next place</button>'
      : '';
    return '<section><h2>' + escapeHtml_(s.day + ' ' + s.time + ' · ' + s.group) + '</h2>' +
      '<p><strong>' + s.occupied + ' / ' + s.capacity + '</strong> taken · ' + s.remaining +
      ' open · ' + s.waitlistCount + ' waiting</p>' + list + button + '</section>';
  }).join('');

  return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<style>body{font-family:Arial,sans-serif;max-width:760px;margin:24px auto;padding:0 16px;color:#0a1138}' +
    'section{border:1px solid #ddd;border-radius:12px;padding:12px 16px;margin:12px 0}h2{font-size:17px;margin:4px 0}' +
    '.muted{color:#777}button{background:#e2269d;color:#fff;border:0;border-radius:999px;padding:8px 16px;cursor:pointer}' +
    '#msg{font-weight:bold}</style></head><body><h1>Winter Streetball places</h1>' +
    '<p>Places count children who are enrolled, mid-payment, or holding an offer. Offers last ' + OFFER_HOURS +
    ' hours and never charge anyone on their own.</p><p id="msg"></p>' + sections +
    '<script>function offer(id,btn){btn.disabled=true;btn.textContent="Sending…";' +
    'google.script.run.withSuccessHandler(function(m){document.getElementById("msg").textContent=m;setTimeout(function(){location.reload()},1500)})' +
    '.withFailureHandler(function(e){document.getElementById("msg").textContent=e.message;btn.disabled=false;btn.textContent="Offer next place"})' +
    '.staffOffer(' + JSON.stringify(key) + ',id)}</script></body></html>';
}
