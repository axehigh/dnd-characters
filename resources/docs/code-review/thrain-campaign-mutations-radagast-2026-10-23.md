Reviewer: Radagast-Reviewer-1 - model: github-copilot/claude-opus-5.5
Scope: Uncommitted working tree vs HEAD in dnd-characters — Thrain feat and secondary-mutation correction (`characters/thrain_eisenkolben/tabs/{dwarf,images,mutant,play,sheet,tactics}.html`, `characters/thrain_eisenkolben/thrain_eisenkolben.html`, `check.cjs`, staged image renames into `characters/thrain_eisenkolben/images/`). `.gitignore` and `resources/docs/` were excluded because they are not part of this task.
Verdict: All six feats, all four mutation acquisition levels and prerequisites, the ability scores, and the derived values match the campaign extracted text. The only finding is one low-severity problem with check robustness.

## Verification summary (against `resources/D&D&E_arbeidsfil_extracted.txt`)

- **Feat slots (Table 1, lines 0111–0146):** L1 cultural + general, L3 general, L4 +1 ability, L5 cultural, L7 general, L8 +1 ability, L9 cultural. The recorded feats are Dwarf Fortitude and Heavily Armoured at L1, Durable at L3, Fury at L5, Fell-handed at L7, and Squat Nimbleness at L9. Each feat uses the correct slot type.
- **Dwarf Fortitude (0810–0812):** +1 CON (maximum 20) and a Dodge + Hit Die heal of 1d12+CON. ✓
- **Fury (0816–0818):** +2 attack and damage against a creature that damaged you, until the end of your first round after the damage. ✓ The text does not present it as a passive bonus.
- **Squat Nimbleness (0838–0840):** +1 STR or DEX, so +1 STR is legal. It also gives +5 ft speed and Acrobatics or Athletics (Acrobatics chosen; Athletics already comes from race), plus grapple-escape advantage. ✓
- **Heavily Armoured (1098–1100):** the prerequisite is medium armour proficiency. The Mutant has light/medium/shields (4900). ✓
- **Durable (1077–1079):** the minimum is 2×CON mod = 4. ✓
- **Fell-handed (1083–1085):** the prerequisite is 6th level or higher, and it is taken at L7. ✓ The bonus is +half PB = +2. ✓
- **Secondary mutations (4913; Mutant table 4818–4853):** the Mutations column goes 2 at L2, 3 at L6 and 4 at L9. That gives two at L2 and one each at L6 and L9. ✓
  - Spines (5129–5130): no prerequisite, taken at L2. ✓
  - Nocturnal (5106–5108): requires not having Hibernation, which is not selected. It gives 120 ft darkvision and a 1 h sleep + 7 h light-activity rest, taken at L2. ✓
  - Quadrupedal (5114–5115): requires 6th level, taken at L6. ✓
  - Healing Surge (5082–5084): requires 3rd level, taken at L9. ✓
  - Limit Removal (5096–5098, prerequisite 6th level) is no longer recorded as active anywhere in Thrain's HTML (grep confirmed).
- **Ability scores:** base 13/10/12/15/14/8 is a valid standard-array permutation (0098). Then dwarf +1 CON/+1 WIS, Dwarf Fortitude +1 CON, L4 and L8 +1 INT, and Squat Nimbleness +1 STR. The result is 14/10/14/17/15/8. ✓
- **Derived values:**
  - Mutagens: INT mod = 3 uses (4954). ✓ Endurance, Power, Reflexes and Senses are each +3 (4948–4951). ✓
  - Maneuver DC: 8 + PB 4 + INT 3 = 15 (4956). ✓
  - Saves: STR +2, DEX +0, CON +6 (proficient), INT +3, WIS +2, CHA +3 (proficient). Proficiency matches 4902. ✓
  - Skills: Craft (Alchemy) +7, Investigation +7, Athletics +6, Perception +6, Acrobatics +4, Survival +2. Perception +9 and Survival +5 with Enhanced Senses; Acrobatics +7 with Enhanced Reflexes. Stonecunning +11. ✓
  - Fury to-hit: +8. ✓
- **Vision:** dwarf 60 ft low-light vision is kept as a separate, weaker trait, and Nocturnal's 120 ft darkvision is recorded separately. The two are not conflated. ✓
- **Cross-tabs:** sheet, mutant, dwarf, play and tactics are consistent. No leftover Old Hatred, DC 16, 4 mutagen uses, or +1 INT from Squat Nimbleness. No "supplied build overrides" or similar class-override claims remain.
- **Image paths:** all four `src` values point to `images/…`, the staged renames match, and no root-level `.jpg` reference is left. `build.cjs` inlines `src="…jpg"` relative to the character directory, and `node check.cjs` passes, including the embedded-asset and image-count (4) checks.

## Findings

1. **ID:** R1
   **Severity:** LOW
   **Title:** Broad negative regex in check.cjs bans generic words across all Thrain HTML
   **Location:** `check.cjs:L43-L44`
   **Category:** maintainability
   **Evidence:** `assert.ok(!/Limit Removal|necrotic|exhaustion|overrid|take precedence over draft|supplied (?:Thrain |character )?build/i.test(allHtml), ...)`. The regex runs over every Thrain tab. Words such as `necrotic`, `exhaustion` and the substring `overrid` are generic rules vocabulary. For example, a future Adapted Resistance note, an equipment description, or "does not override" would trip the check even though it is not about Limit Removal or build precedence.
   **Why it matters:** A legitimate future edit would fail the check with a misleading message. Contributors might then rephrase correct rules text to get around the check, or weaken the check itself.
   **Recommended fix:** Keep the intent but anchor it to the specific claims:
   ```js
   assert.ok(!/Limit Removal|supplied (?:Thrain |character )?build|take precedence over draft|build overrides?/i.test(allHtml), ...);
   ```
   The positive `deepEqual` on the mutation list already guarantees that Limit Removal is not listed as a mutation.
   **Fix confidence:** HIGH

Merge risk: LOW - every feat, mutation level and prerequisite, ability score, and derived value matches the campaign extracted text, `node check.cjs` passes with the moved images, and the only finding is a low-severity problem with check robustness.
