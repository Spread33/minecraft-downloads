const SITE = "Spread33";
const CATS = {
  mods:    {label: "Mods",    blurb: "Mods for the Minecraft client and server."},
  plugins: {label: "Plugins", blurb: "Plugins for Paper, Spigot and similar servers."},
  skripts: {label: "Skripts", blurb: "Scripts for servers running the Skript plugin."}
};

const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k === "text") e.textContent = v;
    else if (k === "style") e.style.cssText = v;
    else e.setAttribute(k, v);
  }
  kids.flat().filter(c => c !== null && c !== undefined).forEach(c => e.append(c));
  return e;
};
const params = new URLSearchParams(location.search);
const labelFor = p => CATS[p.category]?.label || "Other";
const minecraftFor = p => Array.isArray(p.minecraft) ? p.minecraft : [];
const unique = values => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));

function shell(active) {
  const nav = h("nav", {},
    h("a", {href: "index.html", class: active === "home" ? "on" : "", text: "Home"}),
    ...Object.entries(CATS).map(([id, c]) => h("a", {
      href: "browse.html?c=" + id, class: active === id ? "on" : "", text: c.label
    }))
  );
  const main = h("main", {class: "wrap"});
  document.getElementById("app").append(
    h("header", {}, h("div", {class: "wrap"}, h("a", {class: "brand", href: "index.html", text: SITE}), nav)),
    main,
    h("footer", {}, h("div", {class: "wrap", text: "© " + new Date().getFullYear() + " " + SITE + ". Not affiliated with Mojang or Microsoft."}))
  );
  return main;
}

function projectCard(p) {
  const imageUrl = (p.screenshots || []).find(Boolean);
  let preview;
  if (imageUrl) {
    preview = h("img", {class: "card-image", src: imageUrl, alt: p.name + " screenshot", loading: "lazy"});
    preview.addEventListener("error", () => {
      preview.replaceWith(h("div", {class: "card-placeholder", text: "Screenshot unavailable"}));
    }, {once: true});
  } else {
    preview = h("div", {class: "card-placeholder", text: "No screenshot yet"});
  }

  return h("a", {class: "project-card", href: "project.html?id=" + encodeURIComponent(p.id)},
    preview,
    h("div", {class: "card-body"},
      h("div", {class: "card-topline"},
        h("span", {class: "tag", text: labelFor(p)}),
        h("span", {class: "card-version", text: "v" + (p.version || "—")})
      ),
      h("h3", {class: "card-title", text: p.name || "Untitled project"}),
      h("p", {class: "card-summary", text: p.summary || "No description provided yet."}),
      h("div", {class: "card-meta"},
        h("span", {text: "MC " + (minecraftFor(p).join(", ") || "Unspecified")}),
        h("span", {text: p.platform || "Platform unspecified"})
      )
    )
  );
}

function cards(list) {
  if (!list.length) return h("p", {class: "empty", text: "No projects match those filters. Try changing your search or filters."});
  return h("div", {class: "project-grid"}, list.map(projectCard));
}

function home(main, all) {
  main.append(
    h("p", {class: "eyebrow", text: "MINECRAFT PROJECTS BY SPREAD33"}),
    h("h1", {text: "Minecraft mods, plugins and Skripts"}),
    h("p", {class: "lead", text: "Free downloads I build and maintain. Browse projects by type, find what you need, and check compatibility before downloading."}),
    h("div", {class: "home-actions"}, h("a", {class: "btn", href: "browse.html", text: "Browse all projects"})),
    h("h2", {text: "Browse by category"}),
    h("div", {class: "cats"}, Object.entries(CATS).map(([id, c]) =>
      h("a", {class: "cat", href: "browse.html?c=" + id},
        h("b", {text: c.label}),
        h("span", {text: c.blurb}),
        h("span", {class: "cat-count", text: all.filter(p => p.category === id).length + " projects"})
      )
    )),
    h("div", {class: "section-heading"},
      h("h2", {text: "Latest updates"}),
      h("a", {href: "browse.html", text: "View all projects →"})
    ),
    cards(all.slice(0, 6))
  );
}

