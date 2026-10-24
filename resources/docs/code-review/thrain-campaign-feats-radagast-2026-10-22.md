Reviewer: Radagast-Reviewer-1 - model: github-copilot/claude-opus-5.5
Scope: Uncommitted Thrain changes vs HEAD (characters/thrain_eisenkolben/**, check.cjs); staged image moves and .gitignore treated as prior user work
Verdict: Requested feat/ability corrections are arithmetically correct, consistent across tabs, and covered by passing `node check.cjs`; one residual "supplied build as authority" wording conflicts with the campaign-rules-only requirement.

Verified (no action): base 13/10/12/15/14/8 + dwarf CON/WIS + Dwarf Fortitude CON + L4/L8 INT + Squat STR = 14/10/14/17/15/8; INT +3, WIS +2; DC 8+4+3=15; mutagens 3/long rest; Endurance 3 THP, Power +3, Reflexes/Senses +3 (Perception +9, Survival +5, Acrobatics +7); Stonecunning +11; Craft/Investigation +7, Perception +6; to-hit +6 / +8 under Fury; speed 30. Fury text matches campaign draft (Prerequisite dwarf; +2 attack/damage vs the damaging creature until end of first round). Squat Nimbleness STR/DEX matches draft. Six feats listed cultural/general by level 1/1/3/5/7/9. No remaining "Old Hatred", "DC 16", "4 / long rest", INT 18/+4 references. Image `src` attributes only repointed to `images/` matching the staged moves; not otherwise altered. `node check.cjs` → PASS.

## Findings

1. **ID:** R1
   **Severity:** LOW
   **Title:** "Supplied build as authority" wording remains, contradicting campaign-rules-only requirement
   **Location:** characters/thrain_eisenkolben/tabs/mutant.html:L2, L9, L47, L62, L70; tabs/dwarf.html:L2; tabs/sheet.html:L40, L44
   **Category:** correctness
   **Evidence:** mutant.html:2 "Campaign draft with the supplied Thrain build as authority"; mutant.html:70 "Supplied build overrides are intentionally retained"; mutant.html:62 / sheet.html:44 Limit Removal "Supplied damage rule is used, not the draft's alternate exhaustion result"; dwarf.html:2 "Campaign dwarf traits and the supplied character build". The edited sheet notice and dwarf note now say only campaign effects apply, so the tabs disagree about rule precedence.
   **Why it matters:** Readers get conflicting precedence statements; the Limit Removal override is an explicit non-campaign rule still in force if the user meant "campaign rules only" globally.
   **Recommended fix:** Confirm with the user whether "campaign rules only" covers Mutant features. If yes, reword the notices to "Campaign draft rules" and align Limit Removal with the draft's result; if the scope is feats/abilities only, reword notices to state that the only retained override is Limit Removal level/damage.
   **Fix confidence:** MEDIUM - depends on intended scope of the requirement (feats only vs whole build).

Merge risk: LOW - all requested values verified and tested; only residual precedence wording outside the explicit request.
