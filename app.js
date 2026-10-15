const SITE = "Spread33";
const CATS = {
  mods:    {label: "Mods",    blurb: "Mods for the Minecraft client and server."},
  plugins: {label: "Plugins", blurb: "Plugins for Paper, Spigot and similar servers."},
  skripts: {label: "Skripts", blurb: "Scripts for servers running the Skript plugin."}
};
const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v; else if (k === "text") e.textContent = v; else e.setAttribute(k, v);
  }
  kids.flat().forEach(c => e.append(c));
  return e;
};
const params = new URLSearchParams(location.search);

function shell(active) {
  const nav = h("nav", {}, h("a", {href: "index.html", class: active === "home" ? "on" : "", text: "Home"}),
    ...Object.entries(CATS).map(([id, c]) => h("a", {href: "browse.html?c=" + id, class: active === id ? "on" : "", text: c.label})));
  const main = h("main", {class: "wrap"});
  document.getElementById("app").append(
    h("header", {}, h("div", {class: "wrap"}, h("a", {class: "brand", href: "index.html", text: SITE}), nav)),
    main,
    h("footer", {}, h("div", {class: "wrap", text: "© " + new Date().getFullYear() + " " + SITE + ". Not affiliated with Mojang or Microsoft."}))
  );
  return main;
}

function rows(list) {
  if (!list.length) return h("p", {class: "empty", text: "Nothing here yet."});
  return h("div", {class: "list"}, list.map(p =>
    h("a", {class: "row", href: "project.html?id=" + encodeURIComponent(p.id)},
      h("div", {}, h("div", {class: "t", text: p.name}), h("div", {class: "s", text: p.summary})),
      h("div", {class: "meta", text: [CATS[p.category]?.label, "MC " + p.minecraft.join(", "), "v" + p.version].join("  ·  ")}))));
}

function home(main, all) {
  main.append(h("h1", {text: "Minecraft mods, plugins and Skripts"}),
    h("p", {class: "lead", text: "Free downloads I build and maintain. Pick a category or grab the latest update below."}),
    h("h2", {text: "Browse"}),
    h("div", {class: "cats"}, Object.entries(CATS).map(([id, c]) =>
      h("a", {class: "cat", href: "browse.html?c=" + id},
        h("b", {text: c.label}), h("span", {text: c.blurb + " (" + all.filter(p => p.category === id).length + ")"})))),
    h("h2", {text: "Latest updates"}), rows(all.slice(0, 6)));
}

function browse(main, all) {
  const c = params.get("c"), cat = CATS[c];
  document.title = (cat ? cat.label : "All projects") + " – " + SITE;
  main.append(h("h1", {text: cat ? cat.label : "All projects"}),
    h("p", {class: "lead", text: cat ? cat.blurb : "Everything in one place."}),
    h("h2", {text: ""}), rows(cat ? all.filter(p => p.category === c) : all));
  main.querySelector("h2").remove();
  return cat ? c : "";
}

function project(main, all) {
  const p = all.find(x => x.id === params.get("id"));
  if (!p) { main.append(h("h1", {text: "Project not found"}), h("a", {class: "back", href: "index.html", text: "Back to home"})); return ""; }
  document.title = p.name + " – " + SITE;
  main.append(
    h("a", {class: "back", href: "browse.html?c=" + p.category, text: "Back to " + CATS[p.category].label}),
    h("h1", {text: p.name, style: "margin-top:16px"}),
    h("p", {class: "lead", text: p.summary}),
    h("a", {class: "btn", href: p.download, text: "Download v" + p.version}),
    h("h2", {text: "Compatibility"}),
    h("table", {}, [["Version", p.version], ["Minecraft", p.minecraft.join(", ")], ["Works with", p.platform], ["Last updated", p.updated]]
      .map(([k, v]) => h("tr", {}, h("td", {text: k}), h("td", {text: v})))),
    h("h2", {text: "About"}), ...(p.description || "").split("\n\n").map(t => h("p", {text: t})));
  if ((p.screenshots || []).length)
    main.append(h("h2", {text: "Screenshots"}), h("div", {class: "shots"}, p.screenshots.map(s => h("img", {src: s, alt: p.name + " screenshot", loading: "lazy"}))));
  if ((p.changelog || []).length)
    main.append(h("h2", {text: "Changelog"}), h("div", {class: "log"}, p.changelog.map(e =>
      h("div", {}, h("h3", {text: "v" + e.version}, h("small", {text: e.date})), h("ul", {}, e.notes.map(n => h("li", {text: n})))))));
  return p.category;
}

(async () => {
  let all = [], failed = false;
  try { all = (await (await fetch("projects.json")).json()).projects; } catch { failed = true; }
  all.sort((a, b) => b.updated.localeCompare(a.updated));
  const page = document.body.dataset.page;
  const main = shell(page === "browse" ? params.get("c") : page === "project" ? all.find(x => x.id === params.get("id"))?.category : "home");
  if (failed) return main.append(h("h1", {text: "Couldn't load projects"}), h("p", {class: "lead", text: "projects.json is missing or has a typo. Check it and reload."}));
  ({home, browse, project})[page](main, all);
})();
