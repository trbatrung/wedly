# Wedly handoff

Last updated: 10 October 2026 (evening), Vietnam time — Claude Code.

## Goal and owner decisions

Revive the abandoned Wedly prototype as a fully Vietnamese workspace for professional wedding planning teams. Existing work is scattered across Zalo, spreadsheets and email. Busy-season coordination, convenient input and clear oversight are the commercial focus.

The owner knows planners; no real-team pilot is agreed yet. Initial pricing discussed as a hypothesis: a seasonal team package, not a validated market price. Do not invent paying customers or endorsements.

The owner requested clear sans-serif typography with no cursive, and a built-in scaled floorplan configured from dimensions/table count/stage size. They authorized pushing and deploying once the interface is done, and said current priority is reviewing UI rather than connecting all live services immediately.

## Repository and hosting

- GitHub: https://github.com/trbatrung/wedly (existing public repository, verified).
- Vercel project: `wedly`, account/team `trbatrungs-projects`.
- Production domain: https://wedly-sepia.vercel.app.
- Current branch: `main`. Rebuild preserved on `codex/vietnamese-rebuild`.
- Initial release code commit: `71404b04c6c0260fc78791b471de4733b8f9ab3a`, pushed to GitHub via existing SSH authentication.
- Vercel production deployment: `dpl_GDxjY6QGaqq548ub8rwqAvwT6RBh`, READY, aliased to the production domain.
- The expired HTTPS credential was replaced with the existing GitHub SSH remote. `git push origin main` now works.
- Vercel environment variables were empty when checked. Supabase and Anthropic account setup remains necessary for live features.
- No secret values are stored in these files. Do not print `git remote -v`; the current remote can include embedded credentials.

## Implementation

New landing page, shared workspace, dashboard, wedding CRUD, tasks, vendor/payment tracking, screenshot inbox/review, floorplan editor, assistant panel, demo couple portal and live share portal. All product text is Vietnamese and currency is VND. CSS uses system sans-serif fonts.

Demo runs without keys: localStorage for structured state and IndexedDB for images. Pasted text uses conservative rule-based parsing; real image analysis is disabled and clearly labeled. Assistant demo supports deterministic navigation. Do not present these as an AI integration.

Live backend code: Supabase email login, owner/member team membership and invitation links, private storage, revision-checked workspace saves, screenshot upload/read/retention, Anthropic image extraction and assistant actions, quota enforcement, and authenticated cleanup. SQL and account instructions are in README/supabase. These have not been exercised against a configured live Supabase project yet.

Money safety: separate quote/agreed/planned/paid fields; payment confirmations require review; prevent replay of the same source and duplicate transaction references; reject payments exceeding agreed amounts. Unknown dates/vendors remain unresolved.

Floorplan: input meters, round tables/seats, rectangular stage, generate non-overlapping rows, pointer/keyboard/numeric movement within bounds, save with wedding, overlap/capacity indicators, entrance object, SVG export and print/PDF.

Image expiry: deny live reads after 48h; physical deletion requires configured Supabase cron calling `/api/cleanup` every five minutes. Demo cleanup runs while/opening the browser only. Keep chosen evidence explicitly. The 48h deadline is based on upload, not latest view.

## UI refinement — 10 October

The owner said the UI had too much text and supplied their Edge8 Team portal as a reference. Learn its hierarchy and compact rows; do not copy private company content, staff photos or tasks.

Implemented: shorter navigation and page headings, personal home greeting, compact clickable summary strip, four priority task rows first, wedding list rows on the home screen, smaller wedding cards in the directory, dark forest navigation, removal of repeated explanations/promotional panels, shorter screenshot review labels and assistant prompts. Demo status and payment confirmation remain explicit. Modal focus now goes to the first input and remains stable while editing.

Build, typecheck and all 12 business/geometry tests passed for this refinement. Browser checks covered desktop and 390px mobile navigation/overflow, sample screenshot review, and unchanged paid totals after confirming a planned deposit. Real AI/data services remain unconfigured.

Usage preference: GPT/Codex only must check its account allowance during substantial work when that information is available, and stop with a clear handoff when either Codex usage window reaches 15% remaining. The owner explicitly exempted Claude Code from this rule. Latest check during this pass was 58% short-window and 77% weekly remaining; this was not a budget stop. Do not invent allowance figures when another agent cannot read them.

## Validation and active work

