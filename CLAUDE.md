# Continuing Wedly in Claude Code

Read `AGENTS.md`, `docs/HANDOFF.md`, and `README.md` first. They contain the agreed product direction, architectural decisions, current deployment, known limitations and validation commands.

@AGENTS.md
@docs/HANDOFF.md

This repository is the continuity source. Continue the existing implementation and honor the owner's recorded constraints; do not restart the project or ask them to repeat the planning conversation. Check `git status` and the latest commits before editing.

Product priorities: Vietnamese throughout, readable sans-serif UI, convenient team workflows, screenshots reviewed before financial updates, 48h default image retention, and a simple scaled floorplan editor.

Never print raw Git remotes or credentials. Never commit secrets. Distinguish working demo interactions from services that still need account configuration.

After work, update `docs/HANDOFF.md` with the changes, checks actually run, remaining blockers and next concrete steps. Keep the handoff short and factual so either Claude Code or Codex can resume from it.
