const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const path = require("node:path");
const test = require("node:test");

test("local server serves the directory, character tabs, and assets", { timeout: 10000 }, async t => {
  const server = spawn(process.execPath, [path.join(__dirname, "dev.cjs")], {
    env: { ...process.env, PORT: "0" },
    stdio: ["ignore", "pipe", "inherit"]
  });
  t.after(() => server.kill());
  const [output] = await once(server.stdout, "data");
  const url = output.toString().match(/http:\/\/127\.0\.0\.1:\d+/)[0];
  for (const [file, type] of [
    ["/", "text/html"],
    ["/characters/finn_wildblade/finn_wildblade.html", "text/html"],
    ["/characters/finn_wildblade/tabs/sheet.html", "text/html"],
    ["/characters/thrain_eisenkolben/thrain_eisenkolben.html", "text/html"],
    ["/characters/thrain_eisenkolben/tabs/sheet.html", "text/html"],
    ["/styles.css", "text/css"],
    ["/characters/finn_wildblade/images/finn_wildblade_portrait.jpg", "image/jpeg"]
  ]) {
    const response = await fetch(url + file);
    assert.equal(response.status, 200, file);
    assert.ok(response.headers.get("content-type").startsWith(type), file);
    assert.ok((await response.arrayBuffer()).byteLength > 0, file);
  }
  assert.equal((await fetch(url + "/missing.html")).status, 404);
});
