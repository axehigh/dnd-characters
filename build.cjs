// Dependency-free static build: node build.cjs
const fs = require("node:fs");
const path = require("node:path");

const output = path.join(__dirname, "dist");
for (const file of ["index.html", "characters/finn_wildblade/finn_wildblade.html", "characters/thrain_eisenkolben/thrain_eisenkolben.html", "characters/valen_ashwood/valen_ashwood.html"]) {
  const source = path.join(__dirname, file);
  const directory = path.dirname(source);
  let html = fs.readFileSync(source, "utf8");
  html = html.replace(/<section\b([^>]*?) data-src="([^"]+)"([^>]*)><\/section>/g,
    (_match, before, src, after) =>
      `<section${before}${after}>${fs.readFileSync(path.resolve(directory, src), "utf8")}</section>`);
  html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g,
    (_match, href) => `<style>\n${fs.readFileSync(path.resolve(directory, href), "utf8")}\n</style>`);
  // Fragment URLs are relative to the container page, not the tabs directory.
  html = html.replace(/src="([^"]+\.jpg)"/g, (_match, src) =>
    `src="data:image/jpeg;base64,${fs.readFileSync(path.resolve(directory, src)).toString("base64")}"`);
  const destination = path.join(output, file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, html);
}
console.log("Built dist/index.html.");
