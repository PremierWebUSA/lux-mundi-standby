/* The Jesus Archive — client. Real page addresses (History API):
   /                          home
   /<section>                 one section of the testimony (e.g. /witnesses, /sources)
   /<document id>?at=&q=      a document (e.g. /witnesses/tacitus-annals-15-44)
   /path[/<n>]  /timeline  /map?place=  /gallery[/<slug>]  /compare[/<slug>]  /people[/<slug>]
   /life  /prophecies  /resurrection  /manuscripts   the four studies
   Internally pages still build "#/…" links; they are rewritten to real paths as they appear,
   and old "#/…" addresses are redirected. */
(() => {
  "use strict";

  /* ───────── data (loaded as scripts so the site works from file://) ───────── */
  const LUX = (window.LUX = { docs: {}, waiting: {} });
  let INDEX = null, SEARCH = null;
  LUX.index = (d) => (INDEX = d);
  LUX.search = (d) => (SEARCH = d);
  let GEO = null, COMPARE = null;
  LUX.geo = (d) => (GEO = d);
  LUX.compare = (d) => (COMPARE = d);
  let STUDIES = null, GLOSS = null, glossRe = null, glossAt = {};
  LUX.studies = (d) => (STUDIES = d);
  let NOTES = null;
  LUX.notes = (d) => (NOTES = d);
  LUX.glossary = (d) => {
    GLOSS = d;
    d.forEach((g, i) => g.match.forEach((m) => (glossAt[m.toLowerCase()] ??= i)));
    const forms = Object.keys(glossAt).sort((a, b) => b.length - a.length);
    glossRe = new RegExp(`\\b(${forms.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "gi");
  };
  LUX.pages = (p) => { window.PAGES = p; };
  LUX.doc = (id, d) => { LUX.docs[id] = d; (LUX.waiting[id] || []).forEach((f) => f(d)); delete LUX.waiting[id]; };
  const loadScript = (src) => new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = () => rej(new Error(src));
    document.head.appendChild(s);
  });
  const indexReady = loadScript("data-js/index.js?v=1794472824");
  // 6: the glossary arrives after the page and marks its terms wherever the archive explains rather than quotes.
  indexReady.then(() => loadScript("data-js/glossary.js?v=1794472824")).then(() => gloss()).catch(() => {});
  const getStudies = () => (STUDIES ? Promise.resolve() : loadScript("data-js/studies.js?v=1794472824"));
  let searchReady = null;
  const getSearch = () => (searchReady ||= loadScript("data-js/search.js?v=1794472824").then(() => SEARCH.forEach((d) => { d.tl = d.t.toLowerCase(); d.xl = d.x.toLowerCase(); })));
  const getDoc = (id) => LUX.docs[id] ? Promise.resolve(LUX.docs[id]) : new Promise((res, rej) => {
    (LUX.waiting[id] ||= []).push(res);
    loadScript("data-js/doc/" + id.replaceAll("/", "__") + ".js?v=1794472824").catch(rej);
  });

  let SECTIONS = {}, ORDER = {}, REFS = {}, CARDS = {}, ENT = {}, IN_DOC = {};
  function prep() {
    CARDS = INDEX.docs;
    (INDEX.extraArt || []).forEach((a) => (ARTS[a.slug] ||= a));
    // The 244 reference cards are rebuilt here from the register rather than shipped twice.
    INDEX.references.forEach((r) => {
      CARDS["citations/" + r.id] ||= { id: "citations/" + r.id, title: r.citation, short: r.id, author: null, date: "", year: null, kind: "source",
        summary: r.note || "", section: "sources", group: r.section_title || "", plate: "st-jerome", words: 0, curated: true };
    });
    INDEX.sections.forEach((s) => {
      SECTIONS[s.id] = s;
      ORDER[s.id] = s.groups.flatMap((g) => g.ids);
    });
    INDEX.references.forEach((r) => (REFS[r.id] = r));
    ORDER.sources = INDEX.references.map((r) => "citations/" + r.id).filter((i) => CARDS[i]);
    (INDEX.people || []).forEach((e) => (ENT[e.slug] = Object.assign(e, { kind: "person" })));
    (INDEX.places || []).forEach((e) => (ENT[e.slug] = Object.assign(e, { kind: "place" })));
    Object.values(ENT).forEach((e) => (e.mentions || []).forEach(([d, n]) => (IN_DOC[d] ||= []).push([e.slug, n])));
  }

  /* ───────── helpers ───────── */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const ART = window.ART || [];
  const ARTS = Object.fromEntries(ART.map((a) => [a.slug, a]));
  const fmt = (n) => Number(n).toLocaleString("en-US");
  const roman = (n) => { let r = ""; for (const [v, s] of [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]]) while (n >= v) (r += s), (n -= v); return r; };
  const yearText = (y) => (y == null ? "" : y < 0 ? `${-y} BC` : y < 1000 ? `AD ${y}` : String(y));
  const minutes = (w) => Math.max(1, Math.round(w / 230));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const view = $("#view"), bar = $("#bar");
  const CROSS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M6.5 8.5h11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  const SEARCH_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16 16l4.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const accent = (sec) => `--accent: var(--s-${sec})`;
  const plate = (slug, eager, sizes) => {
    const a = ARTS[slug] || ARTS["creation-of-adam"];
    return `<div class="plate" style="--focus:${a.focus || "50% 30%"}"><img ${srcset(a.slug, sizes || "(max-width: 860px) 70vw, 100vw", false)} alt="${a.photo ? esc(`${a.title}, ${a.place}`) : ""}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></div>`;
  };
  // Four sizes of every work: 640 and 960px for cards and phones, 1400px for headers, 2400px for the gallery.
  // Plates are darkened and cropped, so they stop at the 1400px copy; only framed art (gallery) offers the original.
  // A work replaced with a better copy keeps its slug (and its address) but points at a new file, since /art/ is cached for 30 days.
  const fileOf = (slug) => ARTS[slug]?.file || slug;
  const srcset = (slug, sizes, full = true) => { const f = fileOf(slug); return `src="art/mid/${f}.jpg" srcset="art/sm/${f}.webp 640w, art/mid/${f}.webp 960w, art/md/${f}.webp 1400w${full ? `, art/${f}.jpg 2400w` : ""}" sizes="${sizes}"`; };
  const credit = (slug, cls = "") => {
    const a = ARTS[slug];
    if (!a) return "";
    if (a.photo || a.crop) return `<a class="plate-credit ${cls}" href="${esc(a.source)}" target="_blank" rel="noopener"><i>${esc(a.title)}</i>, ${esc(a.place)} · ${esc(a.artist)}</a>`;
    return `<a class="plate-credit ${cls}" href="#/gallery/${a.slug}">${esc(a.artist)}, <i>${esc(a.title)}</i></a>`;
  };
  const GALLERY = ART.filter((a) => !a.photo && !a.crop);
  const docHref = (id, at, q) => {
    const p = new URLSearchParams();
    if (at) p.set("at", at);
    if (q) p.set("q", q);
    return "#/doc/" + id + (p.toString() ? "?" + p : "");
  };
  const LEAVES = [[150, 30, 0, 7], [138, 25.5, -28, 6.6], [138, 34.5, 28, 6.6], [124, 22, -32, 6], [124, 38, 32, 6], [110, 19.5, -36, 5.4], [110, 40.5, 36, 5.4], [97, 18, -40, 4.6], [97, 42, 40, 4.6], [85, 17.5, -44, 3.8], [85, 42.5, 44, 3.8]];
  const FLOURISH = `<div class="flourish reveal" aria-hidden="true"><svg viewBox="0 0 420 60" fill="none" stroke-linecap="round">
      <defs><linearGradient id="gilt-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dea0"/><stop offset=".45" stop-color="#c79a4c"/><stop offset="1" stop-color="#8b6527"/></linearGradient></defs>
      <g stroke="url(#gilt-g)" fill="url(#gilt-g)">
        <path d="M14 30 H74" stroke-width=".7" fill="none" opacity=".5"/><path d="M346 30 H406" stroke-width=".7" fill="none" opacity=".5"/>
        ${[0, 1].map((m) => `<g transform="${m ? "translate(420 0) scale(-1 1)" : ""}">
          <path d="M80 18 C110 14 140 20 168 30" stroke-width="1.1" fill="none"/><path d="M80 42 C110 46 140 40 168 30" stroke-width="1.1" fill="none"/>
          ${LEAVES.map(([x, y, r, l]) => `<ellipse cx="${x}" cy="${y}" rx="${l}" ry="${(l * 0.36).toFixed(2)}" transform="rotate(${r} ${x} ${y})" stroke="none"/>`).join("")}
          <circle cx="76" cy="30" r="1.6" stroke="none"/></g>`).join("")}
        <path d="M210 7 L229 30 L210 53 L191 30 Z" stroke-width="1.1" fill="none"/>
        <path d="M210 15 V45 M200.5 25 H219.5" stroke-width="2"/>
      </g>
    </svg></div>`;
  const footer = () => `<footer class="footer">
      ${plate("ghent-lamb", false, "70vw")}
      <div class="ornament">${CROSS}</div>
      <blockquote>“There are also many other things which Jesus did, which if they would all be written, I suppose that even the world itself wouldn’t have room for the books that would be written.”<cite class="caps">John 21 · 25</cite></blockquote>
      <nav class="footer-nav">${INDEX.sections.map((s) => `<a href="#/s/${s.id}">${esc(s.title)}</a>`).join("")}<a href="#/timeline">Timeline</a><a href="#/gallery">Gallery</a><a href="#/about">About</a><a href="#/faq">FAQ</a></nav>
      <nav class="footer-nav">${Object.entries(STUDY).map(([k, t]) => `<a href="#/${k}">${esc(t.title)}</a>`).join("")}</nav>
      <div class="caps soli">${latin("Ecce Veritas", "Behold the Truth")}</div>
      <p class="footer-licence">The archive's own writing may be freely shared and adapted under <a href="https://creativecommons.org/licenses/by/4.0/" rel="license noopener" target="_blank">CC BY 4.0</a>, with credit to The Jesus Archive. Quoted translations and images keep their own licences, given with each one.</p>
    </footer>`;

  /* ───────── router & page transitions ───────── */
  const scrollMemory = {};
  let currentHash = null, cleanup = [];
  // Pages built with their text already in place (tools/prerender.mjs) carry data-ssr and html.ssr; the first
  // render swaps in identical markup, so it must not scroll the reader back to the top or replay the reveals.
  let ssrFirst = view.hasAttribute("data-ssr") && !location.hash.startsWith("#/");
  const ssrTitle = document.title;

  // "#/doc/<id>" style links (used throughout the page code and in the archive's text) ↔ real paths.
  const LEGACY = { scripture: "new-testament", gospels: "other-gospels", legal: "witnesses", denominational: "traditions", registry: "other-gospels", citations: "sources" };
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const SPECIAL = new Set(["path", "timeline", "map", "gallery", "compare", "people", "life", "prophecies", "resurrection", "manuscripts", "chain", "about", "faq"]);
  function toPath(h) {
    const [route, query] = h.replace(/^#\/?/, "").split("?");
    const parts = route.split("/").filter(Boolean);
    const q = query ? "?" + query : "";
    const [kind, ...rest] = parts;
    if (!kind) return "/" + q;
    if (kind === "doc") return "/" + rest.join("/") + q;
    if (kind === "s") return "/" + rest[0] + q;
    if (kind === "ref") return "/citations/" + rest[0] + q;
    if (kind === "p") return "/people/" + rest[0] + q;
    if (kind === "c") return "/" + (LEGACY[rest[0]] || rest[0]) + q;
    return "/" + parts.join("/") + q;
  }
  // The current address, read back into the internal route form: { parts: [kind, ...rest], params }.
  function parseHash() {
    const params = new URLSearchParams(location.search);
    const parts = location.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    if (!parts.length) return { parts: [], params };
    // section names are matched case-insensitively (/Life, /PATH/1); document ids keep their case (citations/R49)
    const first = parts[0].toLowerCase(), rest = parts.slice(1);
    if (SPECIAL.has(first)) return { parts: first === "people" && rest[0] ? ["p", rest[0].toLowerCase()] : [first, ...rest.map((x) => x.toLowerCase())], params };
    if (parts.length === 1 && (SECTIONS[first] || first === "sources")) return { parts: ["s", first], params };
    if (parts.length === 1 && LEGACY[first]) return { parts: ["s", LEGACY[first]], params };
    return { parts: ["doc", ...parts], params };
  }
  const routeKey = () => location.pathname + location.search;
  function go(h, replace) {
    const url = h.startsWith("#") ? toPath(h) : h;
    if (url === routeKey()) return;
    history[replace ? "replaceState" : "pushState"](null, "", url);
    navigate();
  }
  // Rewrite every internal "#/…" link to its real address as soon as it enters the page.
  const fixLinks = (root) => root.querySelectorAll?.('a[href^="#/"]').forEach((a) => a.setAttribute("href", toPath(a.getAttribute("href"))));
  new MutationObserver((muts) => muts.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && (n.matches?.('a[href^="#/"]') ? n.setAttribute("href", toPath(n.getAttribute("href"))) : fixLinks(n))))).observe(document.body, { childList: true, subtree: true });
  fixLinks(document);

  async function render() {
    if (currentHash !== null) scrollMemory[currentHash] = scrollY;
    if (location.hash.startsWith("#/")) history.replaceState(null, "", toPath(location.hash));
    cleanup.forEach((f) => f());
    cleanup = [];
    hideRefCard();
    closeMenu();
    await indexReady;
    if (!Object.keys(SECTIONS).length) prep();
    const { parts, params } = parseHash();
    const [kind, ...rest] = parts;
    currentHash = routeKey();
    const id = rest.join("/");

    // On the first, prerendered load, keep the header painting that is already on screen: rebuilding the page
    // would swap in a fresh copy of it, and the browser (and Google's page-speed measure) waits for that copy to paint.
    const keptPlate = ssrFirst ? $(".banner .plate img, .doc-head .plate img", view) : null;

    if (!kind) renderHome();
    else if (kind === "s" && (SECTIONS[rest[0]] || rest[0] === "sources")) renderSection(rest[0]);
    else if (kind === "doc" && CARDS[id]) await renderDoc(id, params);
    else if (kind === "path") await renderPath(rest[0]);
    else if (kind === "compare") await renderCompare(rest[0]);
    else if (kind === "people") renderPeople();
    else if (kind === "p" && ENT[rest[0]]) renderEntity(rest[0]);
    else if (kind === "map") await renderMap(params.get("place"));
    else if (kind === "timeline") renderTimeline();
    else if (kind === "chain" && !rest.length) await renderChain(params);
    else if (kind === "gallery") await renderGallery(rest[0]);
    else if ((kind === "about" || kind === "faq") && !rest.length) await renderPage(kind);
    else if (STUDY[kind] && !rest.length) await renderStudy(kind);
    else renderLost();

    if (keptPlate) { const fresh = $(".banner .plate img, .doc-head .plate img", view); if (fresh && fresh.getAttribute("src") === keptPlate.getAttribute("src")) fresh.replaceWith(keptPlate); }

    const top = "/" + (kind === "p" ? "people" : SPECIAL.has(kind) ? kind : "");
    $$(".bar-nav a").forEach((a) => a.classList.toggle("on", top !== "/" && a.getAttribute("href") === top));
    $(".nav-more-btn")?.classList.toggle("on", !!$(".nav-drop a.on"));
    const named = $(".banner .plate, .doc-head .plate");
    // (the chain page draws its own header)
    if (named && !$$("[data-vt]").length && document.documentElement.classList.contains("vt-fly")) named.style.viewTransitionName = "plate";

    if (pendingScroll) {
      const t = document.getElementById(pendingScroll);
      pendingScroll = null;
      if (t) window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - 110, behavior: "instant" });
    } else if (ssrFirst) {
      ssrFirst = false;
      document.title = ssrTitle;
      view.removeAttribute("data-ssr");
    } else if (!params.get("at") && !params.get("q")) {
      // only Back/Forward return to where the reader was; a fresh click always opens the page at the top
      window.scrollTo({ top: restoring ? scrollMemory[routeKey()] || 0 : 0, behavior: "instant" });
    }
    restoring = false;
    typeset(view);
    gloss();
    sidenotes();
    observeReveals();
    candleEls = reduced ? [] : $$(CANDLE);
    if (!reduced) { candle(); candleEls.forEach((el) => el.querySelector("img")?.addEventListener("load", candle, { once: true })); }
    // 12: the hall banner's reveal begins once its painting has actually loaded
    // A painting that has just flown in from a card lands as it is; the zoom-in-and-settle entrance is only for arrivals without one.
    if (document.documentElement.classList.contains("vt-fly")) $(".banner.detail")?.classList.remove("detail");
    const det = $(".banner.detail img");
    if (det) { const start = () => det.closest(".banner").classList.add("go"); det.complete ? start() : det.addEventListener("load", start, { once: true }); }
    onScroll();
    document.documentElement.dataset.rendered = currentHash;
  }

  let pendingScroll = null, restoring = false;
  function navigate() {
    document.documentElement.classList.remove("ssr");
    if (!document.startViewTransition || reduced) {
      document.documentElement.classList.add("no-vt");
      return render().then(() => { view.classList.remove("enter"); void view.offsetWidth; view.classList.add("enter"); });
    }
    const t = document.startViewTransition(async () => {
      $$("[data-vt]").forEach((el) => { el.style.viewTransitionName = ""; el.removeAttribute("data-vt"); });
      await render();
    });
    t.ready.catch(() => {});
    t.updateCallbackDone.catch(() => {});
    t.finished.catch(() => {}).finally(() => { document.documentElement.classList.remove("vt-fly"); $$(".plate").forEach((p) => (p.style.viewTransitionName = "")); });
  }
  addEventListener("popstate", () => { restoring = true; navigate(); });
  addEventListener("hashchange", () => location.hash.startsWith("#/") && go(location.hash, true));

  // The painting on a card flies into the next page's header.
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='/']");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const p = a.querySelector(".plate");
    if (!p || !document.startViewTransition || reduced) return;
    $$(".plate").forEach((x) => (x.style.viewTransitionName = ""));
    p.style.viewTransitionName = "plate";
    p.setAttribute("data-vt", "");
    // Only a click on a card's painting flies that painting into the next page's header; other navigation simply fades.
    document.documentElement.classList.add("vt-fly");
  }, true);

  // Internal links change the address without reloading; "#…" links only scroll within the page.
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download") || a.closest("[data-scroll]")) return;
    const href = a.getAttribute("href");
    if (href.startsWith("#/")) { e.preventDefault(); go(href); return; }
    if (href.startsWith("#")) {
      e.preventDefault();
      const el = href.length > 1 && document.getElementById(href.slice(1));
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 110, behavior: "smooth" });
      return;
    }
    if (href.startsWith("/") && !href.startsWith("//")) { e.preventDefault(); go(href); }
  });

  document.addEventListener("click", (e) => {
    const s = e.target.closest("[data-scroll]");
    if (s) {
      e.preventDefault();
      const target = document.getElementById(s.dataset.scroll);
      if (target) window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - 110, behavior: "smooth" });
      else { pendingScroll = s.dataset.scroll; go("/"); }
    }
    const z = e.target.closest("[data-zoom]");
    if (z) { e.preventDefault(); openLightbox(z.dataset.zoom); }
    if (e.target.closest("[data-search]")) { e.preventDefault(); openSearch(); }
  });

  /* ───────── ambient behaviour ───────── */
  function onScroll() {
    bar.classList.toggle("solid", scrollY > 40);
    const prog = $(".progress"), folio = $(".folio");
    if (prog && folio) {
      const r = folio.getBoundingClientRect();
      prog.style.transform = `scaleX(${Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight * 0.6)))})`;
    }
    if (!reduced && !scrollQueued) { scrollQueued = true; requestAnimationFrame(candle); }
    const ghost = $(".ghost");
    if (ghost) {
      const head = $(".doc-head");
      ghost.classList.toggle("on", head && head.getBoundingClientRect().bottom < innerHeight * 0.4);
      ghost.style.setProperty("--py", -scrollY * 0.04 + "px");
    }
  }
  addEventListener("scroll", onScroll, { passive: true });

  // The large paintings drift a little as they pass, and a warm light moves across them,
  // as though carried by a candle.
  let scrollQueued = false;
  const CANDLE = ".banner .plate, .doc-head .plate, .stop-art .plate, .path-cta .plate, .coda .plate";
  let candleEls = [];
  function candle() {
    scrollQueued = false;
    const h = innerHeight;
    const rects = candleEls.map((el) => el.getBoundingClientRect());
    candleEls.forEach((el, n) => {
      const r = rects[n];
      if (r.bottom < 0 || r.top > h) return;
      const k = Math.max(-1, Math.min(1, (r.top + r.height / 2 - h / 2) / h));
      el.style.setProperty("--par", (k * -10).toFixed(1) + "px");
      el.style.setProperty("--lx", (50 - k * 35).toFixed(1) + "%");
      el.style.setProperty("--ly", (30 + k * 15).toFixed(1) + "%");
    });
  }
  addEventListener("resize", () => !reduced && candle(), { passive: true });


  document.addEventListener("pointermove", (e) => {
    const g = e.target.closest?.(".glow");
    if (!g) return;
    const r = g.getBoundingClientRect();
    g.style.setProperty("--mx", e.clientX - r.left + "px");
    g.style.setProperty("--my", e.clientY - r.top + "px");
  }, { passive: true });

  let revealObs;
  function observeReveals() {
    revealObs?.disconnect();
    revealObs = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      revealObs.unobserve(en.target);
    }), { rootMargin: "0px 0px 4% 0px", threshold: 0.01 });
    $$(".reveal").forEach((el) => revealObs.observe(el));
  }

  const menuBtn = $("#menuBtn");
  // Desktop "Explore" dropdown: opens on hover or click, closes on leaving, Escape, an outside click or navigation.
  // On narrow screens its links simply sit in the menu list.
  const more = $(".nav-more"), moreBtn = $(".nav-more-btn");
  let moreTimer = null;
  const setMore = (on) => { clearTimeout(moreTimer); if (!more) return; more.classList.toggle("open", on); moreBtn.setAttribute("aria-expanded", on); };
  const closeMenu = () => { bar.classList.remove("open"); setMore(false); };
  menuBtn.addEventListener("click", () => bar.classList.toggle("open"));
  if (more) {
  moreBtn.addEventListener("click", () => setMore(!more.classList.contains("open")));
  more.addEventListener("mouseenter", () => { if (matchMedia("(hover: hover) and (min-width: 1121px)").matches) setMore(true); });
  more.addEventListener("mouseleave", () => { moreTimer = setTimeout(() => setMore(false), 220); });
  document.addEventListener("click", (e) => { if (!more.contains(e.target)) setMore(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && more.classList.contains("open")) { setMore(false); moreBtn.focus(); } });
  }

  /* ───────── Latin that turns into English ─────────
     Any element with data-en morphs to that English text on hover (tap on touch screens):
     each letter flickers through Greek and Latin capitals and settles, left to right. */
  const GLYPHS = "ΑΒΓΔΕΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩABCDEFGHILMNOPQRSTVX";
  const morphs = new WeakMap();
  const morphTarget = (el) => el.querySelector(":scope > .morph-text") || el;
  function morph(el, to) {
    const node = morphTarget(el);
    const prev = morphs.get(el);
    if (prev) cancelAnimationFrame(prev.raf);
    const from = node.textContent;
    if (from === to) return;
    if (reduced) { node.textContent = to; return; }
    const len = Math.max(from.length, to.length);
    const t0 = performance.now();
    const settle = Array.from({ length: len }, (_, i) => 120 + i * (520 / len) + Math.random() * 180);
    const state = { raf: 0 };
    morphs.set(el, state);
    el.classList.add("morphing");
    const frame = (t) => {
      const dt = t - t0;
      let out = "", done = true;
      for (let i = 0; i < len; i++) {
        const c = to[i] ?? "";
        if (dt >= settle[i]) out += c;
        else {
          done = false;
          const f = from[i] ?? "";
          if (c === " " && (f === " " || !f)) out += " ";
          else if (dt < settle[i] * 0.25 && f) out += f;
          else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
      }
      node.textContent = out;
      if (done) { node.textContent = to; el.classList.remove("morphing"); morphs.delete(el); }
      else state.raf = requestAnimationFrame(frame);
    };
    state.raf = requestAnimationFrame(frame);
  }
  const showEnglish = (el, on) => {
    if (!el.dataset.la) el.dataset.la = morphTarget(el).textContent;
    el.classList.toggle("en", on);
    morph(el, on ? el.dataset.en : el.dataset.la);
  };
  // The English lingers for two seconds after the pointer leaves, then turns back into Latin.
  const lingering = new WeakMap();
  // Touch screens send a synthetic hover before every tap; only real pointers use hover, so a tap toggles once.
  const canHover = () => matchMedia("(hover: hover)").matches;
  document.addEventListener("mouseover", (e) => {
    if (!canHover()) return;
    const el = e.target.closest?.("[data-en]");
    if (!el || el.contains(e.relatedTarget) || el.dataset.ready === "0") return;
    clearTimeout(lingering.get(el));
    if (!el.classList.contains("en")) showEnglish(el, true);
  });
  document.addEventListener("mouseout", (e) => {
    if (!canHover()) return;
    const el = e.target.closest?.("[data-en]");
    if (!el || el.contains(e.relatedTarget)) return;
    clearTimeout(lingering.get(el));
    lingering.set(el, setTimeout(() => showEnglish(el, false), 2000));
  });
  document.addEventListener("click", (e) => {
    if (canHover()) return;
    const el = e.target.closest("[data-en]");
    if (!el || el.closest("a")) return;
    showEnglish(el, !el.classList.contains("en"));
  });
  const latin = (la, en, cls = "") => `<span class="latin ${cls}" data-en="${esc(en)}" aria-label="${esc(la)} (${esc(en)})" title=""><span class="morph-text" aria-hidden="true">${esc(la)}</span></span>`;
  const LATIN_TITLES = { "Ecce Homo": "Behold the Man", "Salvator Mundi": "Savior of the World", "Pietà": "Compassion" };

  // An illuminated initial: the first letter of a paragraph, set in gold on a lapis ground with vines.
  /* An illuminated initial in the Florentine manner of the 1450s–80s ("bianchi girari", white vine):
     a burnished gold Roman capital, outlined in ink, on a blue ground with green and rose pockets and
     white vine-stems, in a thin gold border. A stem of gold ivy grows from its corner down the margin. */
  let initials = 0;
  function initialArt(letter) {
    const k = ++initials, id = (n) => `il${k}${n}`;
    const size = /[MW]/.test(letter) ? 88 : /[IJ]/.test(letter) ? 108 : 102;
    const ivy = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 0l3 0" stroke="url(#${id("f")})" stroke-width=".9" fill="none"/><path transform="scale(.8)" d="M0 0c-3-1-7-5-6-10 2 1 4 1 5-1 1 3 1 5 1 7 0-2 0-4 1-7 1 2 3 2 5 1 1 5-3 9-6 10z"/></g>`;
    const stem = "M60 6C40 8 22 14 16 30c-5 13 4 24 14 20 8-3 7-14-1-14M16 30c-6 6-8 16-6 28";
    const quarter = (eye) => `<circle cx="25" cy="40" r="6.5" fill="${eye}"/>
      <g fill="none" stroke-linecap="round"><path d="${stem}" stroke="#0e1d4a" stroke-width="3.2"/><path d="${stem}" stroke="#f4ecd6" stroke-width="2"/></g>
      <g fill="#f4ecd6"><circle cx="36" cy="19" r="1.2"/><circle cx="39.2" cy="19" r="1.2"/><circle cx="37.6" cy="16.4" r="1.2"/></g>`;
    return `<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="${id("g")}" x1="0" y1="0" x2=".25" y2="1"><stop offset="0" stop-color="#f8e08c"/><stop offset=".18" stop-color="#e6bd55"/><stop offset=".5" stop-color="#c6952f"/><stop offset=".56" stop-color="#eac56a"/><stop offset=".64" stop-color="#c99a35"/><stop offset="1" stop-color="#a8771f"/></linearGradient>
        <linearGradient id="${id("f")}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2bd5c"/><stop offset="1" stop-color="#c99a35"/></linearGradient>
        <linearGradient id="${id("s")}" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fffbe8" stop-opacity=".4"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <filter id="${id("m")}" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${k}"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .07 0"/></filter>
        <clipPath id="${id("c")}"><text x="60" y="${60 + size * .35}" text-anchor="middle" class="il-glyph" font-size="${size}">${letter}</text></clipPath>
      </defs>
      <g class="il-vine" fill="none" stroke-linecap="round">
        <path pathLength="1" d="M3 112c-6 8-12 16-12 30s5 18 1 30c-3 9-10 12-10 22" stroke="url(#${id("f")})" stroke-width="1.1"/>
        <g class="il-leaves">
          <path d="M-10 140c-5-1-8 2-6 5M-11 176c-5 0-7 3-5 6" stroke="#c99a35" stroke-width=".5"/>
          <g fill="url(#${id("f")})" stroke="#2a1a06" stroke-width=".6">${ivy(-8, 128, 120)}${ivy(-11, 150, 70)}${ivy(-12, 166, 115)}${ivy(-18, 186, 80)}<circle cx="-19" cy="195" r="2.2"/></g>
        </g>
      </g>
      <rect x="3" y="3" width="114" height="114" fill="url(#${id("f")})"/>
      <rect x="6" y="6" width="108" height="108" fill="#1f3f8f"/>
      <g>${[0, 90, 180, 270].map((r, i) => `<g transform="rotate(${r} 60 60)">${quarter(i % 2 ? "#b0475a" : "#2f6b45")}</g>`).join("")}</g>
      <rect x="6" y="6" width="108" height="108" filter="url(#${id("m")})"/>
      <rect x="3" y="3" width="114" height="114" fill="none" stroke="#2a1a06" stroke-width=".8"/>
      <rect x="6" y="6" width="108" height="108" fill="none" stroke="#2a1a06" stroke-width=".6"/>
      <path class="il-ring" d="M4.5 4.5H115.5V115.5H4.5Z" fill="none" stroke="#fffbe8" stroke-width="3" stroke-linecap="round"/>
      <text x="60.8" y="${61.2 + size * .35}" text-anchor="middle" class="il-glyph" font-size="${size}" fill="#060d24" opacity=".55">${letter}</text>
      <text x="60" y="${60 + size * .35}" text-anchor="middle" class="il-glyph" font-size="${size}" fill="url(#${id("g")})" stroke="#1e1204" stroke-width="1.1" paint-order="stroke">${letter}</text>
      <g clip-path="url(#${id("c")})"><rect class="il-shine" x="-60" y="0" width="46" height="120" fill="url(#${id("s")})" transform="skewX(-18)"/></g>
    </svg>`;
  }
  function illuminate(p) {
    if (!p || p.classList.contains("lit") || !/^[\s“‘"']*\p{L}/u.test(p.textContent)) return;
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode()) && !/\p{L}/u.test(node.nodeValue));
    if (!node || node.parentElement.closest("sup, a")) return;
    const i = node.nodeValue.search(/\p{L}/u);
    const letter = node.nodeValue[i].toUpperCase();
    const after = node.splitText(i);
    after.nodeValue = after.nodeValue.slice(1);
    const span = document.createElement("span");
    span.className = "initial";
    span.innerHTML = `${initialArt(esc(letter))}<span class="sr">${esc(letter)}</span>`;
    after.parentNode.insertBefore(span, after);
    const word = after.nodeValue.match(/^\p{L}+/u);
    if (word) {
      const rest = after.splitText(word[0].length);
      const tail = document.createElement("span");
      tail.className = "il-tail";
      after.parentNode.insertBefore(tail, rest);
      tail.append(after);
    }
    requestAnimationFrame(() => requestAnimationFrame(() => span.classList.add("on")));
    p.classList.add("lit");
  }

  // "Cite this page": ready-made citations to copy, with the original source when there is one.
  let citeInfo = null;
  const SITE = "https://thejesusarchive.com";
  const closeCite = (refocus) => { const pop = $(".cite-pop"); if (!pop) return; pop.remove(); if (refocus) $("[data-cite]")?.focus(); };
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cite]");
    const open = $(".cite-pop");
    if (open && !e.target.closest(".cite-pop")) { open.remove(); if (btn) return; }
    if (!btn || !citeInfo) return;
    e.preventDefault();
    const now = new Date();
    const month = (d) => ["Jan.", "Feb.", "Mar.", "Apr.", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."][d.getMonth()];
    const long = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const url = SITE + citeInfo.path;
    const t = esc(citeInfo.title);
    const styles = [
      ["Chicago", `“${t}.” The Jesus Archive. Accessed ${long}. ${url}.`],
      ["MLA", `“${t}.” <i>The Jesus Archive</i>, ${url.replace(/^https:\/\//, "")}. Accessed ${now.getDate()} ${month(now)} ${now.getFullYear()}.`],
      ["APA", `The Jesus Archive. (n.d.). <i>${t}</i>. Retrieved ${long}, from ${url}`],
    ];
    const src = citeInfo.source?.name ? `<p class="cite-src"><b class="caps">Original source</b>${esc(citeInfo.source.name)}${citeInfo.source.url ? `, ${esc(citeInfo.source.url)}` : ""}</p>` : "";
    const pop = document.createElement("div");
    pop.className = "cite-pop";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", "Cite this page");
    pop.innerHTML = `<div class="cite-head"><b class="caps">Cite this page</b><button type="button" class="cite-close" aria-label="Close"><svg class="x-ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/></svg></button></div>${styles.map(([k, v]) => `<div class="cite-row"><span class="caps">${k}</span><p>${v}</p><button type="button" class="cite-copy" aria-label="Copy ${k} citation">Copy</button></div>`).join("")}${src}`;
    document.body.append(pop);   // outside the page header, so nothing on the page can paint over it
    cleanup.push(() => closeCite());
    const r = btn.getBoundingClientRect();
    if (innerWidth > 640) {
      pop.style.top = Math.max(16, Math.min(innerHeight - pop.offsetHeight - 16, r.bottom + 10)) + "px";
      pop.style.left = Math.max(16, Math.min(innerWidth - pop.offsetWidth - 16, r.left)) + "px";
    }
    $(".cite-copy", pop).focus({ preventScroll: true });
    pop.addEventListener("click", (ev) => {
      if (ev.target.closest(".cite-close")) return closeCite(true);
      const b = ev.target.closest(".cite-copy");
      if (!b) return;
      navigator.clipboard?.writeText(b.previousElementSibling.textContent).then(() => { b.textContent = "Copied"; setTimeout(() => (b.textContent = "Copy"), 1600); });
    });
  });
  addEventListener("keydown", (e) => e.key === "Escape" && $(".cite-pop") && closeCite(true));
  addEventListener("scroll", () => innerWidth > 640 && $(".cite-pop")?.remove(), { passive: true });

  /* ═════════════ HOME ═════════════ */
  const DOORS = [
    { id: "scripture/new-testament/07-1-corinthians", at: "key-1", n: "I", title: "The earliest record", text: "Paul passes on a creed about the death and resurrection of Jesus that was formed within a few years of the crucifixion.", plate: "resurrection" },
    { id: "witnesses/tacitus-annals-15-44", n: "II", title: "What Rome wrote", text: "Rome’s greatest historian on “Christus”, executed under Pontius Pilate, and the believers Nero burned.", plate: "crucifixion-peter" },
    { id: "dossier/06-what-evidence-can-establish", n: "III", title: "Weigh the evidence", text: "An honest account of what history can establish about Jesus, and where faith begins.", plate: "thomas" },
  ];
  // How the record for Jesus compares with other famous lives of the ancient world.
  const COMPARE_FACTS = [
    ["c. 20 years", "from the crucifixion to Paul’s earliest letters. The fullest surviving lives of Alexander the Great were written some four hundred years after his death."],
    ["5,800+", "Greek manuscripts of the New Testament survive. Tacitus’s Annals, Rome’s great history of the period, rests on two."],
    ["Within a century", "Josephus, Tacitus, Pliny and Suetonius, none of them Christians, write of Christ or his followers."],
  ];
  // Quick facts set beside the hall they belong to.
  const HALL_FACTS = { "new-testament": [COMPARE_FACTS[0], COMPARE_FACTS[1]], witnesses: [COMPARE_FACTS[2]] };
  // The seven halls on the home page, in three rows. The Dossier is the research behind them, linked beneath.
  const HALL_ROWS = [
    ["Scripture", ["old-testament", "new-testament"]],
    ["Witnesses", ["witnesses", "fathers", "archaeology"]],
    ["Other accounts", ["other-gospels", "traditions"]],
  ];
  const ERAS = [
    [-9999, 1, "Before his birth", "The prophets, and the scrolls that preserved them"],
    [1, 100, "The apostolic age", "The lifetime of those who knew him"],
    [100, 200, "The second century", "The Fathers, the apologists and the first critics"],
    [200, 400, "Persecution and peace", "From the house-churches to the councils"],
    [400, 1900, "The long memory", "Late antiquity, Islam and the Middle Ages"],
    [1900, 9999, "Our own time", "The churches, and modern science, speak"],
  ];
  const timelineDocs = () => Object.values(CARDS)
    .filter((c) => c.year != null && c.kind !== "research" && c.kind !== "source")
    .sort((a, b) => a.year - b.year || INDEX.sections.findIndex((s) => s.id === a.section) - INDEX.sections.findIndex((s) => s.id === b.section));

  // Smallest hero file that is still sharp. Phones and small tablets keep the light 1400px copy (as before);
  // larger screens get the width the painting is actually drawn at (it covers the hero, about 2.2:1),
  // times pixel density and the slow 14% zoom: 1400px (1x laptops), 2400px, or the full 3524px.
  const heroFile = () => {
    if (innerWidth < 900) return "md/creation-of-adam.webp";
    const need = Math.max(innerWidth, innerHeight * 2.2) * Math.min(devicePixelRatio || 1, 2) * 1.14;
    return need <= 1400 ? "md/creation-of-adam.webp" : need <= 2400 ? "lg/creation-of-adam.webp" : "creation-of-adam.webp";
  };
  function renderHome() {
    document.title = "The Jesus Archive | The Greatest Story Ever Told";
    const total = Object.values(CARDS).filter((c) => c.section !== "sources").length;
    const items = timelineDocs();
    let era = -1;
    const ribbon = items.map((c) => {
      let pre = "";
      const e = ERAS.findIndex(([a, b]) => c.year >= a && c.year < b);
      if (e !== era) { era = e; pre = `<div class="era-tick"><span>${esc(ERAS[e][2])}</span></div>`; }
      return `${pre}<a class="tick" href="#/doc/${c.id}" style="${accent(c.section)}"><span class="tick-year">${esc(yearText(c.year))}</span><b>${esc(c.short)}</b><small>${esc(c.title)}</small></a>`;
    }).join("");
    const title = "The Greatest Story Ever Told";
    view.innerHTML = `
      <section class="hero" aria-label="The Jesus Archive">
        <div class="hero-art"><img id="heroImg" src="art/${heroFile()}" fetchpriority="high" alt="Michelangelo’s Creation of Adam: the hand of God reaching toward Adam"></div>
        <div class="hero-veil"></div>
        <canvas id="motes" aria-hidden="true"></canvas>
        <div class="spark" aria-hidden="true"></div>
        <div class="hero-copy">
          <h1 class="hero-title" id="heroTitle" aria-label="${title}">${title.split(" ").map((word, w, all) => `<span class="word">${[...word].map((ch, k) => `<span class="ch gilt" style="--i:${all.slice(0, w).join(" ").length + (w ? 1 : 0) + k}" aria-hidden="true">${ch}</span>`).join("")}</span>`).join(" ")}</h1>
          <p class="hero-sub">and the most closely examined. Here is every witness that survives, in their own words.</p>
        </div>
        ${credit("creation-of-adam", "hero-credit")}
        <div class="scroll-cue" aria-hidden="true"></div>
      </section>

      <section class="section" id="begin">
        <header class="section-head reveal">
          <div class="ornament">${CROSS}</div>
          <h2 class="section-title">“That you might know <em>the certainty</em>”</h2>
        </header>
        <a class="path-cta glow reveal" href="#/path">
          ${plate("emmaus", false, "(max-width: 860px) 62vw, 1240px")}
          <span class="caps">New here? Begin with the guided path</span>
          <b>${esc(window.PATH.title)}</b>
          <span class="path-cta-lede">${esc(window.PATH.lede)}</span>
          <span class="link-gold">Begin <span class="arrow">→</span></span>
        </a>
        <span class="caps studies-label reveal">Or begin with a study</span>
        <div class="studies home-studies">${Object.entries(STUDY).map(([k, t], i) => `<a class="study glow reveal" href="#/${k}" style="--d:${i * 0.08}s">
          ${plate(t.card, false, "(max-width: 640px) 90vw, (max-width: 1100px) 45vw, 300px")}
          <span class="caps">${esc(t.kicker)}</span><b>${esc(t.title)}</b><span>${esc(t.blurb)}</span></a>`).join("")}</div>
      </section>

      ${FLOURISH}
      <section class="section" id="testimony" style="padding-top:0">
        <header class="section-head reveal">
          
          <span class="caps">The testimony</span>
          <h2 class="section-title">Seven <em>halls</em> of witness</h2>
          <p class="section-lede">Each hall holds one kind of witness. The writings in each are arranged in the order in which they were written.</p>
        </header>
        ${HALL_ROWS.map(([label, ids]) => `<div class="hall-row reveal"><span class="caps hall-row-label">${label}</span><div class="hall-tiles" style="--cols:${ids.length}">${ids.map((id) => SECTIONS[id]).filter(Boolean).map((s) => {
          const n = ORDER[s.id].length;
          return `<a class="hall-tile glow" href="#/s/${s.id}" style="${accent(s.id)}">${plate(s.plate, false, "(max-width: 640px) 90vw, (max-width: 1100px) 45vw, 480px")}
            <span class="caps hall-kicker">${esc(s.kicker)}</span><h3>${esc(s.title)}</h3>
            <span class="hall-meta"><span class="hall-count">${n} ${n === 1 ? "writing" : "writings"}</span><span class="link-gold">Enter <span class="arrow">→</span></span></span></a>`;
        }).join("")}</div></div>`).join("")}
      </section>

      ${FLOURISH}
      <section class="section" id="centuries" style="padding-top:0">
        <header class="section-head reveal">
          
          <span class="caps">Through the centuries</span>
          <h2 class="section-title">Two thousand <em>years</em></h2>
          <p class="section-lede">From the Isaiah scroll copied before his birth to statements issued in our own decade. Drag through the years.</p>
        </header>
        <div class="ribbon-wrap reveal"><div class="ribbon" id="ribbon">${ribbon}</div></div>
        <p class="center reveal"><a class="link-gold" href="#/timeline">The full timeline <span class="arrow">→</span></a></p>
      </section>

      ${FLOURISH}
      <section class="section" id="art" style="padding-top:0">
        <div class="invite">
          <div class="fan reveal">${["annunciation", "calling-matthew", "salvator-mundi", "emmaus", "pieta"].map((s, i) => `<a href="#/gallery/${s}" style="--k:${i - 2}" aria-label="${esc(ARTS[s]?.title)}"><img src="art/sm/${s}.webp" alt="" loading="lazy"></a>`).join("")}</div>
          <div class="reveal" style="--d:.15s">
            <span class="caps" style="color:var(--gold)">${latin("Soli Deo Gloria", "Glory to God Alone")}</span>
            <h2>The art in these halls</h2>
            <p>The masterpieces that light this archive were painted and carved to the glory of God. Each has its own story of commission, craft and faith.</p>
            <a class="btn btn-ghost" href="#/gallery">Visit the gallery</a>
          </div>
        </div>
        <p class="center reveal dossier-link home-dossier"><a class="link-gold" href="#/s/dossier">The Dossier · the research behind the archive <span class="arrow">→</span></a></p>
      </section>
      ${footer()}`;
    setupHero();
    setupRibbon();
  }

  /* Keep the gap between the two fingers at the heart of the screen. */
  function setupHero() {
    const img = $("#heroImg"), hero = $(".hero"), canvas = $("#motes");
    const GAP = { x: 0.3775, y: 0.427 };
    let gx = 0, gy = 0;
    const fit = () => {
      if (!img.naturalWidth) return;
      const W = img.naturalWidth, H = img.naturalHeight, w = hero.clientWidth, h = hero.clientHeight;
      const portrait = w / h < 1;
      // The fingertips sit just left of the horizontal centre, which reads as centred; scale up just enough that the
      // painting still covers the edges once it is shifted to put them there.
      const tx = 0.48, ty = portrait ? 0.36 : 0.4;
      const s = Math.max(w / W, h / H, (tx * w) / (GAP.x * W), ((1 - tx) * w) / ((1 - GAP.x) * W), (ty * h) / (GAP.y * H), ((1 - ty) * h) / ((1 - GAP.y) * H)) * (portrait ? 1.35 : 1.02);
      const iw = W * s, ih = H * s;
      const left = Math.min(0, Math.max(w - iw, w * tx - GAP.x * iw));
      const top = Math.min(0, Math.max(h - ih, h * ty - GAP.y * ih));
      Object.assign(img.style, { width: iw + "px", height: ih + "px", left: left + "px", top: top + "px" });
      img.style.setProperty("--ox", GAP.x * iw + "px");
      img.style.setProperty("--oy", GAP.y * ih + "px");
      gx = left + GAP.x * iw; gy = top + GAP.y * ih;
      hero.style.setProperty("--gx", gx + "px");
      hero.style.setProperty("--gy", gy + "px");
      canvas.width = w * devicePixelRatio; canvas.height = h * devicePixelRatio;
      img.classList.add("ready");
    };
    img.complete ? fit() : img.addEventListener("load", fit);
    addEventListener("resize", fit);
    cleanup.push(() => removeEventListener("resize", fit));
    if (reduced) return;

    // Motes of light: some drift up through the room, some spill from between the fingers.
    const ctx = canvas.getContext("2d");
    const motes = [];
    const spawn = (fromGap) => {
      const a = Math.random() * Math.PI * 2, sp = 0.15 + Math.random() * 0.5;
      return fromGap
        ? { x: gx, y: gy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.1, r: 0.8 + Math.random() * 1.8, life: 0, max: 160 + Math.random() * 200 }
        : { x: Math.random() * hero.clientWidth, y: hero.clientHeight * (0.4 + Math.random() * 0.7), vx: (Math.random() - 0.5) * 0.15, vy: -0.12 - Math.random() * 0.3, r: 0.6 + Math.random() * 1.6, life: 0, max: 400 + Math.random() * 500 };
    };
    const small = innerWidth < 760, base = small ? 22 : 60, cap = small ? 40 : 110;
    for (let i = 0; i < base; i++) { const m = spawn(false); m.life = Math.random() * m.max; motes.push(m); }
    let raf, visible = true;
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) loop(); });
    io.observe(hero);
    function loop() {
      if (!visible) return;
      const d = devicePixelRatio;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "lighter";
      if (motes.length < cap && Math.random() < (small ? 0.13 : 0.23)) motes.push(spawn(true));
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i];
        m.x += m.vx + Math.sin((m.life + i) / 40) * 0.12; m.y += m.vy; m.life++;
        if (m.life > m.max) { motes.splice(i, 1); if (motes.length < base) motes.push(spawn(false)); continue; }
        const k = Math.sin((m.life / m.max) * Math.PI);
        const g = ctx.createRadialGradient(m.x * d, m.y * d, 0, m.x * d, m.y * d, m.r * 5 * d);
        g.addColorStop(0, `rgba(255, 238, 190, ${0.75 * k})`);
        g.addColorStop(1, "rgba(255, 210, 140, 0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(m.x * d, m.y * d, m.r * 5 * d, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    }
    loop();
    cleanup.push(() => { cancelAnimationFrame(raf); io.disconnect(); visible = false; });
  }

  function setupRibbon() {
    const r = $("#ribbon");
    if (!r) return;
    // Drag with the mouse, and let it glide to a stop when released.
    let down = false, sx = 0, sl = 0, moved = 0, vx = 0, lastX = 0, lastT = 0, glide;
    r.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return;
      cancelAnimationFrame(glide);
      down = true; moved = 0; vx = 0; sx = lastX = e.clientX; sl = r.scrollLeft; lastT = performance.now();
    });
    const move = (e) => {
      if (!down) return;
      const dx = e.clientX - sx, now = performance.now();
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 5) r.classList.add("drag");
      vx = (e.clientX - lastX) / Math.max(1, now - lastT);
      lastX = e.clientX; lastT = now;
      r.scrollLeft = sl - dx;
    };
    const up = () => {
      if (!down) return;
      down = false;
      setTimeout(() => r.classList.remove("drag"), 0);
      let v = Math.max(-40, Math.min(40, -vx * 14));
      const step = () => { if (Math.abs(v) < 0.4) return; r.scrollLeft += v; v *= 0.94; glide = requestAnimationFrame(step); };
      glide = requestAnimationFrame(step);
    };
    addEventListener("pointermove", move);
    addEventListener("pointerup", up);
    cleanup.push(() => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); cancelAnimationFrame(glide); });
  }

  /* ═════════════ SECTION ═════════════ */
  function banner({ slug, crumbs, kicker, title, lede, extra = "", detail = false }) {
    return `<section class="banner${detail ? " detail" : ""}">
      ${plate(slug, true)}
      ${credit(slug)}
      <div class="banner-copy">
        <h1>${title}</h1>
        ${lede ? `<p>${lede}</p>` : ""}
        ${extra}
      </div>
    </section>`;
  }

  function renderSection(id) {
    const s = id === "sources" ? INDEX.sections.find((x) => x.id === "sources") : SECTIONS[id];
    document.title = `${s.title} | The Jesus Archive`;
    const ids = ORDER[id] || [];
    const words = ids.reduce((n, i) => n + (CARDS[i]?.words || 0), 0);
    let body;
    if (id === "sources") {
      const groups = {};
      INDEX.references.forEach((r) => (groups[r.section_title || "Other"] ||= []).push(r));
      body = Object.entries(groups).map(([g, rs]) => `<div class="group reveal"><div class="group-head"><h2>${esc(g)}</h2><span>${rs.length} references</span></div>
        <div class="refs-list">${rs.map((r) => `<a class="ref-row" href="#/doc/citations/${r.id}" data-ref="${r.id}"><b>${esc(r.id)}</b><span>${esc(r.citation)}<small>${esc(r.note || "")}</small></span></a>`).join("")}</div></div>`).join("");
    } else {
      body = s.groups.map((g) => `<div class="group reveal"><div class="group-head"><h2>${esc(g.title)}</h2><span>${g.ids.length} ${g.ids.length === 1 ? "writing" : "writings"}</span></div>
        <ol class="entries">${g.ids.filter((i) => CARDS[i]).map((i) => entry(CARDS[i])).join("")}</ol></div>`).join("");
    }
    view.innerHTML = `
      ${banner({ detail: true, slug: s.plate, crumbs: `<a href="#/">The Jesus Archive</a><i>/</i><a href="#/" data-scroll="testimony">The testimony</a>`, kicker: s.kicker, title: esc(s.title), lede: esc(s.lede),
        extra: `<div class="banner-stats"><span><b>${ids.length}</b>${id === "sources" ? "references" : "writings"}</span>${id === "sources" ? "" : `<span><b>${fmt(words)}</b>words</span>`}</div>` })}
      <div class="sec-body" style="${accent(id)}">${HALL_FACTS[id] ? `<aside class="quick-facts reveal" aria-label="Quick facts">${HALL_FACTS[id].map(([v, l]) => `<p class="quick-fact"><span class="caps">Quick fact</span><b>${v}</b> ${l}</p>`).join("")}</aside>` : ""}${body}</div>
      ${footer()}`;
  }

  function entry(c) {
    const a = ARTS[c.plate];
    return `<li class="entry"><a class="glow" href="#/doc/${c.id}">
      <span class="ghost-plate" style="--focus:${a?.focus || "50% 30%"}"><img src="art/sm/${fileOf(c.plate)}.webp" alt="" loading="lazy"></span>
      <span class="entry-year">${c.year != null && c.kind !== "research" ? esc(yearText(c.year)) : "✠"}<small>${esc(c.date)}</small></span>
      <span><h3>${esc(c.title)}</h3>${c.author ? `<p class="by">${esc(c.author)}</p>` : ""}<p class="sum">${esc(c.summary)}</p></span>
      <span class="arrow">→</span></a></li>`;
  }

  /* ═════════════ DOCUMENT ═════════════ */
  async function renderDoc(id, params) {
    const c = CARDS[id];
    const sec = c.section === "sources" ? INDEX.sections.find((x) => x.id === "sources") : SECTIONS[c.section];
    document.title = `${c.title} | The Jesus Archive`;
    let d;
    try { d = await getDoc(id); } catch { view.innerHTML = `<p class="loading">This document could not be loaded.</p>`; return; }
    if (parseHash().parts.slice(1).join("/") !== id) return;
    const a = ARTS[d.plate];
    const order = ORDER[c.section] || [];
    const pos = order.indexOf(id);
    const prev = CARDS[order[pos - 1]], next = CARDS[order[pos + 1]];
    const related = (d.related || []).filter((r) => CARDS[r] && r !== id).slice(0, 4);
    const refs = (d.refs || []).filter((r) => REFS[r]);
    const isSource = c.section === "sources";
    const comps = (INDEX.comparisons || []).filter((x) => x.docs.includes(id));
    const qa = await qaBlock(id);
    if (parseHash().parts.slice(1).join("/") !== id) return;

    view.innerHTML = `
      <div class="progress"></div>
      <div class="ghost" style="--focus:${a?.focus || "50% 30%"}"><img src="art/mid/${fileOf(d.plate)}.webp" alt="" loading="lazy"></div>
      <header class="doc-head" style="${accent(c.section)}">
        ${plate(d.plate, true)}
        ${credit(d.plate)}
        <div class="doc-head-copy">
          <nav class="crumbs caps"><a href="#/">The Jesus Archive</a><i>/</i><a href="#/s/${sec.id}">${esc(sec.title)}</a>${c.group && !isSource ? `<i>/</i><span>${esc(c.group)}</span>` : ""}</nav>
          <h1>${esc(isSource ? `${c.short}` : d.title)}</h1>
          <div class="doc-byline">${d.date_label ? `<span class="chip">${esc(d.date_label)}</span>` : ""}${d.author ? `<span>${esc(d.author)}</span>` : ""}${c.words > 400 && !isSource ? `<span style="color:var(--text-3)">· ${minutes(c.words)} min read</span>` : ""}${d.updated && !isSource ? `<span style="color:var(--text-3)">· ${d.published && d.published !== d.updated ? "Revised" : "Published"} <time datetime="${d.updated}">${new Date(d.updated + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</time></span>` : ""}</div>
          ${(isSource ? d.title : d.summary) ? `<p class="doc-summary">${esc(isSource ? d.title : d.summary)}</p>` : ""}
          <div class="doc-actions">${d.passages?.length ? `<a class="btn btn-gold" href="#" data-go="passages">What it says of Christ</a>` : ""}<a class="btn btn-ghost" href="#" data-go="text">${isSource ? "Details" : "Read the text"}</a><button type="button" class="btn btn-ghost" data-cite>Cite this page</button>${comps.length ? `<a class="btn btn-ghost" href="#/compare/${comps[0].slug}">Compare accounts</a>` : ""}</div>
        </div>
      </header>
      <div class="doc-main" style="${accent(c.section)}">
        ${d.intro?.length ? `<section class="intro reveal"><span class="caps">About this ${c.kind === "artifact" ? "artifact" : c.kind === "research" ? "chapter" : c.kind === "statement" ? "statement" : "witness"}</span>${d.intro.map((p) => `<p>${p}</p>`).join("")}</section>` : ""}
        ${d.passages?.length ? `<section class="passages" id="passages">${d.passages.map((p, i) => `<figure class="passage reveal${d.literal_bold ? " literal" : ""}" style="margin:0;--d:${i * 0.1}s">
            <span class="caps passage-label">${esc(p.label || "The passage")}</span>
            <blockquote>${p.html}</blockquote>
            <figcaption class="passage-ref">${esc(p.ref || "")}</figcaption>
            ${p.anchor ? `<a class="link-gold" href="#" data-to="${esc(p.anchor)}">Find it in the text <span class="arrow">↓</span></a>` : ""}
          </figure>`).join("")}</section>` : ""}
        ${qa}
        ${comps.length ? `<section class="compare-band reveal"><span class="caps">Read side by side</span><div class="ent-chips">${comps.map((c) => `<a class="ent-chip chip-cmp" href="#/compare/${c.slug}">${esc(c.title)}</a>`).join("")}</div></section>` : ""}
        <section class="text-wrap" id="text" data-doc="${esc(id)}">
          <div class="text-head"><span class="caps">${isSource ? "The reference" : "The text"}</span>${d.body_note ? `<p>${esc(d.body_note)}</p>` : ""}</div>
          <article class="folio"><div class="prose${d.literal_bold ? " literal" : ""}" id="prose">${d.body_html}</div></article>
          <aside class="toc" id="toc"></aside>
        </section>
        <section class="after">
          <div class="provenance">
            ${d.source?.name || d.source?.url ? `<b>Source</b><span>${esc(d.source.name || "")}${d.source.url ? `, <a href="${esc(d.source.url)}" target="_blank" rel="noopener">${esc(d.source.url)}</a>` : ""}</span>` : ""}
            ${d.source?.license ? `<b>Licence</b><span>${esc(d.source.license)}</span>` : ""}
            ${refs.length ? `<b>Cited as</b><span class="ref-chips">${refs.map((r) => `<a href="#/doc/citations/${r}" data-ref="${r}">${r}</a>`).join("")}</span>` : ""}
          </div>
          ${(() => {
            const people = (IN_DOC[id] || []).filter(([e]) => ENT[e]).sort((x, y) => y[1] - x[1]).slice(0, 14);
            return people.length ? `<div class="in-text reveal"><span class="caps">People and places in this text</span><div class="ent-chips">${people.map(([e, n]) => `<a href="#/p/${e}" class="ent-chip ${ENT[e].kind}">${esc(ENT[e].name)}<i>${n}</i></a>`).join("")}</div></div>` : "";
          })()}
          ${related.length ? `<h2 class="reveal">Read alongside</h2><div class="cards">${related.map((r) => card(CARDS[r])).join("")}</div>` : ""}
          ${prev || next ? `<div class="pager">${prev ? card(prev, "← Before") : "<span></span>"}${next ? card(next, "Next →", "next") : ""}</div>` : ""}
        </section>
      </div>
      ${footer()}`;

    citeInfo = { title: isSource ? `${c.short}: ${d.title}` : d.title, path: "/" + id, source: d.source, author: d.author };
    const prose = $("#prose");
    illuminate($(".intro p"));
    // The initial stands about three lines tall, so it needs a paragraph long enough to wrap around it;
    // a short opening line (a title or heading set as a paragraph) gets none rather than an orphaned letter.
    if (c.section !== "new-testament") { const first = [...prose.children].find((el) => el.tagName === "P" && el.textContent.trim().length > 30); if (first && first.textContent.trim().length > 160) illuminate(first); }
    prose.querySelectorAll('a[href^="http"]').forEach((l) => { l.target = "_blank"; l.rel = "noopener"; });
    buildToc(prose);
    view.addEventListener("click", docClicks);
    cleanup.push(() => view.removeEventListener("click", docClicks));

    const at = params.get("at"), q = params.get("q");
    if (c.words > 1500) bookmark(id, !at && !q && !scrollMemory[routeKey()]);
    if (q) highlight(prose, q);
    else if (at) {
      const el = document.getElementById(at);
      if (el) { window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 120, behavior: "instant" }); el.classList.add("flash"); }
    }
  }

  /* 7 · Long texts remember how far you read, and offer to take you back there next time. */
  function bookmark(id, offer) {
    const key = "lux:read:" + id, folio = $(".folio");
    const store = (v) => { try { v == null ? localStorage.removeItem(key) : localStorage.setItem(key, v); } catch {} };
    let saved = null;
    try { saved = parseFloat(localStorage.getItem(key)); } catch {}
    const frac = () => { const r = folio.getBoundingClientRect(); return (innerHeight * 0.3 - r.top) / r.height; };
    let t;
    const save = () => { clearTimeout(t); t = setTimeout(() => { const f = frac(); if (f > 0.97) store(null); else if (f > 0.04) store(f.toFixed(4)); }, 400); };
    addEventListener("scroll", save, { passive: true });
    cleanup.push(() => { removeEventListener("scroll", save); clearTimeout(t); });
    if (!offer || !(saved > 0.04)) return;
    const pill = document.createElement("div");
    pill.className = "resume";
    pill.innerHTML = `<button type="button" class="resume-go"><span class="caps">Continue reading</span><b>${Math.round(saved * 100)}% through</b><span class="arrow">↓</span></button><button type="button" class="resume-x" aria-label="Dismiss">×</button>`;
    document.body.append(pill);
    const close = () => { pill.classList.add("out"); setTimeout(() => pill.remove(), 400); removeEventListener("scroll", passed); };
    const passed = () => { if (frac() >= saved - 0.01) close(); };
    pill.addEventListener("click", (e) => {
      if (e.target.closest(".resume-go")) { const r = folio.getBoundingClientRect(); window.scrollTo({ top: r.top + scrollY + saved * r.height - innerHeight * 0.3, behavior: "smooth" }); }
      close();
    });
    addEventListener("scroll", passed, { passive: true });
    cleanup.push(() => { pill.remove(); removeEventListener("scroll", passed); });
  }

  function card(c, label, cls = "") {
    const s = SECTIONS[c.section];
    return `<a class="card ${cls}" href="#/doc/${c.id}" style="${accent(c.section)}">${plate(c.plate, false, "(max-width: 640px) 62vw, 320px")}<small class="caps">${esc(label || s?.title || "")}</small><b>${esc(c.title)}</b><span>${esc([c.date, c.author].filter(Boolean).join(" · "))}</span></a>`;
  }

  function scrollToEl(el, offset = 110) {
    window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - offset, behavior: "smooth" });
    el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
  }
  function docClicks(e) {
    const go = e.target.closest("[data-go]");
    if (go) { e.preventDefault(); const el = document.getElementById(go.dataset.go); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 70, behavior: "smooth" }); return; }
    const to = e.target.closest("[data-to]");
    if (to) { e.preventDefault(); const el = document.getElementById(to.dataset.to); if (el) scrollToEl(el, innerHeight / 3); return; }
    const a = e.target.closest('.prose a[href^="#"]');
    if (a && !a.getAttribute("href").startsWith("#/")) {
      const el = document.getElementById(a.getAttribute("href").slice(1));
      if (el) { e.preventDefault(); scrollToEl(el); }
    }
  }

  function buildToc(prose) {
    const toc = $("#toc");
    const heads = $$("h2[id], h3[id]", prose).filter((h) => h.textContent.trim().length < 140);
    if (heads.length < 3) { $(".text-wrap").classList.add("no-toc"); toc.remove(); return; }
    const chapters = heads.filter((h) => /^chapter-\d+$/.test(h.id));
    if (chapters.length > 3) {
      toc.innerHTML = `<details open><summary><h4>Chapters</h4></summary><div class="chap-grid">${chapters.map((h) => `<a href="#" data-to="${h.id}">${h.id.split("-")[1]}</a>`).join("")}</div></details>`;
    } else {
      const list = heads.length > 60 ? heads.filter((h) => h.tagName === "H2") : heads;
      toc.innerHTML = `<details open><summary><h4>Contents</h4></summary><ol>${list.slice(0, 90).map((h) => {
        let t = h.textContent.trim();
        if (t.length > 64) t = t.slice(0, 62) + "…";
        return `<li class="${h.tagName === "H3" ? "lvl3" : ""}"><a href="#" data-to="${h.id}">${esc(t)}</a></li>`;
      }).join("")}</ol></details>`;
    }
    if (innerWidth <= 1000) $("details", toc).open = false;
    $$("[data-to]", toc).forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); const el = document.getElementById(a.dataset.to); window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 96, behavior: "smooth" }); }));
    const links = Object.fromEntries($$("[data-to]", toc).map((a) => [a.dataset.to, a]));
    const spy = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!vis || !links[vis.target.id]) return;
      Object.values(links).forEach((l) => l.classList.remove("on"));
      links[vis.target.id].classList.add("on");
    }, { rootMargin: "-90px 0px -70% 0px" });
    heads.forEach((h) => spy.observe(h));
    cleanup.push(() => spy.disconnect());
    phoneNav(toc, prose);
  }

  // On phones the contents box sits at the top of a long text; once you've scrolled past it, a small
  // floating button brings it back as a sheet, with a way back to the top.
  function phoneNav(toc, prose) {
    if (prose.offsetHeight < innerHeight * 4) return;
    const fab = document.createElement("div");
    fab.className = "toc-fab";
    fab.innerHTML = `<div class="toc-sheet" hidden><div class="toc-sheet-in">${$("details", toc).innerHTML.replace(/<\/?summary>/g, "")}</div></div>
      <div class="toc-fab-btns"><button type="button" data-fab="toc">${$("h4", toc).textContent}</button><button type="button" data-fab="top" aria-label="Back to top">↑</button></div>`;
    view.appendChild(fab);
    const sheet = $(".toc-sheet", fab);
    const close = () => { sheet.hidden = true; fab.classList.remove("open"); };
    fab.addEventListener("click", (e) => {
      const to = e.target.closest("[data-to]"), b = e.target.closest("[data-fab]");
      if (to) { e.preventDefault(); const el = document.getElementById(to.dataset.to); close(); window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 80, behavior: "smooth" }); }
      else if (b?.dataset.fab === "top") { close(); window.scrollTo({ top: 0, behavior: "smooth" }); }
      else if (b) { sheet.hidden = !sheet.hidden; fab.classList.toggle("open", !sheet.hidden); }
    });
    const onScroll = () => { const past = toc.getBoundingClientRect().bottom < 0 && prose.getBoundingClientRect().bottom > innerHeight * 0.6; fab.classList.toggle("on", past); if (!past) close(); };
    addEventListener("scroll", onScroll, { passive: true });
    cleanup.push(() => { removeEventListener("scroll", onScroll); fab.remove(); });
  }

  // Mark every match in the text, go to the best one (the whole phrase if it occurs), and offer next/previous.
  function highlight(root, q) {
    const { terms, whole } = parseQuery(q.toLowerCase());
    const list = terms.filter((t) => t.length > 1);
    if (!list.length) return;
    const pats = whole.includes(" ") ? [whole, ...list] : list;
    const re = new RegExp("(" + [...new Set(pats)].sort((a, b) => b.length - a.length).map(reEsc).join("|") + ")", "gi");
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode() && nodes.length < 600) { re.lastIndex = 0; if (re.test(walker.currentNode.nodeValue)) nodes.push(walker.currentNode); }
    nodes.forEach((n) => { const s = document.createElement("span"); s.innerHTML = esc(n.nodeValue).replace(re, '<mark class="hit">$1</mark>'); n.replaceWith(s); });
    const hits = $$("mark.hit", root);
    if (!hits.length) return;
    const best = hits.find((m) => m.textContent.toLowerCase() === whole) || hits[0];
    let i = hits.indexOf(best);
    const nav = document.createElement("div");
    nav.className = "hitnav";
    nav.innerHTML = `<span class="caps">“${esc(q.replace(/"/g, ""))}”</span><b></b><button type="button" data-d="-1" aria-label="Previous match">↑</button><button type="button" data-d="1" aria-label="Next match">↓</button><button type="button" data-d="0" aria-label="Clear">×</button>`;
    document.body.appendChild(nav);
    const go = (k, smooth = true) => {
      hits[i]?.classList.remove("cur");
      i = (k + hits.length) % hits.length;
      hits[i].classList.add("cur");
      $("b", nav).textContent = `${i + 1} of ${hits.length}`;
      window.scrollTo({ top: hits[i].getBoundingClientRect().top + scrollY - innerHeight / 3, behavior: smooth ? "smooth" : "instant" });
    };
    nav.addEventListener("click", (e) => {
      const d = e.target.closest("[data-d]")?.dataset.d;
      if (d === "0") { hits.forEach((m) => m.replaceWith(document.createTextNode(m.textContent))); nav.remove(); }
      else if (d) go(i + +d);
    });
    cleanup.push(() => nav.remove());
    requestAnimationFrame(() => go(i, false));
  }

  /* ═════════════ GUIDED PATH ═════════════ */
  async function renderPath(n) {
    const P = window.PATH;
    const stops = P.stops.filter((s) => CARDS[s.doc]);
    if (!n) {
      document.title = `${P.title} | The Jesus Archive`;
      view.innerHTML = `
        ${banner({ slug: "emmaus", crumbs: "", kicker: "", title: esc(P.title), lede: esc(P.lede),
          extra: `<div class="doc-actions"><a class="btn btn-gold" href="#/path/1">Begin the path</a></div>` })}
        <ol class="road">${stops.map((s, i) => {
          const c = CARDS[s.doc];
          return `<li class="reveal" style="${accent(c.section)}"><a class="glow" href="#/path/${i + 1}">
            <span class="road-num">${roman(i + 1)}</span>
            <span class="road-body"><span class="caps">${esc(s.date || c.date || "")}</span><b>${esc(s.title)}</b><small>${esc(c.title)}</small></span>
            <span class="road-art">${plate(s.plate || c.plate, false, "220px")}</span></a></li>`;
        }).join("")}</ol>
        ${footer()}`;
      return;
    }
    const i = Math.min(stops.length, Math.max(1, +n || 1)) - 1;
    const s = stops[i], c = CARDS[s.doc];
    const d = await getDoc(s.doc).catch(() => null);
    if (parseHash().parts[1] !== n) return;
    const p = s.p === -1 ? null : d?.passages?.[s.p] || d?.passages?.[0];
    const next = stops[i + 1], prev = stops[i - 1];
    document.title = `${s.title} | ${P.title}`;
    view.innerHTML = `
      <section class="stop" style="${accent(c.section)}">
        <div class="stop-art">${plate(s.plate || c.plate, true)}${credit(s.plate || c.plate)}</div>
        <div class="stop-body">
          <nav class="crumbs caps"><a href="#/path">Stop ${roman(i + 1)} of ${roman(stops.length)}</a>${s.date ? `<span class="stop-when"><i class="stop-dot" aria-hidden="true"></i><span class="stop-date">${esc(s.date)}</span></span>` : ""}</nav>
          <h1>${esc(s.title)}</h1>
          <button type="button" class="listen" data-listen><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path class="wave" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><span>Listen</span></button>
          <p class="stop-bridge">${s.bridge}</p>
          ${s.finale ? `<p class="stop-finale"><span class="gilt">${esc(s.finale)}</span><cite class="caps">${esc(s.finaleRef || "")}</cite></p>` : ""}
          ${p ? `<figure class="passage stop-passage${d.literal_bold ? " literal" : ""}"><span class="caps passage-label">${esc(p.label || "")}</span><blockquote>${p.html}</blockquote><figcaption class="passage-ref">${esc(p.ref || "")} · ${esc(c.title)}</figcaption></figure>` : ""}
          <div class="doc-actions">
            ${next ? `<a class="btn btn-gold" href="#/path/${i + 2}">Next: ${esc(next.title)} <span class="arrow">→</span></a>` : `<a class="btn btn-gold" href="#" data-go="coda">Continue <span class="arrow">↓</span></a>`}
            <a class="btn btn-ghost" href="${docHref(s.doc, p?.anchor)}">Read the full text</a>
          </div>
          ${prev ? `<a class="stop-prev link-gold" href="#/path/${i}">← ${esc(prev.title)}</a>` : ""}
        </div>
        <nav class="stop-dots" aria-label="Stops">${stops.map((t, k) => `<a href="#/path/${k + 1}" class="${k === i ? "on" : k < i ? "done" : ""}" title="${esc(t.title)}"><span class="sr">${esc(t.title)}</span></a>`).join("")}</nav>
      </section>
      ${next ? "" : `<section class="coda" id="coda">
        ${plate("salvator-mundi", false, "100vw")}
        <div class="coda-copy">
          <p class="coda-line">The witnesses have spoken.</p>
          <p class="coda-sub">Every testimony in this archive is open to you, in their own words.</p>
          <div class="coda-links"><a class="btn btn-gold" href="#/" data-scroll="testimony">Enter the seven halls</a><a class="btn btn-ghost" href="#/timeline">Walk the timeline</a></div>
        </div>
      </section>`}`;
    if (!next) {
      const coda = $(".coda");
      const io = new IntersectionObserver(([en]) => { $(".stop-dots")?.classList.toggle("away", en.isIntersecting); if (en.isIntersecting) coda.classList.add("in"); }, { threshold: 0.35 });
      io.observe(coda);
      cleanup.push(() => io.disconnect());
      $(".stop").addEventListener("click", (e) => { if (e.target.closest('[data-go="coda"]')) { e.preventDefault(); window.scrollTo({ top: coda.getBoundingClientRect().top + scrollY, behavior: "smooth" }); } });
    }
    setupNarration(s, p, c, i + 1);
    // 7 · On a phone the way on stays in reach once the main buttons scroll away.
    const dock = document.createElement("nav");
    dock.className = "path-dock";
    dock.setAttribute("aria-label", "Guided path");
    dock.innerHTML = `${prev ? `<a href="/path/${i}" aria-label="Previous stop: ${esc(prev.title)}">←</a>` : "<span></span>"}<span class="caps">${roman(i + 1)} of ${roman(stops.length)}</span>${next ? `<a class="dock-next" href="/path/${i + 2}"><span>${esc(next.title)}</span> →</a>` : `<a class="dock-next" href="#coda">The close ↓</a>`}`;
    document.body.append(dock);
    // Shown while you read; it steps aside whenever the stop's own buttons are on screen.
    const acts = $(".stop .doc-actions");
    const dockFit = () => { const r = acts.getBoundingClientRect(); dock.classList.toggle("on", scrollY > 160 && (r.top > innerHeight - 40 || r.bottom < 60)); };
    addEventListener("scroll", dockFit, { passive: true });
    cleanup.push(() => { removeEventListener("scroll", dockFit); dock.remove(); });
    const keys = (e) => {
      if (/INPUT|TEXTAREA/.test(document.activeElement?.tagName) || !sBox.hidden) return;
      if (e.key === "ArrowRight" && next) go(`/path/${i + 2}`);
      if (e.key === "ArrowLeft" && prev) go(`/path/${i}`);
    };
    addEventListener("keydown", keys);
    cleanup.push(() => removeEventListener("keydown", keys));
  }

  /* Narration: each stop is read by a recorded narrator (audio/path/<n>.mp3, Kokoro's George voice).
     If the recording can't play, the device's deepest male voice reads it instead. */
  const VOICE_PREFS = [/daniel.*(enhanced|premium)/i, /arthur/i, /daniel/i, /microsoft (george|ryan|guy|davis|david|mark)/i, /google uk english male/i, /reed/i, /oliver/i, /aaron/i, /alex/i, /\bmale\b/i];
  function pickVoice() {
    const voices = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang)).sort((a, b) => b.localService - a.localService);
    for (const re of VOICE_PREFS) { const v = voices.find((x) => re.test(x.name)); if (v) return v; }
    return voices.find((v) => /GB/i.test(v.lang)) || voices[0] || null;
  }
  function setupNarration(s, p, c, n) {
    const btn = $("[data-listen]");
    if (!btn) return;
    const label = $("span", btn);
    const plain = (h) => { const d = document.createElement("div"); d.innerHTML = h; return d.textContent.replace(/\s+/g, " ").trim(); };
    const parts = [s.title + ".", plain(s.bridge)];
    if (s.finale) parts.push(plain(s.finale));
    if (p) parts.push(`From ${(p.ref || c.title).replace(/–/g, " to ")}.`, plain(p.html));
    const pieces = parts.flatMap((t) => t.match(/[^.!?;:]+[.!?;:]+["”’)]*|[^.!?;:]+$/g) || [t]).map((t) => t.trim()).filter(Boolean);
    let audio = null;
    const done = () => { btn.classList.remove("on"); label.textContent = "Listen"; };
    const stop = () => { if (audio) { audio.pause(); audio.currentTime = 0; } if ("speechSynthesis" in window) speechSynthesis.cancel(); done(); };
    const speak = () => {
      if (!("speechSynthesis" in window)) return done();
      speechSynthesis.cancel();
      const voice = pickVoice();
      pieces.forEach((t, k) => {
        const u = new SpeechSynthesisUtterance(t);
        if (voice) u.voice = voice;
        u.rate = 0.95; u.pitch = 0.78; u.volume = 1;
        if (k === pieces.length - 1) u.onend = done;
        speechSynthesis.speak(u);
      });
    };
    btn.addEventListener("click", () => {
      if (btn.classList.contains("on")) return stop();
      btn.classList.add("on"); label.textContent = "Stop";
      if (!audio) {
        audio = new Audio(`audio/path/${n}.mp3?v=1794472824`);
        audio.defaultPlaybackRate = 1.1; audio.playbackRate = 1.1; audio.preservesPitch = true;
        audio.onended = done;
        audio.onerror = () => { audio = null; if (btn.classList.contains("on")) speak(); };
      }
      audio?.play().catch((e) => { if (e.name !== "AbortError" && e.name !== "NotAllowedError") { audio = null; speak(); } else if (e.name === "NotAllowedError") done(); });
    });
    cleanup.push(stop);
  }
  if ("speechSynthesis" in window) speechSynthesis.getVoices();

  /* ═════════════ SIDE BY SIDE ═════════════ */
  const STOP = new Set("the and of to a in that he his him they them their it is was for with as be on not but at by this which have from or had all were said who will you your are when there into one so i we my me what out up then also an no if these those shall has did do".split(" "));
  async function renderCompare(slug) {
    if (!COMPARE) await loadScript("data-js/compare.js?v=1794472824");
    const list = COMPARE || [];
    if (!slug) {
      document.title = "Compare the Accounts | The Jesus Archive";
      view.innerHTML = `
        ${banner({ slug: "disputation", crumbs: `<a href="#/">The Jesus Archive</a>`, kicker: "Read side by side", title: "Compare the Accounts", lede: "The same events told by different witnesses, set in parallel columns so you can see where they agree, where they differ, and what each adds." })}
        <div class="sec-body"><ol class="entries">${list.map((c) => `<li class="entry"><a class="glow" href="#/compare/${c.slug}">
          <span class="entry-year">${c.columns.length}<small>accounts</small></span>
          <span><h3>${esc(c.title)}</h3><p class="sum">${esc(c.columns.map((x) => x.ref).join(" · "))}</p></span><span class="arrow">→</span></a></li>`).join("")}</ol></div>
        ${footer()}`;
      return;
    }
    const c = list.find((x) => x.slug === slug);
    if (!c) return renderLost();
    document.title = `${c.title} | The Jesus Archive`;
    const lead = CARDS[c.columns[0].doc];
    view.innerHTML = `
      ${banner({ slug: lead?.plate || "disputation", crumbs: `<a href="#/">The Jesus Archive</a><i>/</i><a href="#/compare">Side by side</a>`, kicker: `${c.columns.length} accounts`, title: esc(c.title), lede: "" })}
      <section class="cmp-intro">${(c.intro || []).map((p) => `<p>${p}</p>`).join("")}
        ${c.notes?.length ? `<ul class="cmp-notes">${c.notes.map((n) => `<li>${n}</li>`).join("")}</ul>` : ""}
        <p class="cmp-hint caps">Hover a word to find it in every account</p>
      </section>
      <div class="cmp-tabs" role="tablist">${c.columns.map((col, i) => `<button type="button" role="tab" data-col="${i}" class="${i ? "" : "on"}">${esc(col.label)}</button>`).join("")}</div>
      <section class="cmp" style="--cols:${c.columns.length}">${c.columns.map((col, i) => {
        const card = CARDS[col.doc];
        return `<article class="cmp-col ${i ? "" : "on"}" data-col="${i}" style="${accent(card?.section || "new-testament")}">
          <header><span class="caps">${esc(col.label)}</span><b>${esc(col.ref)}</b>${card ? `<a class="link-gold" href="${docHref(col.doc, col.anchor)}">In context <span class="arrow">→</span></a>` : ""}</header>
          <div class="prose cmp-text">${col.html}</div></article>`;
      }).join("")}</section>
      ${footer()}`;
    // Every word becomes findable across the columns.
    $$(".cmp-text").forEach((el) => {
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [];
      while (w.nextNode()) if (!w.currentNode.parentElement.closest("sup")) nodes.push(w.currentNode);
      nodes.forEach((n) => {
        const span = document.createElement("span");
        span.innerHTML = esc(n.nodeValue).replace(/[A-Za-z’']{3,}/g, (m) => { const k = m.toLowerCase().replace(/[’']s$/, ""); return STOP.has(k) ? m : `<span class="w" data-w="${k}">${m}</span>`; });
        n.replaceWith(span);
      });
    });
    const cmp = $(".cmp");
    let lit = [];
    cmp.addEventListener("mouseover", (e) => {
      const t = e.target.closest(".w");
      lit.forEach((x) => x.classList.remove("lit")); lit = [];
      if (!t) return;
      lit = $$(`.w[data-w="${CSS.escape(t.dataset.w)}"]`, cmp);
      lit.forEach((x) => x.classList.add("lit"));
    });
    $(".cmp-tabs").addEventListener("click", (e) => {
      const b = e.target.closest("[data-col]");
      if (!b) return;
      $$(".cmp-tabs button, .cmp-col").forEach((x) => x.classList.toggle("on", x.dataset.col === b.dataset.col));
    });
  }

  /* ═════════════ STUDIES ═════════════ */
  // Four threads drawn through the whole archive. Their text lives in data-js/studies.js (from tools/studies/).
  const STUDY = {
    life: { title: "The Life of Christ", kicker: "The story", banner: "baptism", card: "nativity-botticelli", blurb: "From Bethlehem to the empty tomb, each event with its Gospel passages and every other witness to it." },
    prophecies: { title: "Prophecy and Fulfilment", kicker: "The promise", banner: "isaiah-prophet", card: "isaiah", blurb: "What Israel’s prophets wrote, set beside what the Gospels record." },
    resurrection: { title: "The Resurrection", kicker: "The evidence", banner: "empty-tomb", card: "resurrection-raphael", blurb: "The death, the empty tomb, the witnesses and the first proclamation, gathered in one place." },
    manuscripts: { title: "How the Text Survived", kicker: "The manuscripts", banner: "st-jerome", card: "p46-1cor", blurb: "The papyri and great codices that carry the New Testament, beside the copies of other ancient books." },
  };
  const KINDS = { explicit: "Cited as fulfilled", allusion: "Echoed", typology: "Foreshadowed" };
  const paras = (ps, cls = "") => (ps || []).map((p) => `<p${cls ? ` class="${cls}"` : ""}>${esc(p)}</p>`).join("");
  const docLink = (d, label, at) => CARDS[d] ? `<a class="xref" href="${docHref(d, at)}">${esc(label || CARDS[d].short || CARDS[d].title)}</a>` : "";
  const quote = (t, label) => t ? `<figure class="sq">${label ? `<span class="caps">${esc(label)}</span>` : ""}<blockquote>${esc(t.text)}</blockquote>
      <figcaption>${esc(t.ref)}${t.doc && CARDS[t.doc] ? ` <a class="link-gold" href="${docHref(t.doc, t.at)}">In context <span class="arrow">→</span></a>` : ""}</figcaption></figure>` : "";
  const studyIntro = (S) => `<section class="intro reveal"><span class="caps">About this study</span>${paras(S.intro)}</section>`;
  const studyNext = (k) => { const others = Object.entries(STUDY).filter(([x]) => x !== k);
    return `<section class="study-next"><div class="ornament">${CROSS}</div><span class="caps">The other studies</span><div class="studies">${others.map(([x, t]) => `<a class="study glow" href="#/${x}">${plate(t.card, false, "(max-width: 640px) 90vw, 360px")}<span class="caps">${esc(t.kicker)}</span><b>${esc(t.title)}</b><span>${esc(t.blurb)}</span></a>`).join("")}</div></section>`; };

  async function renderStudy(k) {
    const T = STUDY[k];
    document.title = `${T.title} | The Jesus Archive`;
    try { await getStudies(); } catch { return renderLost(); }
    if (parseHash().parts[0] !== k) return;
    const S = STUDIES[k];
    if (!S) return renderLost();
    const top = banner({ slug: T.banner, detail: true, title: esc(T.title), lede: esc(S.lede) });
    const body = { life: lifeBody, prophecies: prophecyBody, resurrection: resurrectionBody, manuscripts: manuscriptBody }[k](S);
    const qa = await qaBlock("study:" + k);
    if (parseHash().parts[0] !== k) return;
    view.innerHTML = `${top}${studyIntro(S)}${body}${qa ? `<div class="qa-study">${qa}</div>` : ""}${studyNext(k)}${footer()}`;
    illuminate($(".intro p"));
    if (k === "prophecies") setupKinds();
    if (k === "life") setupActs();
  }

  function prophecyBody(S) {
    let n = 0;
    const all = S.groups.flatMap((g) => g.items);
    const count = (kd) => all.filter((it) => kd === "all" || it.kind === kd).length;
    return `<div class="kind-filter reveal" role="group" aria-label="Show">${["all", ...Object.keys(KINDS)].map((kd) => `<button type="button" data-kind="${kd}" class="${kd === "all" ? "on" : ""}" aria-pressed="${kd === "all"}">${kd === "all" ? "All" : KINDS[kd]}<i>${count(kd)}</i></button>`).join("")}</div>
      <div class="sec-body pairs">${S.groups.map((g) => `<div class="group pgroup"><div class="group-head"><h2>${esc(g.title)}</h2><span>${g.items.length}</span></div>
        ${g.items.map((it) => `<article class="pair reveal" data-kind="${esc(it.kind)}" id="${esc(it.id)}">
          <header class="pair-head"><span class="pair-num">${roman(++n)}</span><h3>${esc(it.title)}</h3><span class="chip kind">${esc(KINDS[it.kind] || it.kind)}</span></header>
          <div class="pair-cols">${quote(it.ot, "The prophecy")}<span class="pair-join" aria-hidden="true"></span>${quote(it.nt, "The fulfilment")}</div>
          ${it.note ? `<p class="pair-note">${esc(it.note)}</p>` : ""}
          ${(it.cite || []).filter((r) => REFS[r]).length ? `<p class="ref-chips">${it.cite.filter((r) => REFS[r]).map((r) => `<a href="#/doc/citations/${r}" data-ref="${r}">${r}</a>`).join("")}</p>` : ""}
        </article>`).join("")}</div>`).join("")}</div>`;
  }
  function setupKinds() {
    const bar = $(".kind-filter");
    bar.addEventListener("click", (e) => {
      const b = e.target.closest("[data-kind]");
      if (!b) return;
      const kd = b.dataset.kind;
      $$("button", bar).forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); });
      $$(".pair").forEach((p) => { p.hidden = kd !== "all" && p.dataset.kind !== kd; if (!p.hidden) p.classList.add("in"); });
      $$(".pgroup").forEach((g) => (g.hidden = !$$(".pair", g).some((p) => !p.hidden)));
    });
  }

  function lifeBody(S) {
    return `<nav class="acts-nav" aria-label="Acts">${S.acts.map((a, i) => `<a href="#act-${esc(a.id)}"><i>${roman(i + 1)}</i>${esc(a.title)}</a>`).join("")}</nav>
      <div class="acts">${S.acts.map((a, i) => `<section class="act" id="act-${esc(a.id)}">
        <header class="act-head reveal">${plate(a.art, false, "(max-width: 860px) 100vw, 1280px")}<div class="act-copy"><span class="caps">Act ${roman(i + 1)} · ${esc(a.span || "")}</span><h2>${esc(a.title)}</h2>${a.lede ? `<p class="study-text">${esc(a.lede)}</p>` : ""}</div></header>
        <ol class="story">${a.events.map((ev) => `<li class="ev reveal" id="${esc(ev.id)}">
          <span class="ev-when">${esc(ev.when || "")}</span>
          <div class="ev-body"><h3>${esc(ev.title)}</h3>
            ${ev.place && ENT[ev.place] ? `<a class="ent-chip place" href="#/p/${ev.place}">${esc(ENT[ev.place].name)}</a>` : ""}
            <p>${esc(ev.summary)}</p>
            ${ev.quote ? `<blockquote class="ev-q">${esc(ev.quote.text)}<cite>${esc(ev.quote.ref)}</cite></blockquote>` : ""}
            ${ev.refs?.length ? `<div class="ev-links"><span class="caps">Read it</span>${ev.refs.map((r) => CARDS[r.doc] ? `<a class="xref" href="${docHref(r.doc, r.at)}">${esc(r.label)}</a>` : "").join("")}</div>` : ""}
            ${ev.witness?.filter((d) => CARDS[d]).length ? `<div class="ev-links wit"><span class="caps">Other witnesses</span>${ev.witness.map((d) => docLink(d)).join("")}</div>` : ""}
          </div></li>`).join("")}</ol></section>`).join("")}</div>`;
  }
  function setupActs() {
    const nav = $(".acts-nav"), links = Object.fromEntries($$("a", nav).map((a) => [a.getAttribute("href").slice(1), a]));
    const spy = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { Object.values(links).forEach((l) => l.classList.remove("on")); links[e.target.id]?.classList.add("on"); links[e.target.id]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" }); } }), { rootMargin: "-40% 0px -55% 0px" });
    $$(".act").forEach((a) => spy.observe(a));
    cleanup.push(() => spy.disconnect());
  }

  function resurrectionBody(S) {
    return `<div class="lines">${S.lines.map((l, i) => `<section class="line" id="${esc(l.id)}">
        <div class="line-art reveal">${plate(l.art, false, "(max-width: 860px) 100vw, 40vw")}${credit(l.art)}</div>
        <div class="line-body reveal"><span class="caps">${roman(i + 1)}</span><h2>${esc(l.title)}</h2>
          <p class="line-claim">${esc(l.claim)}</p>
          ${paras(l.body)}
          ${(l.texts || []).map((t) => quote(t)).join("")}
          ${l.links?.filter((d) => CARDS[d]).length ? `<div class="ev-links"><span class="caps">Read further</span>${l.links.map((d) => docLink(d, CARDS[d]?.title)).join("")}</div>` : ""}
        </div></section>`).join("")}</div>
      ${S.close?.length ? `<section class="study-close reveal"><div class="ornament">${CROSS}</div>${paras(S.close, "study-text")}
        <div class="coda-links"><a class="btn btn-gold" href="#/compare/empty-tomb">The empty tomb, side by side</a><a class="btn btn-ghost" href="#/compare/resurrection-witnesses">The witnesses, side by side</a></div></section>` : ""}`;
  }

  function manuscriptBody(S) {
    return `${S.stats?.length ? `<div class="stats reveal">${S.stats.map((x) => `<div><b>${esc(x.value)}</b><span>${esc(x.label)}</span></div>`).join("")}</div>` : ""}
      <div class="sec-body">
        <div class="group"><div class="group-head"><h2>The great witnesses</h2><span>${S.witnesses.length} manuscripts</span></div>
          <div class="mss">${S.witnesses.map((w) => `<article class="ms reveal" id="${esc(w.id)}">
            ${w.art && ARTS[w.art] ? `<div class="ms-art">${plate(w.art, false, "(max-width: 640px) 90vw, 380px")}</div>` : `<div class="ms-art ms-blank" aria-hidden="true">${CROSS}</div>`}
            <div class="ms-copy"><span class="caps">${esc(w.date)}</span><h3>${esc(w.name)}</h3>
              <dl><dt>Contains</dt><dd>${esc(w.contents)}</dd><dt>Kept</dt><dd>${esc(w.held)}</dd>${w.art && ARTS[w.art]?.source ? `<dt>Image</dt><dd><a class="ms-credit" href="${esc(ARTS[w.art].source)}" target="_blank" rel="noopener">${esc(ARTS[w.art].artist)}${/wikimedia/.test(ARTS[w.art].source) ? ", via Wikimedia Commons" : ""}</a></dd>` : ""}</dl>
              <p>${esc(w.note)}</p>${w.doc && CARDS[w.doc] ? docLink(w.doc, "See it in the archive →") : ""}</div></article>`).join("")}</div></div>
        ${S.compare?.length ? `<div class="group reveal"><div class="group-head"><h2>Beside other ancient books</h2></div>
          <div class="table-wrap"><table class="ms-table"><thead><tr><th>Work</th><th>Written</th><th>Earliest copy</th><th>Gap</th><th>Copies</th></tr></thead>
          <tbody>${S.compare.map((r) => `<tr class="${/new testament/i.test(r.work) ? "nt" : ""}"><th scope="row">${esc(r.work)}<small>${esc(r.author || "")}</small></th><td>${esc(r.written)}</td><td>${esc(r.earliest)}</td><td>${esc(r.gap)}</td><td>${esc(r.copies)}</td></tr>`).join("")}</tbody></table></div></div>` : ""}
        ${S.points?.length ? `<div class="points">${S.points.map((x) => `<div class="point reveal"><h3>${esc(x.title)}</h3><p>${esc(x.body).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</p></div>`).join("")}</div>` : ""}
      </div>`;
  }

  /* ═════════════ PEOPLE AND PLACES ═════════════ */
  function renderPeople() {
    document.title = "People and Places | The Jesus Archive";
    const tile = (e) => `<a class="ent-tile glow reveal" href="#/p/${e.slug}">${plate(e.plate, false, "(max-width: 640px) 50vw, 240px")}<b>${esc(e.name)}</b><span>${esc(e.role || e.region || "")}</span><i>${e.mentions?.length || 0} writings</i></a>`;
    view.innerHTML = `
      ${banner({ slug: "school-athens", crumbs: `<a href="#/">The Jesus Archive</a>`, kicker: "Who and where", title: "People and Places", lede: "The men and women, rulers and witnesses, towns and cities of the story. Choose any one to see every writing in the archive that mentions them." })}
      <div class="sec-body">
        <div class="group"><div class="group-head"><h2>People</h2><span>${INDEX.people.length}</span></div><div class="ent-grid">${INDEX.people.map(tile).join("")}</div></div>
        <div class="group"><div class="group-head"><h2>Places</h2><span>${INDEX.places.length} · <a class="link-gold" href="#/map">See them on the map</a></span></div><div class="ent-grid">${INDEX.places.map(tile).join("")}</div></div>
        ${(() => { const cc = (INDEX.extraArt || []).filter((a) => /CC BY/.test(a.artist || "")); return cc.length ? `<details class="credits"><summary class="caps">Image credits</summary><ul>${cc.map((a) => `<li><a href="${esc(a.source)}" target="_blank" rel="noopener">${esc(a.title)}</a> · ${esc(a.artist)}</li>`).join("")}</ul></details>` : ""; })()}
      </div>
      ${footer()}`;
  }

  const CHAIN_PEOPLE = new Set(["jesus", "peter", "john-son-of-zebedee", "paul", "clement-of-rome", "ignatius-of-antioch", "papias", "polycarp", "justin-martyr", "tatian", "irenaeus", "origen"]);
  let chainReady = null;
  async function renderChain(params) {
    document.title = "The Chain of Witnesses | The Jesus Archive";
    chainReady ||= loadScript("assets/chain.js?v=1794472824");
    try { await chainReady; } catch { view.innerHTML = `<p class="loading">The chart could not be loaded.</p>`; return; }
    LUX.chain.render(view, params, (f) => cleanup.push(f));
  }

  function renderEntity(slug) {
    const e = ENT[slug];
    document.title = `${e.name} | The Jesus Archive`;
    const written = e.kind === "place" ? Object.entries(INDEX.origins || {}).filter(([, o]) => o.place === slug).map(([d, o]) => [d, o.how]) : [];
    const ment = (e.mentions || []).filter(([d]) => CARDS[d]);
    const max = Math.max(1, ...ment.map(([, n]) => n));
    view.innerHTML = `
      ${banner({ slug: e.plate, crumbs: `<a href="#/">The Jesus Archive</a><i>/</i><a href="#/people">People and places</a>`, kicker: e.role || e.region || "", title: esc(e.name),
        extra: e.kind === "place" ? `<div class="doc-actions"><a class="btn btn-ghost" href="#/map?place=${slug}">Show on the map</a></div>`
          : CHAIN_PEOPLE.has(slug) ? `<div class="doc-actions"><a class="btn btn-ghost chain-link" href="/chain?focus=${slug}">See them in the chain of witnesses</a></div>` : "" })}
      <section class="intro reveal"><span class="caps">${e.kind === "place" ? "About this place" : "Who they were"}</span>${(e.bio || []).map((p) => `<p>${p}</p>`).join("")}</section>
      <div class="sec-body">
        ${e.key_docs?.length ? `<div class="group reveal"><div class="group-head"><h2>Where to start</h2></div><div class="cards">${e.key_docs.map((d) => card(CARDS[d])).join("")}</div></div>` : ""}
        ${written.length ? `<div class="group reveal"><div class="group-head"><h2>Written or found here</h2><span>${written.length}</span></div><ol class="entries">${written.map(([d]) => entry(CARDS[d])).join("")}</ol></div>` : ""}
        ${ment.length ? `<div class="group reveal"><div class="group-head"><h2>Every mention</h2><span>${ment.length} writings</span></div>
          <ol class="mentions">${ment.map(([d, n]) => { const c = CARDS[d]; return `<li style="${accent(c.section)}"><a href="${docHref(d, null, e.q)}"><span class="m-year">${esc(yearText(c.year) || "")}</span><span class="m-title">${esc(c.title)}<small>${esc(SECTIONS[c.section]?.title || "")}</small></span><span class="m-bar"><i style="width:${Math.max(6, (n / max) * 100)}%"></i></span><span class="m-n">${n}×</span></a></li>`; }).join("")}</ol></div>` : ""}
      </div>
      ${footer()}`;
  }

  /* ═════════════ MAP ═════════════ */
  async function renderMap(focus) {
    document.title = "The Map | The Jesus Archive";
    view.innerHTML = `<section class="map-page"><div class="map-wrap" id="mapWrap"><p class="loading">Drawing the map…</p></div>
      <aside class="map-panel" id="mapPanel"></aside>
      <div class="map-legend"><h1 class="caps">The Map</h1><p>Where each witness was written, found or kept. Drag to move; scroll or pinch to zoom.</p>
        <div class="map-toggle" role="tablist"><button type="button" data-layer="origins" class="on">Where written</button><button type="button" data-layer="story">Places in the story</button></div></div></section>`;
    if (!window.d3) await loadScript("assets/vendor/d3.min.js");
    if (!GEO) await loadScript("data-js/geo.js?v=1794472824");
    if (parseHash().parts[0] !== "map") return;
    const wrap = $("#mapWrap"), panel = $("#mapPanel");
    const W = 1600, H = 1000;
    const [w0, s0, e0, n0] = GEO.bbox;
    const proj = d3.geoMercator().fitExtent([[0, 0], [W, H]], { type: "MultiPoint", coordinates: [[w0, s0], [e0, n0]] });
    const P = (c) => proj(c);
    const ringPath = (r) => "M" + r.map((c) => P(c).map((v) => v.toFixed(1)).join(",")).join("L") + "Z";
    const linePath = (r) => "M" + r.map((c) => P(c).map((v) => v.toFixed(1)).join(",")).join("L");
    const counts = {};
    Object.entries(INDEX.origins || {}).forEach(([d, o]) => (counts[o.place] ||= []).push(d));
    const places = INDEX.places.filter((p) => p.lat != null);
    // The coastline is drawn once and only moved by the zoom. Pins and labels live in an HTML layer
    // above it, repositioned each frame, so nothing in the SVG repaints while you pan or pinch.
    const landD = GEO.land.map(ringPath).join("");
    wrap.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="map" preserveAspectRatio="xMidYMid slice">
      <rect width="${W}" height="${H}" class="sea"/>
      <g id="zoomer">
        <g class="graticule">${d3.range(-10, 51, 5).map((x) => `<path d="${linePath([[x, s0], [x, n0]])}"/>`).join("")}${d3.range(20, 55, 5).map((y) => `<path d="${linePath([[w0, y], [e0, y]])}"/>`).join("")}</g>
        <path class="land-halo" d="${landD}"/>
        <path class="land" d="${landD}"/>
        <path class="lakes" d="${GEO.lakes.map(ringPath).join("")}"/>
        <path class="rivers" d="${GEO.rivers.map(linePath).join("")}"/>
      </g></svg>
      <div class="map-labels" aria-hidden="true">${[["Mare Nostrum", [17, 35.2]], ["Pontus Euxinus", [34, 43.3]], ["Aegyptus", [29.5, 26.5]], ["Italia", [13.5, 42.6]], ["Graecia", [22, 39.4]], ["Asia", [30, 38.7]], ["Syria", [38.8, 35.2]], ["Gallia", [2.5, 46.5]], ["Germania", [10, 51.5]], ["Arabia", [42, 27]]].map(([t, c]) => { const [x, y] = P(c); return `<span data-x="${x}" data-y="${y}">${t}</span>`; }).join("")}</div>
      <div class="map-pins">${places.map((p) => {
        const [x, y] = P([p.lon, p.lat]);
        const n = (counts[p.slug] || []).length;
        return `<button type="button" class="pin ${n ? "has" : ""}" data-slug="${p.slug}" data-x="${x}" data-y="${y}" style="--n:${Math.sqrt(n)}" aria-label="${esc(p.name)}"><i></i><span>${esc(p.name)}</span></button>`;
      }).join("")}</div>
      <div class="map-zoom"><button type="button" data-z="1.6" aria-label="Zoom in">+</button><button type="button" data-z="0.625" aria-label="Zoom out">−</button><button type="button" data-z="0" aria-label="Reset">⟲</button></div>`;
    const svg = d3.select(wrap).select("svg"), g = svg.select("#zoomer");
    const floating = $$(".map-pins .pin, .map-labels span", wrap).map((el) => [el, +el.dataset.x, +el.dataset.y]);
    let fit = { s: 1, ox: 0, oy: 0 };
    const measure = () => { const cw = wrap.clientWidth, ch = wrap.clientHeight, s = Math.max(cw / W, ch / H); fit = { s, ox: (cw - W * s) / 2, oy: (ch - H * s) / 2 }; };
    measure();
    let cur = d3.zoomIdentity, raf = 0;
    const place = () => {
      raf = 0;
      const { s, ox, oy } = fit;
      for (const [el, x, y] of floating) el.style.transform = `translate3d(${(ox + s * cur.applyX(x)).toFixed(1)}px, ${(oy + s * cur.applyY(y)).toFixed(1)}px, 0)`;
      wrap.classList.toggle("near", cur.k > 3.2);
      declutter();
    };
    // Where labels would collide (Jerusalem, Caesarea, Megiddo…), try each label above, below, right
    // and left of its pin, busiest places first; a label with no free spot waits for hover or zoom.
    const pinEls = floating.filter(([el]) => el.classList.contains("pin")).map(([el, x, y]) => ({ el, x, y, span: el.querySelector("span"), n: (counts[el.dataset.slug] || []).length }))
      .sort((a, b) => b.n - a.n);
    pinEls.forEach((p) => (p.w = p.span.offsetWidth || p.span.textContent.length * 9, p.h = 14));
    const SIDES = ["t", "b", "r", "l"];
    const box = (p, sx, sy, side) => {
      const { w, h } = p, g = 12;
      if (side === "t") return [sx - w / 2, sy - g - h, sx + w / 2, sy - g];
      if (side === "b") return [sx - w / 2, sy + g, sx + w / 2, sy + g + h];
      if (side === "r") return [sx + g, sy - h / 2, sx + g + w, sy + h / 2];
      return [sx - g - w, sy - h / 2, sx - g, sy + h / 2];
    };
    const hit = (a, b) => a[0] < b[2] + 4 && a[2] + 4 > b[0] && a[1] < b[3] + 2 && a[3] + 2 > b[1];
    function declutter() {
      const { s, ox, oy } = fit, story = wrap.dataset.layer === "story", taken = [];
      for (const p of pinEls) {
        if (!story && !p.n) { p.el.dataset.side = "t"; continue; }
        const sx = ox + s * cur.applyX(p.x), sy = oy + s * cur.applyY(p.y);
        let side = SIDES.find((sd) => { const b = box(p, sx, sy, sd); return !taken.some((t) => hit(b, t)); });
        if (side) taken.push(box(p, sx, sy, side));
        p.el.dataset.side = side || "x";
      }
    }
    const zoom = d3.zoom().scaleExtent([1, 14]).translateExtent([[-200, -200], [W + 200, H + 200]])
      .on("start", () => wrap.classList.add("moving"))
      .on("end", () => wrap.classList.remove("moving"))
      .on("zoom", (ev) => { cur = ev.transform; g.attr("transform", cur); if (!raf) raf = requestAnimationFrame(place); });
    svg.call(zoom);
    $(".map-pins", wrap).addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
    const onResize = () => { measure(); place(); };
    addEventListener("resize", onResize);
    cleanup.push(() => removeEventListener("resize", onResize));
    $(".map-zoom", wrap).addEventListener("click", (e) => {
      const z = e.target.closest("[data-z]")?.dataset.z;
      if (z == null) return;
      if (+z === 0) svg.transition().duration(900).call(zoom.transform, d3.zoomIdentity);
      else svg.transition().duration(500).call(zoom.scaleBy, +z);
    });
    const layerBtns = $$(".map-toggle button");
    const setLayer = (l) => {
      layerBtns.forEach((b) => b.classList.toggle("on", b.dataset.layer === l));
      wrap.dataset.layer = l;
      declutter();
    };
    layerBtns.forEach((b) => b.addEventListener("click", () => setLayer(b.dataset.layer)));
    setLayer("origins");
    const show = (slug, fly) => {
      const p = ENT[slug];
      if (!p) return;
      $$(".pin", wrap).forEach((x) => x.classList.toggle("sel", x.dataset.slug === slug));
      measure();
      const docs = (counts[slug] || []).map((d) => CARDS[d]).filter(Boolean).sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
      panel.innerHTML = `<button class="map-close" type="button" aria-label="Close"><svg class="x-ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/></svg></button>
        <span class="caps">${esc(p.region || "")}</span><h2>${esc(p.name)}</h2>
        ${p.bio?.[0] ? `<p>${p.bio[0]}</p>` : ""}
        ${docs.length ? `<h3 class="caps">Written or found here</h3><ul>${docs.map((c) => `<li style="${accent(c.section)}"><a href="#/doc/${c.id}"><i>${esc(yearText(c.year))}</i>${esc(c.title)}</a></li>`).join("")}</ul>` : ""}
        <a class="link-gold" href="#/p/${slug}">${p.mentions?.length || 0} writings mention ${esc(p.name)} <span class="arrow">→</span></a>`;
      panel.classList.add("on");
      $(".map-close", panel).addEventListener("click", () => { panel.classList.remove("on"); $$(".pin", wrap).forEach((x) => x.classList.remove("sel")); });
      if (fly) {
        const [x, y] = P([p.lon, p.lat]), k = 4;
        svg.transition().duration(1400).call(zoom.transform, d3.zoomIdentity.translate(W / 2 - x * k, H / 2 - y * k).scale(k));
      }
    };
    wrap.addEventListener("click", (e) => { const pin = e.target.closest(".pin"); if (pin) show(pin.dataset.slug, false); });
    if (focus && ENT[focus]) { setLayer(counts[focus] ? "origins" : "story"); show(focus, true); }
    else {
      // Open over the whole Mediterranean, then settle between Rome and Jerusalem.
      const at = (lon, lat, k) => { const [x, y] = P([lon, lat]); return d3.zoomIdentity.translate(W / 2 - x * k, H / 2 - y * k).scale(k); };
      const target = innerWidth < 760 ? at(33, 33.5, 2.1) : at(26.5, 35.5, 1.75);
      svg.call(zoom.transform, at(22, 38, 1.15)).transition().delay(300).duration(2600).ease(d3.easeCubicInOut).call(zoom.transform, target);
      // If the page was in the background and the glide never ran, land on the view anyway.
      const guard = setTimeout(() => { if (cur.k < 1.2) svg.interrupt().call(zoom.transform, target); }, 3400);
      cleanup.push(() => clearTimeout(guard));
    }
  }

  /* ═════════════ TIMELINE ═════════════ */
  function renderTimeline() {
    document.title = "The Timeline | The Jesus Archive";
    const items = timelineDocs();
    let era = -1, html = "";
    items.forEach((c) => {
      const e = ERAS.findIndex(([a, b]) => c.year >= a && c.year < b);
      if (e !== era) { era = e; html += `<div class="tl-era reveal"><h2>${esc(ERAS[e][2])}</h2><p>${esc(ERAS[e][3])}</p></div>`; }
      html += `<div class="tl-item reveal" style="${accent(c.section)}"><a href="#/doc/${c.id}"><span class="tl-year">${esc(c.date || yearText(c.year))}</span><b>${esc(c.title)}</b><p>${esc(c.summary)}</p><span class="caps sec">${esc(SECTIONS[c.section]?.title || "")}</span></a></div>`;
    });
    view.innerHTML = `
      ${banner({ slug: "last-judgment", crumbs: `<a href="#/">The Jesus Archive</a>`, kicker: "Through the centuries", title: "The Timeline", lede: "Every witness in this archive, placed in the order it was written or made: prophecy and Gospel, historian and Father, stone and scroll." })}
      <div class="tl">${html}</div>
      ${footer()}`;
  }

  /* ═════════════ ABOUT AND FAQ (preview builds only: data-js/pages.js exists only when PREVIEW_PAGES=1) ═════════════ */
  // Question-and-answer sections on four flagship pages (text in data-js/pages.js, loaded only where needed).
  const QA_KEYS = new Set(["witnesses/tacitus-annals-15-44", "witnesses/josephus-antiquities-18", "archaeology/pilate-inscription", "study:resurrection"]);
  async function qaBlock(key) {
    if (!QA_KEYS.has(key)) return "";
    if (!window.PAGES) await loadScript("data-js/pages.js?v=1794472824").catch(() => {});
    const Q = window.PAGES?._qa?.[key];
    return Q ? `<section class="qa-block reveal" id="questions"><span class="caps">Questions and answers</span><h2>${esc(Q.title)}</h2><article class="folio"><div class="prose page-prose">${Q.html}</div></article></section>` : "";
  }

  async function renderPage(k) {
    if (!window.PAGES) await loadScript("data-js/pages.js?v=1794472824").catch(() => {});
    const P = window.PAGES?.[k];
    if (!P) return renderLost();
    document.title = `${P.title} | The Jesus Archive`;
    view.innerHTML = `
      ${banner({ slug: P.plate, title: esc(P.title), lede: esc(P.lede) })}
      <section class="text-wrap page-wrap"><article class="folio"><div class="prose page-prose">${P.html}</div></article></section>
      ${footer()}`;
  }

  /* ═════════════ GALLERY ═════════════ */
  async function renderGallery(focus) {
    document.title = "The Gallery | The Jesus Archive";
    if (!window.STORIES) await loadScript("assets/stories.js?v=1794472824").catch(() => (window.STORIES = {}));
    const STORIES = window.STORIES || {};
    const uses = {};
    Object.values(CARDS).forEach((c) => c.section !== "sources" && (uses[c.plate] ||= []).push(c));
    // An artwork's own address (/gallery/<slug>) opens on that work: its painting and title head the page.
    const fa = focus && GALLERY.find((a) => a.slug === focus);
    const artBanner = (a) => banner({ slug: a.slug, title: esc(a.title), lede: `${esc(a.artist)} · ${esc(a.year)} · ${esc(a.place)}. One of the works in <a href="/gallery">the gallery</a> of this archive.` });
    const hallBanner = () => banner({ slug: "school-athens", title: "The Gallery", lede: "The paintings and sculptures that light this archive. Walk along the wall, and choose any painting to hear its story." });
    // On an artwork's page the header follows the painting being read, so heading and address always agree.
    const swapBanner = (html) => { if (fa) { const b = $(".banner", view); if (b) b.outerHTML = html; } };
    view.innerHTML = `
      ${fa ? artBanner(fa) : hallBanner()}
      <section class="hallway">
        <div class="wall" id="wall" tabindex="0" role="region" aria-label="The gallery wall">
          ${GALLERY.map((a, i) => `<figure class="hung" data-art="${a.slug}" style="--i:${i}">
            <span class="spot" aria-hidden="true"></span>
            <button type="button" class="hung-frame frame" data-open="${a.slug}" aria-label="${esc(a.title)}, ${esc(a.artist)}"><span class="frame-inner"><img ${srcset(a.slug, "(max-width: 640px) 70vw, 380px")} alt="" loading="lazy" decoding="async"></span></button>
            <figcaption class="plaque"><span class="caps">${roman(i + 1)}</span><b>${esc(a.title)}</b><i>${esc(a.artist)} · ${esc(a.year)}</i></figcaption>
          </figure>`).join("")}
        </div>
        <div class="wall-nav"><button type="button" data-walk="-1" aria-label="Walk back">←</button><span class="caps">Walk the gallery</span><button type="button" data-walk="1" aria-label="Walk on">→</button></div>
      </section>
      <aside class="story-drawer" id="drawer" role="dialog" aria-modal="false" aria-labelledby="drawer-title" inert><button type="button" class="drawer-close" aria-label="Close"><svg class="x-ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/></svg></button><div class="drawer-body"></div></aside>
      ${footer()}`;
    const wall = $("#wall"), drawer = $("#drawer");
    const step = () => (wall.querySelector(".hung")?.offsetWidth || 400) + 40;
    $(".wall-nav").addEventListener("click", (e) => { const k = e.target.closest("[data-walk]")?.dataset.walk; if (k) wall.scrollBy({ left: +k * step(), behavior: "smooth" }); });
    // drag along the wall with a mouse
    let down = false, sx = 0, sl = 0, moved = 0;
    wall.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; down = true; moved = 0; sx = e.clientX; sl = wall.scrollLeft; });
    const mv = (e) => { if (!down) return; moved = Math.max(moved, Math.abs(e.clientX - sx)); wall.scrollLeft = sl - (e.clientX - sx); if (moved > 6) wall.classList.add("drag"); };
    const up = () => { down = false; setTimeout(() => wall.classList.remove("drag"), 0); };
    addEventListener("pointermove", mv); addEventListener("pointerup", up);
    cleanup.push(() => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); });
    const openStory = (slug, push) => {
      const i = GALLERY.findIndex((a) => a.slug === slug);
      const a = GALLERY[i];
      if (!a) return;
      $(".drawer-body", drawer).innerHTML = `
        <span class="caps room-num">${roman(i + 1)}</span>
        <h2 id="drawer-title">${LATIN_TITLES[a.title] ? latin(a.title, LATIN_TITLES[a.title]) : esc(a.title)}</h2>
        <p class="meta">${esc(a.artist)} · ${esc(a.year)} · ${esc(a.place)}</p>
        ${a.photoCredit ? `<p class="meta photo-credit"><a href="${esc(a.source)}" target="_blank" rel="noopener">${esc(a.photoCredit)}</a></p>` : ""}
        <button type="button" class="drawer-art" data-zoom="${a.slug}" aria-label="View full size"><img ${srcset(a.slug, "420px")} alt="${esc(a.title)} by ${esc(a.artist)}"><span class="caps">View full size</span></button>
        <div class="story">${(STORIES[a.slug] || []).map((p) => `<p>${p}</p>`).join("")}</div>
        <blockquote>“${esc(a.verse)}”<cite class="caps">${esc(a.ref)}</cite></blockquote>
        ${uses[a.slug]?.length ? `<div class="seen"><span class="caps">In the archive</span>${uses[a.slug].slice(0, 5).map((c) => `<a href="#/doc/${c.id}">${esc(c.title)}</a>`).join("")}</div>` : ""}`;
      illuminate($(".drawer-body .story p", drawer));
      drawer.classList.add("on"); drawer.inert = false;
      $$(".hung", wall).forEach((h) => h.classList.toggle("sel", h.dataset.art === slug));
      document.title = `${a.title} | The Gallery | The Jesus Archive`;
      lastOpener = wall.querySelector(`[data-open="${CSS.escape(slug)}"]`);
      if (push) { history.replaceState(null, "", "/gallery/" + slug); swapBanner(artBanner(a)); $(".drawer-close", drawer).focus({ preventScroll: true }); }
      // keep the chosen painting in view beside the drawer (an artwork page sets its own starting position below)
      const hung = lastOpener?.closest(".hung");
      if (push && hung && innerWidth > 760) wall.scrollTo({ left: hung.offsetLeft - (wall.clientWidth - drawer.offsetWidth - hung.offsetWidth) / 2, behavior: reduced ? "auto" : "smooth" });
    };
    let lastOpener = null;
    const closeStory = () => { drawer.classList.remove("on"); drawer.inert = true; $$(".hung", wall).forEach((h) => h.classList.remove("sel")); history.replaceState(null, "", "/gallery"); swapBanner(hallBanner()); document.title = "The Gallery | The Jesus Archive"; lastOpener?.focus({ preventScroll: true }); };
    wall.addEventListener("click", (e) => { const b = e.target.closest("[data-open]"); if (b && !wall.classList.contains("drag")) openStory(b.dataset.open, true); });
    $(".drawer-close", drawer).addEventListener("click", closeStory);
    // clicking anywhere outside the open panel closes it (but not a painting, which swaps the story, or the full-size viewer)
    const outside = (e) => { if (!drawer.classList.contains("on") || !lb.hidden || wall.classList.contains("drag")) return; if (drawer.contains(e.target) || e.target.closest("[data-open], #lightbox, .lb, .bar, .refcard, .cite-pop")) return; closeStory(); };
    document.addEventListener("click", outside);
    cleanup.push(() => document.removeEventListener("click", outside));
    const esc2 = (e) => { if (e.key === "Escape" && drawer.classList.contains("on") && lb.hidden) closeStory(); if (document.activeElement === wall && (e.key === "ArrowRight" || e.key === "ArrowLeft")) { e.preventDefault(); wall.scrollBy({ left: (e.key === "ArrowRight" ? 1 : -1) * step(), behavior: "smooth" }); } };
    addEventListener("keydown", esc2);
    cleanup.push(() => removeEventListener("keydown", esc2));
    // Open the story at once (not a frame later) so it is part of the finished page that crawlers and the prerender see.
    // Then, once laid out, set the painting in view: beside the open drawer on wide screens, centred on phones.
    if (fa) { openStory(focus, false); requestAnimationFrame(() => { const h = wall.querySelector(`[data-art="${CSS.escape(focus)}"]`); if (h) wall.scrollLeft = h.offsetLeft - (wall.clientWidth - (innerWidth > 760 ? drawer.offsetWidth : 0) - h.offsetWidth) / 2; }); }
  }

  /* ───────── reference hover cards ───────── */
  const refcard = $("#refcard");
  let cardTimer;
  function showRefCard(a) {
    if (a.classList.contains("gl")) {
      const g = GLOSS?.[a.dataset.gl];
      if (!g) return;
      refcard.innerHTML = `<b>Glossary</b><p class="gl-term">${esc(g.term)}</p><p>${esc(g.def)}</p>`;
      return placeCard(a);
    }
    const href = a.getAttribute("href") || "";
    const rid = a.dataset.ref || (href.match(/(?:#\/ref|#\/doc\/citations|^\/citations)\/([A-Z]\d+)/) || [])[1];
    let html = "";
    if (rid && REFS[rid]) {
      const r = REFS[rid];
      html = `<b>Reference ${esc(r.id)} · ${esc(r.section_title || "")}</b><p>${esc(r.citation)}</p>${r.note ? `<p class="note">${esc(r.note)}</p>` : ""}<p class="dom">${esc((r.domains || []).join(" · "))}</p>`;
    } else {
      const m = href.match(/^(?:#\/doc)?\/([^?#]+)/), c = m && CARDS[decodeURIComponent(m[1])];
      if (!c) return;
      html = `<b>${esc(SECTIONS[c.section]?.title || "")}${c.date ? " · " + esc(c.date) : ""}</b><p>${esc(c.title)}</p><p class="note">${esc(c.summary)}</p>`;
    }
    refcard.innerHTML = html;
    placeCard(a);
  }
  function placeCard(a) {
    refcard.hidden = false;
    const r = a.getBoundingClientRect(), cw = refcard.offsetWidth, ch = refcard.offsetHeight;
    let y = r.bottom + 10;
    if (y + ch > innerHeight - 10) y = r.top - ch - 10;
    refcard.style.left = Math.min(innerWidth - cw - 16, Math.max(16, r.left + r.width / 2 - cw / 2)) + "px";
    refcard.style.top = y + "px";
    requestAnimationFrame(() => refcard.classList.add("on"));
  }
  function hideRefCard() { clearTimeout(cardTimer); refcard.classList.remove("on"); refcard.hidden = true; }
  view.addEventListener("mouseover", (e) => {
    const a = e.target.closest('.prose a[href^="/"], .prose a[href^="#/"], [data-ref], a.xref, .gl');
    if (!a) return;
    clearTimeout(cardTimer);
    cardTimer = setTimeout(() => showRefCard(a), 150);
    a.addEventListener("mouseleave", hideRefCard, { once: true });
  });
  addEventListener("scroll", () => refcard.classList.contains("on") && hideRefCard(), { passive: true });
  // A glossary term opens on tap or keyboard focus as well as on hover.
  view.addEventListener("click", (e) => { const g = e.target.closest(".gl"); if (g) { clearTimeout(cardTimer); showRefCard(g); } else if (!refcard.hidden) hideRefCard(); });
  view.addEventListener("focusin", (e) => { const g = e.target.closest(".gl"); if (g) showRefCard(g); });
  view.addEventListener("focusout", (e) => e.target.closest(".gl") && hideRefCard());

  /* ───────── margin notes ───────── */
  // Short glosses beside a document's text: in the empty left margin on wide screens, under their paragraph otherwise.
  let notesReady = null, snItems = [], snWrap = null;
  const getNotes = () => (notesReady ||= loadScript("data-js/notes.js?v=1794472824").catch(() => {}));
  function sidenotes() {
    const wrap = $(".text-wrap[data-doc]", view);
    snItems = []; snWrap = null;
    if (!wrap) return;
    getNotes().then(() => {
      const list = NOTES?.[wrap.dataset.doc];
      if (!list || !wrap.isConnected || wrap.dataset.sn) return;
      wrap.dataset.sn = "1";
      const prose = $(".prose", wrap);
      list.forEach((n, i) => {
        const walker = document.createTreeWalker(prose, NodeFilter.SHOW_TEXT);
        let t;
        while ((t = walker.nextNode())) {
          const k = t.data.indexOf(n.at);
          if (k < 0) continue;
          const r = document.createRange(); r.setStart(t, k); r.setEnd(t, k + n.at.length);
          const span = document.createElement("span"); span.className = "sn-ref";
          r.surroundContents(span);
          span.insertAdjacentHTML("beforeend", `<sup>${i + 1}</sup>`);
          const note = document.createElement("aside"); note.className = "sn";
          note.innerHTML = `<b><span>${esc(n.kick)}</span><i>${i + 1}</i></b>${esc(n.body)}${n.see ? `<a href="${esc(n.see[1])}">See ${esc(n.see[0])} →</a>` : ""}`;
          const block = span.closest("p, blockquote, li, h2, h3") || span.parentElement;
          [span, note].forEach((el) => {
            el.addEventListener("mouseenter", () => { span.classList.add("hot"); note.classList.add("hot"); });
            el.addEventListener("mouseleave", () => { span.classList.remove("hot"); note.classList.remove("hot"); });
          });
          snItems.push({ span, note, block });
          break;
        }
      });
      snWrap = wrap;
      placeNotes();
      if (document.fonts) document.fonts.ready.then(placeNotes);
      const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("in")), { rootMargin: "0px 0px -8% 0px" });
      snItems.forEach(({ note }) => io.observe(note));
      new ResizeObserver(() => placeNotes()).observe($(".folio", wrap));
    });
  }
  function placeNotes() {
    const wrap = snWrap;
    if (!wrap || !wrap.isConnected) return;
    const wide = innerWidth >= 1280 && !wrap.classList.contains("no-toc");
    wrap.classList.toggle("sn-wide", wide);
    const folio = $(".folio", wrap);
    let floor = 0;
    const lastFor = new Map();
    snItems.forEach(({ span, note, block }) => {
      if (wide) {
        if (note.parentNode !== wrap) wrap.appendChild(note);
        const wr = wrap.getBoundingClientRect(), fr = folio.getBoundingClientRect(), sr = span.getBoundingClientRect();
        const top = Math.max(sr.top - wr.top - 4, floor);
        note.style.top = top + "px";
        note.style.left = fr.left - wr.left - 236 + "px";
        floor = top + note.offsetHeight + 22;
      } else {
        note.style.top = note.style.left = "";
        const after = lastFor.get(block) || block;
        if (after.nextElementSibling !== note) after.after(note);
        lastFor.set(block, note);
      }
    });
  }
  addEventListener("resize", () => placeNotes());

  /* ───────── 6 · glossary ───────── */
  // Only the archive's own explanatory prose is marked, never the ancient texts, and each term once per page.
  const GLOSS_AT = ".intro p, .doc-summary, .stop-bridge, .cmp-intro p, .banner-copy p, .study-text, .ev-body > p, .line-body > p, .line-claim, .pair-note, .point p, .ms p";
  function gloss() {
    if (!glossRe) return;
    const seen = new Set();
    $$(GLOSS_AT, view).forEach((el) => {
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [];
      while (w.nextNode()) if (!w.currentNode.parentElement.closest("a, .gl, .initial, .il-tail, .sr")) nodes.push(w.currentNode);
      nodes.forEach((n) => {
        const t = n.nodeValue;
        let m, last = 0, frag = null;
        glossRe.lastIndex = 0;
        while ((m = glossRe.exec(t))) {
          const i = glossAt[m[1].toLowerCase()];
          if (i == null || seen.has(i)) continue;
          seen.add(i);
          frag ||= document.createDocumentFragment();
          frag.append(t.slice(last, m.index));
          const span = document.createElement("span");
          Object.assign(span, { className: "gl", tabIndex: 0, textContent: m[1] });
          span.dataset.gl = i;
          frag.append(span);
          last = m.index + m[1].length;
        }
        if (frag) { frag.append(t.slice(last)); n.replaceWith(frag); }
      });
    });
  }

  /* ───────── search ───────── */
  const sBox = $("#search"), qIn = $("#q"), qRes = $("#qresults"), qCount = $("#qcount");
  let sel = 0, results = [];
  const SUGGEST = ["witnesses/tacitus-annals-15-44", "witnesses/josephus-antiquities-18", "archaeology/pilate-inscription", "scripture/new-testament/07-1-corinthians", "fathers/didache", "gospels/gospel-of-thomas"];
  async function openSearch() {
    sBox.hidden = false;
    document.body.style.overflow = "hidden";
    await indexReady;
    if (!Object.keys(SECTIONS).length) prep();
    qIn.focus(); qIn.select();
    run();
    getSearch().then(run);
  }
  function closeSearch() { sBox.hidden = true; document.body.style.overflow = ""; }
  // Words and "quoted phrases"; a document must contain every one. Whole-phrase matches rank first.
  const parseQuery = (q) => {
    const phrases = [...q.matchAll(/"([^"]+)"/g)].map((m) => m[1].trim()).filter(Boolean);
    const words = q.replace(/"[^"]*"?/g, " ").split(/\s+/).filter((w) => w.length > 0);
    return { terms: [...phrases, ...words], whole: q.replace(/"/g, "").trim() };
  };
  const reEsc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function run() {
    const q = qIn.value.trim().toLowerCase();
    const { terms, whole } = parseQuery(q);
    if (!terms.length) {
      results = SUGGEST.filter((i) => CARDS[i]).map((i) => ({ id: i, t: esc(CARDS[i].title), s: CARDS[i].section, x: esc(CARDS[i].summary) }));
      qCount.textContent = "";
      return draw("Where to begin");
    }
    if (!SEARCH) { qRes.innerHTML = `<li class="hint">Opening the archive…</li>`; return; }
    const scored = [];
    for (const d of SEARCH) {
      let score = 0, ok = true;
      for (const t of terms) {
        const inT = d.tl.includes(t);
        let n = 0, i = -1;
        while (n < 40 && (i = d.xl.indexOf(t, i + 1)) !== -1) n++;
        if (!inT && !n) { ok = false; break; }
        score += (inT ? 60 : 0) + Math.log2(1 + n) * 6;
      }
      if (!ok) continue;
      if (terms.length > 1 && whole.includes(" ")) {
        if (d.tl.includes(whole)) score += 120;
        else if (d.xl.includes(whole)) score += 60;
      }
      scored.push({ d, score: score - (d.s === "sources" ? 6 : 0) });
    }
    scored.sort((a, b) => b.score - a.score);
    const re = new RegExp("(" + terms.sort((a, b) => b.length - a.length).map(reEsc).join("|") + ")", "gi");
    results = scored.slice(0, 50).map(({ d }) => {
      let at = whole.includes(" ") ? d.xl.indexOf(whole) : -1;
      if (at < 0) at = d.xl.indexOf(terms.find((t) => d.xl.includes(t)) || terms[0]);
      const from = Math.max(0, at - 80);
      let s = d.x.slice(from, from + 220);
      if (from > 0) s = "…" + s.slice(s.indexOf(" ") + 1);
      return { id: d.id, t: esc(d.t).replace(re, "<mark>$1</mark>"), s: d.s, x: esc(s).replace(re, "<mark>$1</mark>") + "…", q: qIn.value.trim() };
    });
    qCount.textContent = scored.length ? `${scored.length} found` : "";
    draw();
  }
  function draw(head) {
    sel = 0;
    if (!results.length) { qRes.innerHTML = `<li class="hint">Nothing contains every word of “${esc(qIn.value)}”. Try fewer words.</li>`; return; }
    qRes.innerHTML = (head ? `<li class="head caps">${head}</li>` : "") + results.map((r, i) => `<li class="${i === sel ? "sel" : ""}" style="${accent(r.s)}"><a href="${r.q ? docHref(r.id, null, r.q) : "#/doc/" + r.id}"><span class="c">${esc((SECTIONS[r.s] || { title: "Sources" }).title)}</span><span class="t">${r.t}</span><span class="x">${r.x}</span></a></li>`).join("");
  }
  function moveSel(k) {
    const items = $$("li", qRes).filter((l) => l.querySelector("a"));
    if (!items.length) return;
    items[sel]?.classList.remove("sel");
    sel = (sel + k + items.length) % items.length;
    items[sel].classList.add("sel");
    items[sel].scrollIntoView({ block: "nearest" });
  }
  let sTimer;
  qIn.addEventListener("input", () => { clearTimeout(sTimer); sTimer = setTimeout(run, 90); });
  qIn.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); moveSel(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); moveSel(-1); }
    else if (e.key === "Enter") { const a = $$("li a", qRes)[sel]; if (a) { e.preventDefault(); closeSearch(); go(a.getAttribute("href")); } }
  });
  sBox.addEventListener("click", (e) => { if (e.target.closest("[data-close]") || e.target.closest("li a")) closeSearch(); });
  $("#openSearch").addEventListener("click", openSearch);

  /* ───────── lightbox ───────── */
  const lb = $("#lightbox"), lbImg = $("#lbImg"), lbCap = $("#lbCap"), lbStage = $("#lbStage");
  let lbIndex = 0, zoomed = false;
  function openLightbox(slug) { lbIndex = Math.max(0, GALLERY.findIndex((a) => a.slug === slug)); lb.hidden = false; document.body.style.overflow = "hidden"; drawLb(); }
  function drawLb() { const a = GALLERY[lbIndex]; setZoom(false); lbImg.src = `art/${fileOf(a.slug)}.jpg`; lbImg.alt = `${a.title} by ${a.artist}`; lbCap.innerHTML = `<b>${esc(a.title)}</b><span>${esc(a.artist)} · ${esc(a.year)} · ${esc(a.place)}${a.photoCredit ? ` · ${esc(a.photoCredit)}` : ""}</span>`; }
  function closeLb() { lb.hidden = true; document.body.style.overflow = ""; }
  function setZoom(on) { zoomed = on; lbStage.classList.toggle("zoomed", on); lbImg.style.transform = on ? "scale(2.4)" : ""; }
  const pan = (e) => { const s = lbStage.getBoundingClientRect(); lbImg.style.transformOrigin = `${((e.clientX - s.left) / s.width) * 100}% ${((e.clientY - s.top) / s.height) * 100}%`; };
  lbStage.addEventListener("click", (e) => { if (e.target !== lbImg) return closeLb(); pan(e); setZoom(!zoomed); });
  lbStage.addEventListener("mousemove", (e) => zoomed && pan(e));
  const step = (k) => { lbIndex = (lbIndex + k + GALLERY.length) % GALLERY.length; drawLb(); };
  lb.addEventListener("click", (e) => {
    const act = e.target.closest("[data-lb]")?.dataset.lb;
    if (act === "close" || e.target === lb) closeLb();
    else if (act === "prev") step(-1);
    else if (act === "next") step(1);
  });

  /* ───────── keyboard ───────── */
  addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName);
    if (!lb.hidden) { if (e.key === "Escape") closeLb(); if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1); return; }
    if (!sBox.hidden) { if (e.key === "Escape") closeSearch(); return; }
    if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (!typing && e.key === "/")) { e.preventDefault(); openSearch(); }
  });

  /* Typography: straight quotes become curly ones and spaced hyphens en dashes, in the page's text only.
     The text is read as one string across elements, so a quote beside a link or <em> still turns the right way;
     each replacement is one character for one, so the result maps straight back onto the text nodes. */
  function typeset(root) {
    const nodes = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) if (!n.parentElement.closest("script, style, code, pre, textarea, svg")) nodes.push(n);
    const s = nodes.map((n) => n.nodeValue).join("");
    if (!/["']| - /.test(s)) return;
    const open = /[\s(\[{—–‘“\/-]/, word = /[\p{L}\p{N}]/u;
    let out = "";
    for (let i = 0; i < s.length; i++) {
      const c = s[i], p = s[i - 1] ?? " ", n = s[i + 1] ?? " ";
      if (c === '"') out += open.test(p) ? "“" : /[\s.,;:!?)\]—–]/.test(n) || word.test(p) ? "”" : "“";
      else if (c === "'") out += word.test(p) || /[.,!?]/.test(p) ? "’" : word.test(n) ? "‘" : "’";
      else if (c === "-" && p === " " && n === " ") out += "–";
      else out += c;
    }
    let k = 0;
    for (const n of nodes) { const len = n.nodeValue.length, t = out.slice(k, k + len); if (t !== n.nodeValue) n.nodeValue = t; k += len; }
  }

  function renderLost() {
    document.title = "Not found | The Jesus Archive";
    view.innerHTML = `<section class="lost"><div><div class="ornament">${CROSS}</div><h1>“Seek, and you will find.”</h1><p>Matthew 7:7, but not at this address.</p><p style="margin-top:30px"><a class="btn btn-gold" href="#/">Return home</a></p></div></section>`;
  }

  render();
})();
