Reviewer: Radagast-Reviewer-1 - model: github-copilot/claude-opus-5.5
Scope: Uncommitted working-tree changes on `offline-static-site` (new `package.json`, modified `README.md`), follow-up to `offline-static-site-radagast-2026-10-21.md` (main...HEAD)
Verdict: The npm shortcut is correct, dependency-free, and documented accurately; no regressions found.

## Verification performed

- `package.json`: `private: true`, no `dependencies`/`devDependencies`; scripts `dev` = `python3 -m http.server 8000 --bind 127.0.0.1` (byte-identical to the documented Python command), `build` = `node build.cjs`, `check` = `node check.cjs`. Both target files exist.
- `npm run dev`: npm resolved and executed the exact Python command. Port 8000 was already held by another local server in this environment (`OSError: [Errno 98] Address already in use`), which is the same behavior the plain Python command has — not a script defect.
- `npm run check`: `PASS: source/offline content, embedded assets, unique IDs, local anchors, recorded HP, tab click, keyboard navigation, and history state.` Working tree unchanged afterward (`offline/` is git-ignored).
- README: plain Python command retained, `npm run dev` vs `npm dev` caveat correct (`dev` is not a built-in npm alias), "no `npm install` needed" is true since there are no dependencies. Plain HTML / `file://` offline flow untouched.

## Findings

No actionable findings.

Notes (not findings): `package.json` is currently untracked — remember to `git add` it with the README change, or the README will reference scripts that don't exist. `.idea/` is also untracked and should not be committed.

Merge risk: LOW - additive scripts alias existing commands verbatim, add no dependencies, and `npm run check` passes.