Production build, TypeScript and all 12 business/geometry tests passed in the canonical workspace. Browser QA covered desktop (1365px), mobile (390px), wedding creation, screenshot upload/preview, reviewing a planned deposit without adding to paid totals, generating/saving/reloading a 28-table floorplan, and keyboard positioning. A mobile stretch issue was fixed. Floorplan zoom and selected-object dimensions are available. Live Supabase/Anthropic integration is not configured or end-to-end tested.

The old local dependencies stalled reads. Fresh dependencies are now installed in the canonical workspace and its build/typecheck/tests pass. Ignored backups `.wedly-dependencies-backup` and `.wedly-next-backup` preserve old generated files. A temporary check directory at `/private/tmp/wedly-rebuild-check` was used during recovery; it is not needed to continue development. The Next build root is explicitly this project.

An interrupted attempt to move the old dependencies may have left a partial directory at `/private/tmp/wedly-old-dependencies-20261009`; it is not application source. Preserve unrelated tracked `.DS_Store` edits.

## Invitations and navigation — 10 October (Claude Code)

Owner asked for much easier navigation and for online invitations like a hand-built GitHub Pages wedding site whose RSVP form writes to a Google Sheet through Apps Script. Built into the portal instead:

- Per-wedding online invitation (new wedding tab "Thiệp mời"): headline, message, auto-computed lunar date (Hồ Ngọc Đức method, UTC+7, tested against Tết 2023–2027 and the 2025 leap month), schedule, venue + Google Maps link, dress code, RSVP, FAQ templates, thank-you note, contact, Google/phone calendar links, 4 colour themes, optional cover image URL. Editor with live phone preview; publish/unpublish. Guest page is sans-serif (Be Vietnam Pro via next/font), mobile-first, `noindex`.
- Guest list (tab "Khách mời"): headcount incl. companions, groom/bride side, dietary, table estimate linked to the floorplan ("N khách xác nhận → dùng M bàn"), manual add for phone confirmations, CSV export with spreadsheet-formula guard. Couple portal shows aggregate counts + invitation link only.
- Google Sheets: optional Apps Script snippet (copy button in editor) that upserts one row per answer. Live: server forwards answers best-effort; the script URL stays server-side and is validated to `script.google.com/macros/s/…/exec`. Demo: "Gửi dòng thử" and demo answers post from the browser (no-cors, so success cannot be confirmed by the browser).
- Data: `invitations` in the workspace payload (old payloads default to `[]`). Guest answers are NOT in the revision-checked payload: demo uses localStorage `wedly-rsvps-v1`; live uses new table from `supabase/invitations.sql` (formerly `rsvp.sql`) via `/api/rsvp` (public, token + publish + rate-limit checks, service role) and `/api/rsvps` (team-only, RLS). Public projection (`publicInvitation`) strips budget, notes, token and sheet URL — covered by a test.
- Navigation: ⌘K/Ctrl K or "/" quick search (diacritic-insensitive; weddings, deep links like "Minh & Anh › Khách mời", tasks, vendors, guests, actions); "Tạo mới" menu; phone bottom tab bar with + sheet; wedding tabs in the URL (`t=`) so refresh/back/shared links keep them; sticky wedding tabs; clickable breadcrumbs; wedding filter on Tasks/Chi phí/Cập nhật; "Của tôi" task filter; sidebar weddings sorted by date with countdown; clickable wedding names in task rows; heavy editors lazy-loaded.
- Fixes found during QA: phone pages scrolled sideways (dashboard grid min-content and the hidden vendor-table header escaping its scroll box); duplicate wedding title; team avatar hard-coded "NM".

Checks run in this worktree: `npm run typecheck` clean, `npm test` 23/23 (12 existing + 11 new), `npm run build` OK. Browser QA on the dev server at 1440px and 390px: palette search/Enter/Back, tab URLs, wedding filter + "Của tôi", invitation create/edit/theme/save/validation, guest-page RSVP submit → appears in guest list with correct headcount, couple portal counts, no horizontal overflow on 12 phone screens, no console/server errors. Live routes verified only for safe failure without Supabase (404/403/503). Not exercised against a configured Supabase project or a real Apps Script deployment.

Release: commit `e95dffa` pushed straight to `main` at the owner's request (fast-forward from `afd88fa`). Vercel's GitHub integration built production deployment `dpl_B5SPqqMK74J2Y4iv5Qy7evFgBT8j` (Ready, served on `wedly-sepia.vercel.app`). Production checks: `/demo`, `/demo/thiep/minh-anh`, `/demo/share/minh-anh` return 200; unknown `/thiep/<token>` 404; `/api/rsvp` 404 JSON and `/api/rsvps` 503 while Supabase is unconfigured; invitation page sends `noindex`; browser smoke test of the guests tab (6 sample answers) and the invitation page (Be Vietnam Pro loaded, lunar date shown).

