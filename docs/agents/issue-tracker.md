# Issue tracker: beads

Issues live in beads (`bd`), a Dolt-backed graph tracker whose database is `.beads/`.

- **CLI:** `bd`. No markdown TODO lists for task tracking.
- **Daily flow:** `bd ready` (claimable work) · `bd show <id>` (detail) ·
  `bd update <id> --claim` (claim) · `bd close <id>` (done).
- **New issues:** `bd create`. **Durable facts:** `bd remember`.
- **Consumers:** `to-spec` publishes finished specs here; `triage` reads/writes
  labels here.
- **Full workflow context:** `bd prime`. Agent skill: `.agents/skills/beads/SKILL.md`.
