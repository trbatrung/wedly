# Wedly handoff

Last updated: 10 October 2026, Vietnam time.

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

## Open branding discussion

The owner finds “Wedly” too generic/crowded and wants a new brand. No replacement name has been selected. Tentative directions: **Nhịp** (coordination/rhythm; preferred), **Nếp** (order/calm), **Nối** (bringing scattered work together). Preserve the Vietnamese-first product and clean sans-serif visual language. Names are creative candidates; domain/name availability is not established. Do not rename the app, repository or hosting project based on a tentative suggestion alone.

## Next concrete steps

1. Typecheck/build, 12 tests and desktop/mobile QA are complete.
2. Approved rebuild is pushed to main and deployed to existing Vercel production. Production `/demo` returns HTTP 200; invalid share links return 404.
3. With the owner, configure Supabase/Anthropic environment variables and SMTP, run schema/cleanup setup, and test tenant isolation/real screenshot analysis/physical expiry against live services.
4. Recruit one planner team for a pilot with three weddings. Measure the full cost of collecting and entering updates, not only AI speed.
5. Candidate extensions after pilot: minute-by-minute wedding timeline, guest list/import, couple approvals, direct integrations where access is verified, and subscription billing.

## Starting in either coding agent

Open this repository directory and ask the agent to continue from this handoff. Run `npm ci`, `npm run typecheck`, `npm test`, `npm run build`; then `npm run dev` for browser review. Check Vercel account/project before deployments. Update this handoff at each meaningful stopping point.
