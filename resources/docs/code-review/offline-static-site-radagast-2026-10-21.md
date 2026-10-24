Reviewer: Radagast-Reviewer-1 - model: github-copilot/claude-opus-5.5
Scope: branch `offline-static-site` vs `main` (`git diff main...HEAD`, commit 8d3c94f) — `.gitignore`, `README.md`, `build.cjs`, `check.cjs`, `characters/finn_wildblade/finn_wildblade.html`
Verdict: Approach is correct and works — `node check.cjs` passes, the offline page embeds all 8 tabs, the CSS, and 4 JPEG data URIs, and the source page still works over HTTP. A few low-severity issues in robustness and docs remain.

Verified:
- **Source over HTTP.** It still uses `fetch`. The new top-level `initFeatureFilter()` call returns early because `#feature-search` isn't in the DOM yet. When `sheet` finishes loading it calls the filter once, so listeners aren't bound twice.
- **Offline.** `build.cjs` puts every `data-src` fragment inside its section and removes the attribute. It replaces `<link rel=stylesheet>` with an inline `<style>`, and turns the `.jpg` paths into base64 data URIs. Fragment image paths are resolved against the container page's folder, which is correct because the fragments are injected into that page. The fetch loop finds no `[data-src]` sections, so nothing runs on `file://`.
- **Replacement strings.** These use callbacks, so `$&`/`$1` patterns in CSS or HTML can't corrupt the output.
- **Server command.** `python3 -m http.server 8000 --bind 127.0.0.1` only listens on loopback, which is safe.
- **Credentials.** None committed. `/offline/` is gitignored.

## Findings

1. **ID:** R1
   **Severity:** LOW
   **Title:** `agents.md` still describes the template as fetch-only and doesn't mention the offline build or the static-asset rules
   **Location:** `agents.md:L13-L16` (unchanged by the branch)
   **Category:** convention
   **Evidence:** "Implements progressive enhancement: asynchronously fetches tab HTML contents into `<section data-src="tabs/...">`". The file says nothing about `build.cjs`, about `offline/` being generated, or that new characters must be added to the hard-coded file list in `build.cjs`.
   **Why it matters:** Agents that add characters or tabs won't know about the offline build. For example, a `.png` or a reordered `<link>` attribute will silently ship un-embedded.
   **Recommended fix:** Add a short "Offline build" bullet to `agents.md`. It should say: run `node build.cjs`/`node check.cjs`, list new pages in `build.cjs`, use only `.jpg` images and the exact `<link rel="stylesheet" href="...">` form, and never edit `offline/`.
   **Fix confidence:** HIGH

2. **ID:** R2
   **Severity:** LOW
   **Title:** Build only works with one exact markup shape and one character, and skips anything else without an error
   **Location:** `build.cjs:L6-L17`
   **Category:** maintainability
   **Evidence:** The page list is hard-coded: `["index.html", "characters/finn_wildblade/finn_wildblade.html"]`. The patterns are exact: `/<section\b([^>]*?) data-src="([^"]+)"([^>]*)><\/section>/` and `/<link rel="stylesheet" href="([^"]+)">/`. Only `src="...\.jpg"` is embedded, and it is always labelled `image/jpeg`. Anything that doesn't match (a second character, `.png`/`.jpeg`/`.webp`, a `<link>` with different attribute order) passes through unchanged. On `file://` those references then break without any message. `check.cjs` checks only Finn's page and the exact count of 4.
   **Why it matters:** The next character or image format will produce an offline page with broken images or missing tabs, and the build will still report success.
   **Recommended fix:** After the replacements, fail the build if any `data-src=`, `rel="stylesheet"`, or non-`data:` `<img src` is left. Also find character pages automatically with a `characters/*/*.html` glob, or document the list. For example: `if (/data-src=|rel="stylesheet"|<img[^>]+src="(?!data:)/.test(html)) throw new Error(`Unembedded asset in ${file}`);`
   **Fix confidence:** HIGH

3. **ID:** R3
   **Severity:** LOW
   **Title:** The portrait JPEG is embedded twice, making the single offline file about 1.78 MB
   **Location:** `build.cjs:L16-L17`; `finn_wildblade.html:L26`, `tabs/images.html:L4`
   **Category:** performance
   **Evidence:** `finn_wildblade_portrait.jpg` (154 KB) is referenced in both the header and the Images tab. Each reference is encoded separately (+33% for base64). `offline/.../finn_wildblade.html` is 1,784,562 bytes.
   **Why it matters:** This is minor today: the file is bigger, takes longer to parse, and is slower to copy or share. It grows linearly as more art is added.
   **Recommended fix:** This is acceptable for now. If needed, cache the encoded strings per path inside the callback (a `Map`) so each image is read once. The duplicate data URI can only be avoided by using a CSS variable or `<template>`, so this may not be worth the effort.
   **Fix confidence:** MEDIUM — whether to fix this is a trade-off.

4. **ID:** R4
   **Severity:** LOW
   **Title:** `check.cjs` writes `offline/` as a side effect and has no browser-level test of the offline feature filter
   **Location:** `check.cjs:L21`, `check.cjs:L62`
   **Category:** test-gap
   **Evidence:** `execFileSync(process.execPath, [path.join(__dirname, "build.cjs")])` rebuilds into the working tree. The VM stub sets `getElementById: () => null`, so `initFeatureFilter()` always returns early. That means the main behaviour change in the source file — calling the filter immediately so it works on the embedded sheet — is never exercised.
   **Why it matters:** If the immediate call breaks (for example, the call is reordered so it runs before the function is defined in non-hoisted code, or the selector changes), the offline search/filter will die without the smoke test noticing.
   **Recommended fix:** In the stub, make `getElementById('feature-search')` return a fake input and `querySelectorAll('.recorded-list > li')` return fake items, at least for the offline page. Then assert that an `input` event hides the items that don't match. Optionally, mention in the README that the check rewrites `offline/`.
   **Fix confidence:** MEDIUM

Scope is appropriate: it covers both ways of running the site, the README documents both clearly, and nothing unrelated was changed. I found no regressions in the source tab behaviour (8 tabs, keyboard navigation, and popstate are covered for both the source and offline pages).

Merge risk: LOW - check.cjs passes; offline output was checked by hand to contain all tabs, the CSS, and 4 data-URI images; findings are about docs and robustness only.
