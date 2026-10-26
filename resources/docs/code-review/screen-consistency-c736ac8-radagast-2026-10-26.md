Reviewer: Radagast-Reviewer-1 - model: github-copilot/claude-opus-5.5
Scope: feature/screen-consistency — commit c736ac8 (ability-block markup) plus uncommitted `check.cjs` assertion change (working tree)
Verdict: The ability markup is the same across all four sheets and the updated Thrain assertion matches the source. However, the `aria-label` on a generic `<span>` may not be announced to screen-reader users, and the assertion checks only one of the four characters.

> Limitation: shell/git access was denied in this session, so `git show c736ac8` / `git diff` could not be executed. Findings are based on the working-tree state of `check.cjs` and every `characters/*/tabs/sheet.html` ability row (grep of `class="ability"`), which is the post-change state under review.

## Findings

1. **ID:** R1
   **Severity:** MEDIUM
   **Title:** `aria-label` on a role-less `<span>` is not reliably announced
   **Location:** `characters/*/tabs/sheet.html` ability rows (e.g. `characters/thrain_eisenkolben/tabs/sheet.html:L74-L79`, `finn_wildblade/tabs/sheet.html:L227-L232`, `valen_ashwood/tabs/sheet.html:L152-L157`, `brombar_eisenknall/tabs/sheet.html:L152-L157`)
   **Category:** correctness
   **Evidence:** `<span class="modifier" aria-label="Strength modifier plus two">+2</span>`. A `<span>` has the `generic` role, and ARIA 1.2 prohibits naming a `generic` element. NVDA, JAWS and VoiceOver usually ignore the label and read "+2" instead. The visible `−1` uses U+2212, which some voices skip or read as "dash".
   **Why it matters:** The accessibility improvement this change aims for may never reach screen-reader users. They may hear "STR +2 14" with no context, or the minus sign may be dropped so a negative modifier sounds positive.
   **Recommended fix:** Use visually hidden text instead of `aria-label`, for example `<span class="modifier"><span aria-hidden="true">+2</span><span class="visually-hidden">Strength modifier plus two</span></span>`, and add a `.visually-hidden` utility to `styles.css`. Update the regex at `check.cjs:L61` to match.
   **Fix confidence:** HIGH that the issue exists (per the ARIA spec); MEDIUM on exact AT behaviour without manual screen-reader QA.

2. **ID:** R2
   **Severity:** LOW
   **Title:** The updated ability assertion checks only Thrain, so the other three sheets can drift
   **Location:** `check.cjs:L61-L70` (inside `if (character === "thrain_eisenkolben")`)
   **Category:** test-gap
   **Evidence:** The `abilities` regex and `deepEqual` sit inside the Thrain-only branch. Finn's and Valen's ability rows are never parsed, and Brombar is missing from the loop at `check.cjs:L16` even though `menuCards.length` is asserted to be 4 at L11.
   **Why it matters:** The goal of the branch is consistent screens, but a markup regression or a mismatch between `aria-label` and the visible modifier on Finn, Valen or Brombar would still pass `node check.cjs`.
   **Recommended fix:** Move the structural check out of the Thrain branch. For every character, assert six ability rows that match the regex. Also check that each label agrees with its modifier: the sign word ("plus"/"minus") must match the sign, and the number word must match the digit. Separately, consider adding `brombar_eisenknall` to the character list, or document why it is excluded.
   **Fix confidence:** MEDIUM. Brombar's exclusion may be intentional, for example because it has no tabs or HP fixture. I could not confirm this from the diff.

3. **ID:** R3
   **Severity:** LOW
   **Title:** Regex depends on exact attribute order and no whitespace
   **Location:** `check.cjs:L61`
   **Category:** maintainability
   **Evidence:** The pattern `class="ability"><span class="label"><abbr title="…">…</abbr></span><span class="modifier" aria-label="…">` has to match one exact serialization. Reordering an attribute, adding a class or inserting a line break makes the match return `[]`. The check then fails with an unhelpful `deepEqual` diff.
   **Why it matters:** It is a brittle test that adds friction to harmless markup edits, which is exactly the kind of change this branch is making.
   **Recommended fix:** First assert `abilities.length === 6` with a clear message, for example "ability row markup changed; update parser". Alternatively, extract each `<div class="ability">…</div>` block and pull the fields out with separate, smaller regexes.
   **Fix confidence:** MEDIUM.

Merge risk: LOW - The markup is consistent and the assertion matches the current source. The remaining risks are screen-reader effectiveness (R1) and test coverage (R2/R3), not a functional regression. The verdict is limited because the git diff could not be inspected directly.
