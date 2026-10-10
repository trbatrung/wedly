import test from "node:test";
import assert from "node:assert/strict";
import { lunarLabel, toLunar } from "../lib/lunar";
import {
  calendarEvent,
  csvCell,
  defaultInvitation,
  normalizeRsvp,
  publicInvitation,
  rsvpCsv,
  rsvpStatus,
  rsvpSummary,
  splitNames,
  upsertRsvp,
} from "../lib/invitation";
import { demoRsvps, demoWorkspace, emptyWorkspace } from "../lib/demo";
import {
  invitationSchema,
  rsvpInputSchema,
  workspaceSchema,
  type Rsvp,
} from "../lib/types";

test("lunar dates match known Tết and leap months", () => {
  for (const tet of ["2023-01-22", "2024-02-10", "2025-01-29", "2026-02-17"])
    assert.deepEqual(
      { day: toLunar(tet).day, month: toLunar(tet).month },
      { day: 1, month: 1 },
    );
  assert.equal(lunarLabel("2026-09-25"), "Nhằm ngày 15 tháng 08 năm Bính Ngọ");
  assert.equal(
    lunarLabel("2026-02-16"),
    "Nhằm ngày 29 tháng 12 năm Ất Tỵ",
    "the eve of Tết still belongs to the previous lunar year",
  );
  assert.deepEqual(toLunar("2025-07-25"), {
    day: 1,
    month: 6,
    year: 2025,
    leap: true,
  });
});

test("public invitations never expose private wedding or sheet data", () => {
  const state = demoWorkspace();
  const wedding = state.weddings[0];
  const invitation = {
    ...state.invitations[0],
    token: "11111111-1111-4111-8111-111111111111",
    sheetUrl:
      "https://script.google.com/macros/s/AKfycbPrivateEndpoint123/exec",
  };
  const pub = publicInvitation(wedding, invitation, state.teamName);
  const text = JSON.stringify(pub);
  for (const secret of [
    "AKfycbPrivateEndpoint123",
    invitation.token,
    wedding.note,
    String(wedding.budget),
  ])
    assert.equal(text.includes(secret), false, `leaked ${secret}`);
  assert.equal(pub.names, wedding.couple, "empty names fall back to couple");
  assert.ok(pub.mapUrl.startsWith("https://www.google.com/maps/search/"));
  assert.deepEqual(
    pub.events.map((e) => e.time),
    ["09:00", "17:30", "18:30", "19:00"],
  );
});

test("invitation settings validate links and stay compatible", () => {
  const wedding = demoWorkspace().weddings[1];
  const base = defaultInvitation(wedding);
  assert.ok(invitationSchema.safeParse(base).success);
  for (const sheetUrl of [
    "https://evil.example/macros/s/AKfycbxxxxxxxxxx/exec",
    "http://script.google.com/macros/s/AKfycbxxxxxxxxxx/exec",
    "https://script.google.com/macros/s/AKfycbxxxxxxxxxx/dev",
  ])
    assert.equal(
      invitationSchema.safeParse({ ...base, sheetUrl }).success,
      false,
      sheetUrl,
    );
  assert.ok(
    invitationSchema.safeParse({
      ...base,
      sheetUrl: "https://script.google.com/macros/s/AKfycbxxxxxxxxxx/exec",
    }).success,
  );
  assert.equal(
    invitationSchema.safeParse({ ...base, mapUrl: "javascript:alert(1)" })
      .success,
    false,
  );
  // Workspaces saved before invitations existed still load.
  const legacy: Record<string, unknown> = { ...emptyWorkspace() };
  delete legacy.invitations;
  assert.deepEqual(workspaceSchema.parse(legacy).invitations, []);
});

test("guest answers are normalized to the invitation rules", () => {
  const input = rsvpInputSchema.parse({
    id: crypto.randomUUID(),
    name: "  Trần Thu Hà ",
    phone: "",
    attending: false,
    guests: 4,
    guestNames: "Ba người bạn",
    side: "bride",
    dietary: "Ăn chay",
    message: "",
  });
  const declined = normalizeRsvp(input, {
    maxGuests: 2,
    askDietary: true,
    askSide: false,
  });
  assert.equal(declined.name, "Trần Thu Hà");
  assert.equal(declined.guests, 0, "declined answers bring no companions");
  assert.equal(declined.guestNames, "");
  assert.equal(declined.dietary, "");
  assert.equal(declined.side, "", "side is dropped when not asked");
  const attending = normalizeRsvp(
    { ...input, attending: true },
    { maxGuests: 2, askDietary: true, askSide: true },
  );
  assert.equal(attending.guests, 2, "companions are capped by the invitation");
  assert.equal(attending.dietary, "Ăn chay");
  assert.equal(
    rsvpInputSchema.safeParse({ ...input, name: "   " }).success,
    false,
  );
});

test("a second answer from the same device updates instead of duplicating", () => {
  const [first] = demoRsvps(demoWorkspace());
  const edited: Rsvp = {
    ...first,
    attending: false,
    guests: 0,
    createdAt: new Date().toISOString(),
  };
  const list = upsertRsvp([first], edited);
  assert.equal(list.length, 1);
  assert.equal(list[0].attending, false);
  assert.equal(list[0].createdAt, first.createdAt, "first answer time is kept");
  assert.throws(
    () => upsertRsvp([first], { ...edited, weddingId: "nam-linh" }),
    /không thuộc/,
  );
});

test("headcount counts companions and only attending guests", () => {
  const summary = rsvpSummary(demoRsvps(demoWorkspace()));
  assert.equal(summary.responses, 6);
  assert.equal(summary.attendingParties, 5);
  assert.equal(summary.attendingPeople, 9);
  assert.equal(summary.declined, 1);
  assert.equal(summary.bride + summary.groom, 9);
  assert.equal(summary.tables, 1);
  assert.equal(rsvpSummary([]).tables, 0);
});

test("CSV export escapes text and neutralizes spreadsheet formulas", () => {
  assert.equal(csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`);
  assert.equal(csvCell("+84 90"), "'+84 90");
  assert.equal(csvCell("Hà, Nội"), '"Hà, Nội"');
  const csv = rsvpCsv(demoRsvps(demoWorkspace()));
  assert.ok(csv.startsWith("﻿Họ tên,"));
  assert.equal(csv.split("\r\n").length, 7);
});

test("RSVP closes after the wedding day and calendar uses Vietnam time", () => {
  assert.equal(
    rsvpStatus({ rsvpEnabled: true, date: "2026-11-15" }, "2026-11-15"),
    "open",
  );
  assert.equal(
    rsvpStatus({ rsvpEnabled: true, date: "2026-11-15" }, "2026-11-16"),
    "closed",
  );
  assert.equal(
    rsvpStatus({ rsvpEnabled: false, date: "2026-11-15" }, "2026-11-01"),
    "off",
  );
  const state = demoWorkspace();
  const pub = publicInvitation(state.weddings[0], state.invitations[0], "");
  const { google, ics } = calendarEvent(pub);
  // 09:00 in Vietnam is 02:00 UTC.
  assert.ok(google.includes("dates=20261115T020000Z/20261115T060000Z"));
  assert.ok(ics.includes("DTSTART:20261115T020000Z"));
  assert.deepEqual(splitNames("Minh & Anh"), ["Minh", "Anh"]);
  assert.deepEqual(splitNames("Trang và James"), ["Trang", "James"]);
  assert.deepEqual(splitNames("Gia đình"), ["Gia đình", null]);
});
