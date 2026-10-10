// Dependency-free smoke check: node check.cjs (not a substitute for browser QA).
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const html = fs.readFileSync(require("node:path").join(__dirname, "index.html"), "utf8");
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, "HTML IDs must be unique");
for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id), `Missing anchor: ${id}`);
assert.ok(html.includes('<progress value="20" max="95"'), "Recorded HP must be preserved");

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
assert.equal(tabs.length, 3);
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
assert.equal(location.hash, "#info");
tabs[1].events.keydown({ key: "ArrowRight", preventDefault() {} });
selected(2);
location.hash = "#sheet";
events.popstate();
selected(0);
console.log("PASS: unique IDs, local anchors, recorded HP, tab click, keyboard navigation, and history state.");
