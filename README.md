# The Adventurer’s Ledger

Plain HTML/CSS/JavaScript, with no package installation required. Run commands
from the repository root.

## Serve the source

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open <http://localhost:8000/> and choose Finn Wildblade. Stop with Ctrl+C.
The character page fetches its eight tab fragments over HTTP.

## Open directly (file://), without a server

With Node.js 18 or newer:

```sh
node build.cjs
```

Open `offline/index.html` in your browser (for example, `xdg-open offline/index.html`
on Linux), then choose Finn. Or open
`offline/characters/finn_wildblade/finn_wildblade.html` directly.
The generated character HTML embeds all tabs, CSS, and images, so that single
file can also be copied elsewhere and opened without a network connection.
Keep the generated directory structure when using the index link.

Edit the original HTML, `characters/finn_wildblade/tabs/*.html`, images, and
`styles.css`, then rerun the build. `offline/` is generated and ignored by Git;
do not edit it. The original character page still needs HTTP, not `file://`.

## Check

```sh
node check.cjs
```

This rebuilds the offline pages and smoke-checks content, embedded assets, tab
navigation, keyboard controls, and history state. Browser QA is still recommended.
