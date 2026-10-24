# The Adventurer’s Ledger

Plain HTML/CSS/JavaScript. Requires Node.js 18 or newer and npm, with no package
installation required. Run commands from the repository root.

## Serve the source

```sh
npm run dev
```

Open <http://127.0.0.1:9000/> and choose Finn Wildblade or Thrain Eisenkolben. Stop with Ctrl+C.
If port 9000 is in use, run `PORT=9001 npm run dev` and open the printed URL.
The character page fetches its eight tab fragments over HTTP.

## Build

```sh
npm run build
```

The generated site is written to `dist/`, with embedded tabs, CSS, and images.
Edit the original HTML, `characters/<character_name>/tabs/*.html`, images, and
`styles.css`, then rerun the build. `dist/` is generated and ignored by Git;
do not edit it.

## Check

```sh
npm run check
```

This rebuilds the site and smoke-checks content, embedded assets, tab navigation,
keyboard controls, history state, and the local server. Browser QA is still recommended.
