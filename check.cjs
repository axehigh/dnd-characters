// Dependency-free smoke check: node check.cjs (not a substitute for browser QA).
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");
execFileSync(process.execPath, [path.join(__dirname, "build.cjs")]);
const builtIndex = fs.readFileSync(path.join(__dirname, "dist", "index.html"), "utf8");
assert.ok(!builtIndex.includes('rel="stylesheet"'));
const menuCards = [...builtIndex.matchAll(/<a class="box character-card"[^>]*>([\s\S]*?)<\/a>/g)];
assert.equal(menuCards.length, 3);
for (const [, card] of menuCards) {
  assert.equal([...card.matchAll(/<img class="character-artwork" src="data:image\/(?:jpeg|png|svg\+xml);base64,/g)].length, 1,
    "Each character card must have an embedded portrait for offline use");
}
for (const character of ["finn_wildblade", "thrain_eisenkolben", "valen_ashwood"]) {
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
  } else if (character === "thrain_eisenkolben") {
    assert.ok(allHtml.includes('<div class="hp-total">124</div>'), "Recorded HP must be preserved");
    assert.ok(allHtml.includes("Adapted Resistance · level 9 · Frightened"));
    assert.ok(allHtml.includes("Trip Attack") && allHtml.includes("Disarming Attack"));
    assert.ok(allHtml.includes("Intelligence replaces Constitution"));
    assert.ok(allHtml.includes("Only one active: a new mutagen ends the previous one."));
    assert.ok(allHtml.includes("Bonus action: spend one Hit Die"));
    const sheet = fs.readFileSync(path.join(directory, "tabs", "sheet.html"), "utf8");
    const mutations = [...sheet.matchAll(/<summary>([^<]+) · secondary mutation · level (\d+)<\/summary>/g)]
      .map(([, mutation, level]) => [mutation, Number(level)]);
    assert.deepEqual(mutations, [["Spines", 2], ["Nocturnal", 2], ["Quadrupedal", 6], ["Healing Surge", 9]]);
    const mutant = fs.readFileSync(path.join(directory, "tabs", "mutant.html"), "utf8");
    for (const row of ["<td>2</td><td>+2</td><td>Spines; Nocturnal</td>",
      "<td>6</td><td>+3</td><td>Alchemical Knight; Quadrupedal</td>",
      "<td>9</td><td>+4</td><td>Adapted Resistance (Frightened); Healing Surge</td>"]) {
      assert.ok(mutant.includes(row), "Campaign secondary mutation progression must match the sheet");
    }
    assert.ok(sheet.includes("Darkvision to 120 ft") && sheet.includes("Low-light vision · 60 ft"));
    assert.ok(sheet.includes("1 hour asleep and 7 hours of light activity") && sheet.includes("Hibernation is not selected"));
    assert.ok(!/Limit Removal|supplied (?:Thrain |character )?build|take precedence over draft|build overrides?/i.test(allHtml),
      "Only campaign-legal selected mutations and campaign rule precedence may appear");
    const feats = [...sheet.matchAll(/data-category="(cultural|general)"><details><summary>([^<]+)/g)]
      .map(([, category, feat]) => [category, feat]);
    assert.deepEqual(feats, [
      ["cultural", "Dwarf Fortitude · level 1"],
      ["general", "Heavily Armoured · level 1"],
      ["general", "Durable · level 3"],
      ["cultural", "Fury · level 5"],
      ["general", "Fell-handed · level 7"],
      ["cultural", "Squat Nimbleness · level 9"]
    ]);
    const abilities = [...sheet.matchAll(/class="ability"><span class="label">(\w+)<\/span><span class="modifier">([^<]+)<\/span><span class="score">(\d+)/g)]
      .map(([, ability, modifier, score]) => [ability, modifier, Number(score)]);
    assert.deepEqual(abilities, [
      ["STR", "+2", 14], ["DEX", "+0", 10], ["CON", "+3", 16],
      ["INT", "+3", 17], ["WIS", "+1", 13], ["CHA", "−1", 8]
    ]);
    for (const value of ["3 / long rest", "DC 15", "8 + PB 4 + INT 3", "Dwarf Fortitude +1 CON",
      "Squat Nimbleness +1 STR", "Perception +8 and Survival +4", "= +11.",
      "Endurance: 3 temporary HP", "Power: +3 damage", "Enhanced Reflexes: +3", "Enhanced Senses: +3",
      "After a creature damages you, gain +2 to attack and damage against that creature until the end of your first round after taking the damage."]) {
      assert.ok(sheet.includes(value), `Missing corrected Thrain value: ${value}`);
    }
    for (const [bonus, skill] of [["+7", "Craft (Alchemy)"], ["+7", "Investigation"], ["+5", "Perception"],
      ["+3", "Intelligence"], ["+1", "Wisdom"]]) {
      assert.ok(sheet.includes(`<tr><td>${bonus}</td><td>${skill}</td>`), `Incorrect Thrain bonus: ${skill}`);
    }
    assert.ok(!/Old Hatred|DC (?:<strong>)?16|4 \/ long rest|Squat Nimbleness \(\+1 INT\)/i.test(allHtml),
      "Do not restore superseded Thrain feat or derived values");
  }
  assert.ok(allHtml.includes('id="feature-search"'), "Feature search input must be present");
  assert.ok(allHtml.includes('data-filter="class"'), "Feature category filters must be present");

  const built = fs.readFileSync(path.join(__dirname, "dist", "characters", character, `${character}.html`), "utf8");
  assert.ok(!built.includes("data-src="), "Built tabs must not require fetching");
  assert.ok(!built.includes('rel="stylesheet"'), "Built CSS must be embedded");
  assert.ok(built.includes(fs.readFileSync(path.join(__dirname, "styles.css"), "utf8")));
  for (const file of tabFiles) {
    const fragment = fs.readFileSync(path.join(directory, "tabs", file), "utf8");
    assert.ok(built.includes(fragment.replace(/src="([^"]+\.(jpg|png|svg))"/g, (_match, src, extension) =>
      `src="data:image/${extension === "svg" ? "svg+xml" : extension === "jpg" ? "jpeg" : "png"};base64,${fs.readFileSync(path.join(directory, src)).toString("base64")}"`)), `Missing built fragment: ${file}`);
  }
  const imageCount = [...allHtml.matchAll(/<img\b/g)].length;
  assert.equal([...built.matchAll(/<img\b/g)].length, imageCount);
  assert.equal([...built.matchAll(/src="data:image\/(?:jpeg|png|svg\+xml);base64,/g)].length, imageCount);
  if (character === "valen_ashwood") {
    const portrait = fs.readFileSync(path.join(directory, "images", "valen_portrait.png"));
    const embeddedPortrait = `src="data:image/png;base64,${portrait.toString("base64")}"`;
    const card = menuCards.find(([card]) => card.includes(`href="characters/${character}/${character}.html"`))[1];
    assert.ok(card.includes(embeddedPortrait), "Valen's menu card must embed his own portrait");
    const imagesTab = built.match(/<section id="images"[^>]*>([\s\S]*?)<\/section>/)[1];
    assert.ok(imagesTab.includes(embeddedPortrait), "Valen's built Images tab must embed his portrait");
    const fullImage = fs.readFileSync(path.join(directory, "images", "valen_xbow.jpg"));
    assert.ok(imagesTab.includes(`src="data:image/jpeg;base64,${fullImage.toString("base64")}"`),
      "Valen's built Images tab must embed his crossbow artwork");
    const sourceIndex = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
    assert.ok(sourceIndex.includes(`src="characters/${character}/images/valen_portrait.png"`));
  }
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
        documentElement: element(),
        querySelectorAll: selector => selector === ".tab" ? tabs : [],
        getElementById: () => null,
        querySelector: selector => selector === ".tabs" ? element() : elements.get(selector)
      },
      location,
      localStorage: { getItem() { return null; } },
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
console.log("PASS: all three characters' source/build content, menu portraits, embedded assets, unique IDs, local anchors, recorded HP, tab click, keyboard navigation, and history state.");