## Floorplan base layouts and invitation designer — 10 October (Claude Code)

Owner feedback on production: the floorplan needs base layouts with the usual center aisle and tables grouped in 4/5/6; the invitation needs real design choices (images, typeface, colour, alignment).

- Floorplan (`lib/floorplan.ts`): `generateLayout` with center aisle (chairs keep half a gap clear of it), groups as two-row blocks (4 → 2+2, 5 → 3+2, 6 → 3+3) or single rows, configurable gaps/walkways/front clearance, even left/right split, numbering by group (front to back, left before right), stage + aisle + entrance items. Four templates ("Lối giữa · nhóm 4", "nhóm 6", "hàng 5", "Lưới đều") with thumbnails drawn by the generator and live "tối đa N bàn" capacity for the current room. Plan stores `sides` (Nhà trai/Nhà gái placement) and table `group`; headers show tables/seats per side plus RSVP confirmed guests. Old `generateFloorplan` kept (grid). Warning when a table sits on the aisle. Confirmation only when replacing manual edits.
- Invitation designer: `layout` (text/arch/photo; photo layouts fall back to text without a cover), `font` (5 pairings via next/font: Be Vietnam Pro, Cormorant Garamond, Playfair Display + Lora, Montserrat, Quicksand; all Vietnamese, no script faces, only the default preloaded), 8 palettes (`themePalettes`, inline CSS variables) + custom accent with computed tints, `align` center/left, `gallery` (≤12) with full-screen viewer, `hidden` sections. Old invitations parse with defaults (tested).
- Photos: compressed/re-encoded in the browser (strips EXIF/GPS). Demo stores them in IndexedDB `wedly-invite-photos-v1` as `local:<uuid>` refs (pruned when unreferenced); live uploads go to `/api/invite-images` → public bucket `invitation-images` (added to `supabase/invitations.sql`). Photos dropped from an invitation are deleted after the save succeeds.

Checks run: typecheck clean, 30/30 tests (new floorplan + design tests), browser QA in the demo: template capacities and generation (35 tables, groups A–F, side headers), photo upload via generated images (cover → arch layout, 4-photo album), font switch + save, album viewer (open/arrow/Esc/focus), photo hero + left align + night palette (fixed an overlay bug), no horizontal overflow at 390px and 1366px. Live photo upload not exercised (no Supabase configured).

Release: commit `580d1fb` pushed to `main`; Vercel production deployment `dpl_DpXNdouUS1yLRkp6hjC4om2RHf2c` Ready on `wedly-sepia.vercel.app`. Production checks: demo, floorplan and demo invitation return 200; template capacities render (20×25 m room: 24 / 36 / does not fit / 56 tables); all five invitation fonts load; `/api/invite-images` returns 503 while Supabase is unconfigured.

## Open branding discussion

The owner finds “Wedly” too generic/crowded and wants a new brand. No replacement name has been selected. Tentative directions: **Nhịp** (coordination/rhythm; preferred), **Nếp** (order/calm), **Nối** (bringing scattered work together). Preserve the Vietnamese-first product and clean sans-serif visual language. Names are creative candidates; domain/name availability is not established. Do not rename the app, repository or hosting project based on a tentative suggestion alone.

## Next concrete steps

1. Typecheck/build, 12 tests and desktop/mobile QA are complete.
2. Approved rebuild is pushed to main and deployed to existing Vercel production. Production `/demo` returns HTTP 200; invalid share links return 404.
3. With the owner, configure Supabase/Anthropic environment variables and SMTP, run `schema.sql`, `invitations.sql` and cleanup setup, and test tenant isolation/real screenshot analysis/physical expiry/public RSVP + Sheets forwarding against live services.
3a. Invitation follow-ups: custom short links, QR code for printed cards, Zalo/Facebook preview image (`next/og` with a Vietnamese font), optional bilingual text, guest list import, background music, seat assignment from the guest list onto floorplan groups.
4. Recruit one planner team for a pilot with three weddings. Measure the full cost of collecting and entering updates, not only AI speed.
5. Candidate extensions after pilot: minute-by-minute wedding timeline, guest list/import, couple approvals, direct integrations where access is verified, and subscription billing.

## Starting in either coding agent

Open this repository directory and ask the agent to continue from this handoff. Run `npm ci`, `npm run typecheck`, `npm test`, `npm run build`; then `npm run dev` for browser review. Check Vercel account/project before deployments. Update this handoff at each meaningful stopping point.