function browse(main, all) {
  const requestedCategory = params.get("c") || "";
  document.title = (CATS[requestedCategory]?.label || "Browse projects") + " – " + SITE;

  const heading = h("h1", {text: CATS[requestedCategory]?.label || "Browse projects"});
  const intro = h("p", {class: "lead", text: CATS[requestedCategory]?.blurb || "Search all projects and filter by category, Minecraft version, or platform."});
  const search = h("input", {type: "search", class: "search-input", id: "project-search", placeholder: "Search names and descriptions…", "aria-label": "Search projects"});
  search.value = params.get("q") || "";

  const category = h("select", {class: "filter-select", id: "category-filter", "aria-label": "Filter by category"},
    h("option", {value: "", text: "All categories"}),
    ...Object.entries(CATS).map(([id, c]) => h("option", {value: id, text: c.label}))
  );
  category.value = requestedCategory;

  const versions = unique(all.flatMap(minecraftFor));
  const version = h("select", {class: "filter-select", id: "version-filter", "aria-label": "Filter by Minecraft version"},
    h("option", {value: "", text: "All Minecraft versions"}),
    ...versions.map(v => h("option", {value: v, text: "Minecraft " + v}))
  );
  const platforms = unique(all.map(p => p.platform));
  const platform = h("select", {class: "filter-select", id: "platform-filter", "aria-label": "Filter by platform"},
    h("option", {value: "", text: "All platforms"}),
    ...platforms.map(v => h("option", {value: v, text: v}))
  );
  const sort = h("select", {class: "filter-select", id: "sort-filter", "aria-label": "Sort projects"},
    h("option", {value: "newest", text: "Recently updated"}),
    h("option", {value: "name", text: "Name A–Z"})
  );
  const count = h("p", {class: "results-count", "aria-live": "polite"});
  const results = h("div", {class: "results"});
  const filterBar = h("div", {class: "filter-panel"},
    h("div", {class: "search-wrap"}, h("label", {for: "project-search", text: "Search projects"}), search),
    h("div", {class: "filter-grid"},
      h("div", {class: "filter-field"}, h("label", {for: "category-filter", text: "Category"}), category),
      h("div", {class: "filter-field"}, h("label", {for: "version-filter", text: "Minecraft version"}), version),
      h("div", {class: "filter-field"}, h("label", {for: "platform-filter", text: "Platform"}), platform),
      h("div", {class: "filter-field"}, h("label", {for: "sort-filter", text: "Sort by"}), sort)
    ),
    h("button", {class: "reset-button", type: "button", text: "Clear filters"})
  );

  function renderResults() {
    const query = search.value.trim().toLowerCase();
    const selectedCategory = category.value;
    const selectedVersion = version.value;
    const selectedPlatform = platform.value;
    let filtered = all.filter(p => {
      const searchable = [p.name, p.summary, p.description, p.platform, labelFor(p), ...minecraftFor(p)].join(" ").toLowerCase();
      return (!query || searchable.includes(query))
        && (!selectedCategory || p.category === selectedCategory)
        && (!selectedVersion || minecraftFor(p).includes(selectedVersion))
        && (!selectedPlatform || p.platform === selectedPlatform);
    });
    if (sort.value === "name") filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else filtered.sort((a, b) => (b.updated || "").localeCompare(a.updated || ""));
    count.textContent = filtered.length + (filtered.length === 1 ? " project" : " projects") + " found";
    results.replaceChildren(cards(filtered));
  }

  [search, category, version, platform, sort].forEach(control => control.addEventListener("input", renderResults));
  filterBar.querySelector("button").addEventListener("click", () => {
    search.value = "";
    category.value = "";
    version.value = "";
    platform.value = "";
    sort.value = "newest";
    renderResults();
  });

  main.append(heading, intro, filterBar, count, results);
  renderResults();
}

function project(main, all) {
  const p = all.find(x => x.id === params.get("id"));
  if (!p) {
    main.append(h("h1", {text: "Project not found"}), h("a", {class: "back", href: "index.html", text: "Back to home"}));
    return;
  }

  document.title = p.name + " – " + SITE;
  main.append(
    h("a", {class: "back", href: "browse.html?c=" + encodeURIComponent(p.category || ""), text: "← Back to " + labelFor(p)}),
    h("h1", {class: "project-heading", text: p.name || "Untitled project"}),
    h("p", {class: "lead", text: p.summary || ""}),
    h("a", {class: "btn", href: p.download, text: "Download v" + (p.version || "—")}),
    h("h2", {text: "Compatibility"}),
    h("table", {}, [
      ["Version", p.version || "Unspecified"],
      ["Minecraft", minecraftFor(p).join(", ") || "Unspecified"],
      ["Works with", p.platform || "Unspecified"],
      ["Last updated", p.updated || "Unspecified"]
    ].map(([k, v]) => h("tr", {}, h("td", {text: k}), h("td", {text: v})))),
    h("h2", {text: "About"}),
    ...(p.description || "").split("\n\n").filter(Boolean).map(t => h("p", {text: t}))
  );

  if ((p.screenshots || []).length) {
    main.append(h("h2", {text: "Screenshots"}), h("div", {class: "shots"},
      p.screenshots.map((s, i) => h("img", {src: s, alt: p.name + " screenshot " + (i + 1), loading: "lazy"}))
    ));
  }
  if ((p.changelog || []).length) {
    main.append(h("h2", {text: "Changelog"}), h("div", {class: "log"},
      p.changelog.map(entry => h("div", {},
        h("h3", {text: "v" + entry.version}, h("small", {text: entry.date || ""})),
        h("ul", {}, (entry.notes || []).map(note => h("li", {text: note})))
      ))
    ));
  }
}

(async () => {
  let all = [];
  const page = document.body.dataset.page;
  const main = shell(page === "browse" ? params.get("c") : page === "project" ? "" : "home");
  try {
    const response = await fetch("projects.json");
    if (!response.ok) throw new Error("Could not fetch projects.json");
    const data = await response.json();
    if (!Array.isArray(data.projects)) throw new Error("projects.json needs a projects array");
    all = data.projects;
  } catch (error) {
    main.append(h("h1", {text: "Couldn't load projects"}), h("p", {class: "lead", text: "projects.json is missing, unavailable, or has invalid JSON. Check the file and reload."}));
    return;
  }
  all.sort((a, b) => (b.updated || "").localeCompare(a.updated || ""));
  if (page === "home") home(main, all);
  else if (page === "browse") browse(main, all);
  else if (page === "project") project(main, all);
})();
