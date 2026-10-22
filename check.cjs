// Dependency-free smoke check: node check.cjs (not a substitute for browser QA).
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");
execFileSync(process.execPath, [path.join(__dirname, "build.cjs")]);
const builtIndex = fs.readFileSync(path.join(__dirname, "dist", "index.html"), "utf8");
assert.ok(!builtIndex.includes('rel="stylesheet"'));
for (const character of ["finn_wildblade", "thrain_eisenkolben"]) {
  const directory = path.join(__dirname, "characters", character);
  const html = fs.readFileSync(path.join(directory, `${character}.html`), "utf8");
  const tabFiles = [...html.matchAll(/data-src="tabs\/([^"]+)"/g)].map(match => match[1]);
  assert.equal(tabFiles.length, 8);
  let allHtml = html;
  for (const file of tabFiles) {
    allHtml += "\n" + fs.readFileSync(path.join(directory, "tabs", file), "utf8");
  }
  const ids = [...allHtml.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, "HTML IDs must be unique");
  for (const [, id] of allHtml.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id), `Missing anchor: ${id}`);
  if (character === "finn_wildblade") {
    assert.ok(allHtml.includes('<div class="hp-total">95</div>'), "Recorded HP must be preserved");
  } else {
    assert.ok(allHtml.includes('<div class="hp-total">Not supplied</div>'), "Do not invent Thrain's HP");
    assert.ok(allHtml.includes("Adapted Resistance · level 9 · choice pending"));
    assert.ok(allHtml.includes("Trip Attack") && allHtml.includes("Disarming Attack"));
    assert.ok(allHtml.includes("Intelligence replaces Constitution"));
    assert.ok(allHtml.includes("Only one active: a new mutagen ends the previous one."));
    assert.ok(allHtml.includes("Bonus action: spend one Hit Die"));
  }
  assert.ok(allHtml.includes('id="feature-search"'), "Feature search input must be present");
  assert.ok(allHtml.includes('data-filter="class"'), "Feature category filters must be present");

  const built = fs.readFileSync(path.join(__dirname, "dist", "characters", character, `${character}.html`), "utf8");
  assert.ok(!built.includes("data-src="), "Built tabs must not require fetching");
  assert.ok(!built.includes('rel="stylesheet"'), "Built CSS must be embedded");
  assert.ok(built.includes(fs.readFileSync(path.join(__dirname, "styles.css"), "utf8")));
  for (const file of tabFiles) {
    const fragment = fs.readFileSync(path.join(directory, "tabs", file), "utf8");
    assert.ok(built.includes(fragment.replace(/src="([^"]+\.jpg)"/g, (_match, src) =>
      `src="data:image/jpeg;base64,${fs.readFileSync(path.join(directory, src)).toString("base64")}"`)), `Missing built fragment: ${file}`);
  }
  const imageCount = 4; // Each character has one header portrait and three gallery images.
  assert.equal([...built.matchAll(/<img\b/g)].length, imageCount);
  assert.equal([...built.matchAll(/src="data:image\/jpeg;base64,/g)].length, imageCount);
  assert.ok(builtIndex.includes(`href="characters/${character}/${character}.html"`));

  for (const page of [html, built]) {
    const elements = new Map();
    function element(id) {
      const attributes = {};
      const events = {};
      return { id, hidden: false, attributes, events,
        setAttribute(name, value) { attributes[name] = value; },
        getAttribute(name) { return attributes[name]; },
        addEventListener(name, handler) { events[name] = handler; },
        focus() {},
        click() { events.click({ preventDefault() {} }); }
      };
    }
    const tabs = [...page.matchAll(/<a class="tab" href="(#\w+)">/g)].map(([, href]) => {
      const tab = element();
      tab.setAttribute("href", href);
      elements.set(href, element(href.slice(1)));
      return tab;
    });
    assert.equal(tabs.length, 8);
    const location = { hash: "" };
    const events = {};
    const context = {
      document: {
        querySelectorAll: selector => selector === ".tab" ? tabs : [],
        getElementById: () => null,
        querySelector: selector => selector === ".tabs" ? element() : elements.get(selector)
      },
      location,
      history: { pushState(_state, _title, hash) { location.hash = hash; } },
      window: { addEventListener(name, handler) { events[name] = handler; } }
    };
    vm.runInNewContext(page.match(/<script>([\s\S]*?)<\/script>/)[1], context);
    function selected(index) {
      tabs.forEach((tab, i) => {
        assert.equal(tab.attributes["aria-selected"], String(i === index));
        assert.equal(tab.tabIndex, i === index ? 0 : -1);
        assert.equal(elements.get(tab.getAttribute("href")).hidden, i !== index);
      });
    }
    selected(0);
    tabs.forEach((tab, index) => {
      tab.click();
      selected(index);
      assert.equal(location.hash, tab.getAttribute("href"));
    });
    tabs[7].events.keydown({ key: "ArrowRight", preventDefault() {} });
    selected(0);
    location.hash = "#sheet";
    events.popstate();
    selected(0);
  }
}
console.log("PASS: both characters' source/build content, embedded assets, unique IDs, local anchors, recorded HP, tab click, keyboard navigation, and history state.");
