// Dependency-free smoke check: node check.cjs (not a substitute for browser QA).
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const html = fs.readFileSync(path.join(__dirname, "characters", "finn_wildblade", "finn_wildblade.html"), "utf8");
const tabFiles = ["sheet.html", "inventory.html", "barbarian.html", "halfling.html", "story.html", "images.html"];
let allHtml = html;
for (const file of tabFiles) {
  allHtml += "\n" + fs.readFileSync(path.join(__dirname, "characters", "finn_wildblade", "tabs", file), "utf8");
}
const ids = [...allHtml.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, "HTML IDs must be unique");
for (const [, id] of allHtml.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id), `Missing anchor: ${id}`);
assert.ok(allHtml.includes('<div class="hp-total">95</div>'), "Recorded HP must be preserved");
assert.ok(allHtml.includes('id="feature-search"'), "Feature search input must be present");
assert.ok(allHtml.includes('data-filter="class"'), "Feature category filters must be present");

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
const tabs = [...html.matchAll(/<a class="tab" href="(#\w+)">/g)].map(([, href]) => {
  const tab = element();
  tab.setAttribute("href", href);
  elements.set(href, element(href.slice(1)));
  return tab;
});
assert.equal(tabs.length, 6);
const location = { hash: "" };
const events = {};
const context = {
  document: {
    querySelectorAll: () => tabs,
    querySelector: selector => selector === ".tabs" ? element() : elements.get(selector)
  },
  location,
  history: { pushState(_state, _title, hash) { location.hash = hash; } },
  window: { addEventListener(name, handler) { events[name] = handler; } }
};
vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
function selected(index) {
  tabs.forEach((tab, i) => {
    assert.equal(tab.attributes["aria-selected"], String(i === index));
    assert.equal(tab.tabIndex, i === index ? 0 : -1);
    assert.equal(elements.get(tab.getAttribute("href")).hidden, i !== index);
  });
}
selected(0);
tabs[1].click();
selected(1);
assert.equal(location.hash, "#inventory");
tabs[2].click();
selected(2);
assert.equal(location.hash, "#barbarian");
tabs[3].click();
selected(3);
assert.equal(location.hash, "#halfling");
tabs[4].click();
selected(4);
assert.equal(location.hash, "#story");
tabs[4].events.keydown({ key: "ArrowRight", preventDefault() {} });
selected(5);
location.hash = "#sheet";
events.popstate();
selected(0);
console.log("PASS: unique IDs, local anchors, recorded HP, tab click, keyboard navigation, and history state.");
