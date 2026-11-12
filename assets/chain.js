// The Chain of Witnesses: who knew whom among the early witnesses, drawn as threads graded by how well each link is attested.
// Loaded on demand by app.js for /chain; LUX.chain.render(view, params, onCleanup) draws the page.
(() => {
const N = {
  jesus:     { name: "Jesus", date: "d. c. AD 30–33", yr: 23, lane: 3.4, img: "e-jesus-pantocrator", root: true, face: [153 / 343, 168 / 640, 1.12, 640 / 343],
               bio: "Teacher from Nazareth, crucified in Jerusalem under Pontius Pilate. Every thread on this chart begins with the people who followed him." },
  peter:     { name: "Peter", date: "d. c. 64–68", yr: 52, lane: 1.5, img: "e-peter",
               bio: "Fisherman of Galilee and leader of the Twelve. Paul met him in Jerusalem; early tradition places his death in Rome under Nero." },
  john:      { name: "John", date: "d. c. 100?", yr: 64, lane: 3.4, img: "e-john-son-of-zebedee",
               bio: "Son of Zebedee, one of the Twelve and, with Peter and James, a 'pillar' of the Jerusalem church. Second-century tradition has him living to old age at Ephesus." },
  paul:      { name: "Paul", date: "d. c. 64–67", yr: 54, lane: 5.4, img: "e-paul",
               bio: "Pharisee turned apostle. His letters, written c. AD 48–60s, are the earliest Christian documents to survive." },
  mark:      { name: "Mark", date: "fl. 50s–60s", yr: 70, lane: 0.3, mono: "M",
               bio: "John Mark of Jerusalem, cousin of Barnabas. A companion of Paul, later linked with Peter, and traditionally the author of the second Gospel." },
  luke:      { name: "Luke", date: "fl. 50s–80s", yr: 78, lane: 6.5, mono: "L",
               bio: "Physician and travelling companion of Paul; traditionally the author of the Gospel of Luke and the Acts of the Apostles." },
  clement:   { name: "Clement of Rome", date: "fl. c. 96", yr: 98, lane: 2.3, img: "e-clement-of-rome",
               bio: "A leader of the church at Rome. His letter to the Corinthians, c. AD 96, is the earliest Christian writing outside the New Testament." },
  ignatius:  { name: "Ignatius", date: "d. c. 110", yr: 108, lane: 5.2, img: "e-ignatius-of-antioch",
               bio: "Bishop of Antioch. Under arrest on the road to Rome, he wrote seven letters, one of them to Polycarp." },
  papias:    { name: "Papias", date: "fl. c. 110–130", yr: 120, lane: 1.4, img: "e-papias",
               bio: "Bishop of Hierapolis in Asia Minor. He collected what the apostles' followers remembered; his books are lost and survive only in quotations." },
  polycarp:  { name: "Polycarp", date: "c. 69–155", yr: 128, lane: 3.4, img: "e-polycarp",
               bio: "Bishop of Smyrna, martyred at eighty-six. The best-attested living link between the apostles and the later church." },
  justin:    { name: "Justin Martyr", date: "c. 100–165", yr: 152, lane: 5.6, img: "e-justin-martyr",
               bio: "Philosopher and teacher in Rome who described Christian worship and the 'memoirs of the apostles'. Executed c. AD 165." },
  tatian:    { name: "Tatian", date: "fl. c. 170", yr: 172, lane: 6.6, img: "e-tatian",
               bio: "Justin's student. His Diatessaron wove the four Gospels into one account, which shows all four were already recognised." },
  irenaeus:  { name: "Irenaeus", date: "c. 130–202", yr: 182, lane: 3.4, img: "e-irenaeus",
               bio: "Bishop of Lyon. As a boy in Smyrna he heard Polycarp; his Against Heresies, c. AD 180, names the authors of all four Gospels." },
  hippolytus:{ name: "Hippolytus", date: "c. 170–235", yr: 220, lane: 2.3, mono: "H",
               bio: "Presbyter and theologian in Rome, the most prolific writer of the Roman church in the early third century." },
  pantaenus: { name: "Pantaenus", date: "fl. c. 180", yr: 180, lane: 0.3, mono: "P",
               bio: "Head of the Christian school at Alexandria in the late second century. None of his writings survives." },
  clementA:  { name: "Clement of Alexandria", date: "c. 150–215", yr: 206, lane: 1.0, mono: "C",
               bio: "Teacher at Alexandria whose Stromata quotes widely from the Gospels and from earlier Christian writers." },
  origen:    { name: "Origen", date: "c. 185–253", yr: 236, lane: 0.3, img: "e-origen",
               bio: "The greatest Christian scholar of his age, at Alexandria and later Caesarea. He compared manuscripts of the Bible in several languages." },
};
const E = [
  { a: "jesus", b: "peter", g: 1, quote: "He was seen of Cephas, then of the twelve.", cite: "Paul, 1 Corinthians 15:5 (c. AD 54)",
    text: "Peter's place as the first of Jesus's disciples is stated in all four Gospels and, earlier still, in Paul's letters." },
  { a: "jesus", b: "john", g: 1, quote: "And going on a little farther, he saw James the son of Zebedee, and John his brother… and straightway he called them.", cite: "Mark 1:19–20",
    text: "John and his brother James are among the first called in every Gospel account. Paul names John as one of the three 'pillars' of the Jerusalem church (Galatians 2:9)." },
  { a: "jesus", b: "paul", g: 1, quote: "And last of all he was seen of me also, as of one born out of due time.", cite: "Paul, 1 Corinthians 15:8",
    text: "Paul never followed Jesus during his ministry. This thread is his own claim to have seen the risen Jesus, which he places last in the list of appearances." },
  { a: "paul", b: "peter", g: 1, met: true, quote: "Then after three years I went up to Jerusalem to see Peter, and abode with him fifteen days.", cite: "Paul, Galatians 1:18",
    text: "Paul's own account of meeting Peter, about three years after his conversion: a first-hand statement in one of his undisputed letters." },
  { a: "paul", b: "john", g: 1, met: true, quote: "James, Cephas, and John, who seemed to be pillars, gave to me and Barnabas the right hands of fellowship.", cite: "Paul, Galatians 2:9",
    text: "On a later visit to Jerusalem Paul met John in person, along with Peter and James the brother of Jesus." },
  { a: "paul", b: "mark", g: 1, quote: "Marcus, Aristarchus, Demas, Lucas, my fellowlabourers.", cite: "Paul, Philemon 24",
    text: "Mark appears as Paul's co-worker in Philemon, one of the undisputed letters, and again in Colossians 4:10 as 'sister's son to Barnabas'." },
  { a: "paul", b: "luke", g: 1, quote: "Luke, the beloved physician, and Demas, greet you.", cite: "Colossians 4:14; see also Philemon 24",
    text: "Luke is named with Paul in three letters. The 'we' passages of Acts, where the narrator travels with Paul, point the same way." },
  { a: "peter", b: "mark", g: 2, quote: "Mark, having become the interpreter of Peter, wrote down accurately, though not in order, whatsoever he remembered of the things said or done by Christ.", cite: "Papias, c. AD 110–130, quoted by Eusebius, Church History 3.39.15",
    text: "Papias reports this from 'the Elder', a teacher of the generation that knew the apostles. 1 Peter 5:13 also calls Mark 'my son'.",
    note: "Most scholars accept that Papias wrote this; they differ on how much weight his source deserves." },
  { a: "peter", b: "clement", g: 2, quote: "This man, as he had seen the blessed apostles, and had been conversant with them, might be said to have the preaching of the apostles still echoing in his ears.", cite: "Irenaeus, Against Heresies 3.3.3 (c. AD 180)",
    text: "Clement's own letter speaks of Peter and Paul as 'the noble examples of our own generation'. Irenaeus says he had known them." },
  { a: "paul", b: "clement", g: 2, quote: "This man, as he had seen the blessed apostles, and had been conversant with them…", cite: "Irenaeus, Against Heresies 3.3.3",
    text: "Clement writes of Paul's death as a recent event of his own generation (1 Clement 5). Origen later identified him with the Clement whom Paul greets in Philippians 4:3.",
    note: "The Philippians identification is a later guess; the link through the Roman church is the stronger part." },
  { a: "peter", b: "ignatius", g: 3, quote: "Ignatius was appointed bishop of Antioch by the hand of the great Peter.", cite: "Theodoret, 5th century (paraphrased)",
    text: "Writers of the fourth and fifth centuries say the apostles, or Peter himself, appointed Ignatius. Other late traditions call him a disciple of John.",
    note: "Ignatius's own letters never claim personal contact with an apostle, so this thread is weak." },
  { a: "john", b: "polycarp", g: 2, quote: "I can describe the very place in which the blessed Polycarp used to sit when he discoursed… and how he would speak of his familiar intercourse with John, and with the rest of those who had seen the Lord.", cite: "Irenaeus, Letter to Florinus, quoted by Eusebius, Church History 5.20.6",
    text: "Irenaeus heard this from Polycarp in person. He also writes that Polycarp 'was instructed by apostles, and conversed with many who had seen Christ'." },
  { a: "polycarp", b: "irenaeus", g: 1, quote: "Polycarp… whom I also saw in my early youth, for he tarried a very long time.", cite: "Irenaeus, Against Heresies 3.3.4",
    text: "Irenaeus's own testimony: as a boy in Smyrna he listened to Polycarp teach." },
  { a: "ignatius", b: "polycarp", g: 1, quote: "Ignatius, who is also called Theophorus, to Polycarp, Bishop of the Church of the Smyrnaeans.", cite: "Ignatius, Letter to Polycarp (c. AD 110)",
    text: "Ignatius wrote to Polycarp directly, and Polycarp's own Letter to the Philippians (ch. 13) mentions collecting and sending on Ignatius's letters." },
  { a: "john", b: "papias", g: 3, quote: "These things are borne witness to in writing by Papias, the hearer of John, and a companion of Polycarp.", cite: "Irenaeus, Against Heresies 5.33.4",
    text: "Irenaeus calls Papias a hearer of John.",
    note: "Eusebius disagreed: reading Papias's own preface, he concluded Papias meant a different John, 'the Elder', and did not hear the apostles himself (Church History 3.39)." },
  { a: "papias", b: "polycarp", g: 2, met: true, quote: "Papias, the hearer of John, and a companion of Polycarp.", cite: "Irenaeus, Against Heresies 5.33.4",
    text: "Irenaeus, who knew Polycarp, places Papias in his circle. Both were bishops in Asia Minor in the same years." },
  { a: "justin", b: "tatian", g: 1, quote: "He was a hearer of Justin's.", cite: "Irenaeus, Against Heresies 1.28.1",
    text: "Tatian himself refers to 'the most admirable Justin' in his Address to the Greeks (ch. 18), confirming the link in his own words." },
  { a: "irenaeus", b: "hippolytus", g: 3, quote: "Hippolytus was a disciple of Irenaeus.", cite: "Photius, Bibliotheca 121 (9th century, paraphrased)",
    text: "The claim first appears some six centuries later. Hippolytus's own theology owes a clear debt to Irenaeus, which may explain the tradition.",
    note: "Many scholars treat this as an inference, not a record." },
  { a: "pantaenus", b: "clementA", g: 2, quote: "The last whom I met was the first in power; having tracked him out concealed in Egypt, I found rest.", cite: "Clement of Alexandria, Stromata 1.1",
    text: "Clement describes his last and greatest teacher without naming him. Eusebius, who read Clement's lost Outlines, says Clement named Pantaenus as his teacher there (Church History 5.11; 6.13)." },
  { a: "clementA", b: "origen", g: 3, quote: "Origen was one of his pupils while he was still a boy.", cite: "Eusebius, Church History 6.6 (paraphrased)",
    text: "Eusebius makes Origen a student of Clement at Alexandria.",
    note: "Origen never names Clement in his surviving works, and many modern scholars doubt the link." },
];


// People pages that have a figure on the chart.
const PEOPLE = { jesus: "jesus", peter: "peter", "john-son-of-zebedee": "john", paul: "paul", "clement-of-rome": "clement", "ignatius-of-antioch": "ignatius", papias: "papias", polycarp: "polycarp", "justin-martyr": "justin", tatian: "tatian", irenaeus: "irenaeus", origen: "origen" };
const GR = { 1: "In the earliest sources", 2: "Student or near-contemporary", 3: "Later tradition or disputed" };
// Where a thread's quotation can be read on this site (first match wins; no link if the work isn't here).
const SRC = [
  [/Church History (\d)\./, (m) => ["1", "3", "4", "5"].includes(m[1]) && [`fathers/eusebius-he-${m[1]}`, CH_ES ? `Eusebio, Historia eclesiástica, libro ${m[1]}` : `Eusebius, Church History, Book ${m[1]}`]],
  [/Against Heresies (\d)\./, (m) => ["1", "3"].includes(m[1]) && [`fathers/irenaeus-ah-${m[1]}`, CH_ES ? `Ireneo, Contra las herejías, libro ${m[1]}` : `Irenaeus, Against Heresies, Book ${m[1]}`]],
  [/1 Corinthians/, () => ["scripture/new-testament/07-1-corinthians", CH_ES ? "1 Corintios" : "1 Corinthians"]],
  [/Galatians/, () => ["scripture/new-testament/09-galatians", CH_ES ? "Gálatas" : "Galatians"]],
  [/Colossians/, () => ["scripture/new-testament/12-colossians", "Colossians"]],
  [/Philemon/, () => ["scripture/new-testament/18-philemon", "Philemon"]],
  [/^Mark /, () => ["scripture/new-testament/02-mark", CH_ES ? "el Evangelio según Marcos" : "the Gospel of Mark"]],
];
const sourceOf = (cite) => { for (const [re, f] of SRC) { const m = cite.match(re); if (m) return f(m) || null; } return null; };
const PAGE_OF = Object.fromEntries(Object.entries(PEOPLE).map(([slug, id]) => [id, slug]));
const personLink = (id) => PAGE_OF[id] ? `<a class="d-link" href="#/p/${PAGE_OF[id]}">${N[id].name}<span aria-hidden="true"> →</span></a>` : "";

const ERAS = [["The Lord", 6, 40, "c. 30"], ["The Apostles", 40, 90, "30–90"], ["Their Hearers", 90, 140, "90–140"], ["The Next Generation", 140, 195, "140–195"], ["The Third Generation", 195, 250, "195–250"]];
const CHAINS = [["jesus,john,polycarp,irenaeus", "John to Irenaeus"], ["jesus,peter,mark", "Peter and Mark"], ["jesus,paul,luke,mark", "Paul's circle"], ["peter,paul,clement", "The church at Rome"], ["pantaenus,clementA,origen", "Alexandria"]];
// Spanish pages load data-js/es/chain.js first (window.CHAIN_ES): names, dates, biographies, the threads' texts
// and the page's own wording. The English citation is kept for finding the source page.
const CH_ES = window.LANG === "es" ? window.CHAIN_ES : null, S = (x) => CH_ES?.strings?.[x] ?? x;
if (CH_ES) {
  for (const [k, v] of Object.entries(CH_ES.nodes || {})) if (N[k]) Object.assign(N[k], v);
  (CH_ES.edges || []).forEach((v, i) => { if (E[i]) { E[i].citeEn = E[i].cite; Object.assign(E[i], v); } });
  ERAS.forEach((r) => (r[0] = S(r[0])));
  CHAINS.forEach((c) => (c[1] = S(c[1])));
  for (const k in GR) GR[k] = S(GR[k]);
}
const ad = (y) => (CH_ES ? `${y} d. C.` : `AD ${y}`);
const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };

function render(view, params, onCleanup) {
  view.innerHTML = `
    <section class="chain-page">
      <header class="chain-head">
        <div class="chain-kicker">${S("The Chain of Witnesses")}</div>
        <h1>${S("Who knew <em>whom</em>")}</h1>
        <p class="chain-lede">${S("How the testimony about Jesus passed from hand to hand, from the apostles to the bishops and scholars of the third century. Every thread is a claim in an ancient source; tap one to read it.")}</p>
      </header>
      <div class="chain-controls"><div class="chain-chains"><span class="lbl">${S("Follow a chain")}</span>${CHAINS.map(([c, t]) => `<button type="button" data-chain="${c}">${t}</button>`).join("")}</div></div>
      <div class="chain-controls"><div class="chain-legend">
        <span><svg width="34" height="4"><line x1="0" y1="2" x2="34" y2="2" stroke="#f2dca1" stroke-width="2.2"/></svg>${S("In the earliest sources")}</span>
        <span><svg width="34" height="4"><line x1="0" y1="2" x2="34" y2="2" stroke="#dcb96f" stroke-width="1.9" stroke-dasharray="9 7"/></svg>${S("Reported by a student or near-contemporary")}</span>
        <span><svg width="34" height="4"><line x1="0" y1="2" x2="34" y2="2" stroke="#b8a785" stroke-width="1.7" stroke-dasharray="1.5 7" stroke-linecap="round"/></svg>${S("Later tradition or disputed")}</span>
      </div></div>
      <div class="chain-stage"><svg class="chain-svg" role="img" aria-label="${S("Diagram of who knew whom among the early Christian witnesses")}"></svg></div>
    </section>`;
  const drawer = document.createElement("aside");
  drawer.className = "chain-drawer";
  drawer.setAttribute("aria-live", "polite");
  drawer.innerHTML = `<button class="x" type="button" aria-label="${S("Close")}">×</button><div class="dbody"></div>`;
  document.body.appendChild(drawer);
  const dbody = drawer.querySelector(".dbody");
  // Touch screens have no hover: the first tap shows the threads (what hovering does with a mouse)
  // and a small bar to open the details; a second tap on the same thing, or the bar, opens them.
  const peek = document.createElement("div");
  peek.className = "chain-peek";
  peek.innerHTML = `<span class="pk-name"></span><button type="button" class="pk-open">${S("Details")}</button><button type="button" class="pk-x" aria-label="${S("Clear")}">×</button>`;
  document.body.appendChild(peek);
  let peeked = null, peekOpen = null;
  const noHover = () => !matchMedia("(hover: hover)").matches;
  function touchFirst(key, name, show, open) {
    if (!noHover() || drawer.classList.contains("open")) return false;
    if (peeked === key) { hidePeek(); return false; }
    reset(); locked = true; show();
    peeked = key; peekOpen = open;
    peek.querySelector(".pk-name").textContent = name;
    peek.classList.add("on");
    return true;
  }
  function hidePeek() { peeked = null; peekOpen = null; peek.classList.remove("on"); }
  peek.addEventListener("click", (ev) => ev.stopPropagation());
  peek.querySelector(".pk-open").addEventListener("click", () => { const f = peekOpen; hidePeek(); f && f(); });
  peek.querySelector(".pk-x").addEventListener("click", () => reset());
  const svg = view.querySelector(".chain-svg");
  const mq = matchMedia("(max-width: 760px)");
  let locked = false;
  const offs = [];
  const on = (t, ev, f) => { t.addEventListener(ev, f); offs.push(() => t.removeEventListener(ev, f)); };

  function draw() {
    const vert = mq.matches;
    svg.innerHTML = "";
    svg.classList.toggle("vert", vert);
    svg.classList.remove("focus");
    // Desktop: time runs left to right. Phone: time runs top to bottom, lanes across.
    const W = vert ? 480 : 1600, H = vert ? 1880 : 1000;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const T = vert ? (yr) => 120 + (yr - 6) * 7.1 : (yr) => 96 + (yr - 6) * 6.0;
    const L = vert ? (lane) => 56 + lane * 57 : (lane) => 170 + lane * 100;
    for (const id in N) { const n = N[id]; n.id = id; n.x = vert ? L(n.lane) : T(n.yr); n.y = vert ? T(n.yr) : L(n.lane); }

    const defs = el("defs", {}, svg);
    const lg = el("linearGradient", { id: "gilt", x1: "0", y1: "0", x2: "1", y2: "1" }, defs);
    [["0", "#f6dea0"], [".25", "#b78a3c"], [".5", "#6e4d1c"], [".68", "#d9b46a"], [".85", "#8b6527"], ["1", "#e8c97f"]].forEach(([o, c]) => el("stop", { offset: o, "stop-color": c }, lg));
    const rg = el("radialGradient", { id: "rootglow" }, defs);
    el("stop", { offset: "0", "stop-color": "rgba(242,220,161,.28)" }, rg); el("stop", { offset: "1", "stop-color": "rgba(242,220,161,0)" }, rg);
    const haze = el("filter", { id: "chain-haze", x: "-30%", y: "-60%", width: "160%", height: "220%" }, defs);
    el("feGaussianBlur", { stdDeviation: vert ? 5 : 6 }, haze);

    const bands = el("g", {}, svg);
    ERAS.forEach(([t, a, b, yrs]) => {
      const g = el("g", { class: "band" }, bands);
      if (vert) {
        el("rect", { x: 0, y: T(a), width: W, height: T(b) - T(a) }, g);
        const tx = el("text", { x: 12, y: T(a) + 26 }, g); tx.textContent = t;
        const ty = el("text", { x: 12, y: T(a) + 48, class: "yrs" }, g); ty.textContent = ad(yrs);
      } else {
        el("rect", { x: T(a), y: 40, width: T(b) - T(a), height: 900 }, g);
        const tx = el("text", { x: (T(a) + T(b)) / 2, y: 76, "text-anchor": "middle" }, g); tx.textContent = t;
        const ty = el("text", { x: (T(a) + T(b)) / 2, y: 101, "text-anchor": "middle", class: "yrs" }, g); ty.textContent = ad(yrs);
      }
    });
    if (!vert) {
      const ax = el("g", { class: "axis" }, svg);
      el("line", { x1: T(6), x2: T(250), y1: 960, y2: 960 }, ax);
      for (let y = 30; y <= 250; y += 20) {
        const t = el("g", { class: "tick" }, ax);
        el("line", { x1: T(y), x2: T(y), y1: 954, y2: 966 }, t);
        const tx = el("text", { x: T(y), y: 990, "text-anchor": "middle" }, t); tx.textContent = ad(y);
      }
    }
    const ad70 = el("g", { class: "ad70" }, svg);
    if (vert) {
      el("line", { x1: 8, x2: W - 8, y1: T(70), y2: T(70) }, ad70);
      const t70 = el("text", { x: W - 10, y: T(70) - 8, "text-anchor": "end" }, ad70); t70.textContent = S("Fall of Jerusalem, AD 70");
    } else {
      el("line", { x1: T(70), x2: T(70), y1: 118, y2: 954 }, ad70);
      const t70 = el("text", { x: T(70) + 8, y: 136 }, ad70); t70.textContent = S("Fall of Jerusalem, AD 70");
    }

    const edgeG = el("g", { class: "edges" }, svg);
    E.forEach((e, i) => {
      const A = N[e.a], B = N[e.b];
      let d;
      if (vert) {
        const dy = Math.max(40, (B.y - A.y) * .55);
        d = e.met && Math.abs(A.y - B.y) < 90 ? `M${A.x},${A.y} C${A.x},${A.y + 70} ${B.x},${B.y + 70} ${B.x},${B.y}` : `M${A.x},${A.y} C${A.x},${A.y + dy} ${B.x},${B.y - dy} ${B.x},${B.y}`;
      } else {
        const dx = Math.max(60, (B.x - A.x) * .55);
        d = e.met && Math.abs(A.x - B.x) < 120 ? `M${A.x},${A.y} C${A.x + 90},${A.y} ${B.x + 90},${B.y} ${B.x},${B.y}` : `M${A.x},${A.y} C${A.x + dx},${A.y} ${B.x - dx},${B.y} ${B.x},${B.y}`;
      }
      const g = el("g", { class: `edge g${e.g}${e.met ? " met" : ""}` }, edgeG);
      el("path", { d, class: "vis", id: "chain-p" + i }, g);
      el("path", { d, class: "hit" }, g);
      e.g_el = g;
      g.addEventListener("click", (ev) => { ev.stopPropagation(); if (touchFirst("e" + i, `${N[e.a].name} → ${N[e.b].name}`, () => focus(new Set([e.a, e.b]), new Set([i])), () => openEdge(i))) return; openEdge(i); });
      g.addEventListener("mouseenter", () => { if (!locked) focus(new Set([e.a, e.b]), new Set([i])); });
      g.addEventListener("mouseleave", () => { if (!locked) unfocus(); });
    });

    const nodeG = el("g", {}, svg);
    const labels = [];
    Object.values(N).forEach((n) => {
      const r = vert ? (n.root ? 36 : 27) : (n.root ? 50 : 38);
      const pos = el("g", { transform: `translate(${n.x},${n.y})` }, nodeG);
      const g = el("g", { class: "node" + (n.root ? " root" : "") }, pos);
      g.style.animationDelay = (0.4 + (n.yr - 23) / 220 * 2.8).toFixed(2) + "s";
      if (n.root) el("circle", { r: vert ? 80 : 110, fill: "url(#rootglow)" }, g);
      el("circle", { r: r + 8, class: "halo" }, g);
      el("circle", { r, class: "mono" }, g);
      if (n.img) {
        const cp = el("clipPath", { id: "chain-c-" + n.id }, defs); el("circle", { r }, cp);
        const href = `art/sm/${n.img}.webp`;
        if (n.face) {
          const [fx, fy, z, ar] = n.face, w = r * 2 * z, h = w * ar;
          el("image", { href, x: -fx * w, y: -fy * h, width: w, height: h, "clip-path": `url(#chain-c-${n.id})` }, g);
        } else el("image", { href, x: -r, y: -r, width: r * 2, height: r * 2, preserveAspectRatio: "xMidYMid slice", "clip-path": `url(#chain-c-${n.id})` }, g);
      } else { const t = el("text", { class: "mono-t" }, g); t.textContent = n.mono; }
      el("circle", { r, class: "ring" }, g);
      // On phones long names break onto two lines and labels are kept inside the chart's edges.
      const of = CH_ES ? " de " : " of ";
      const lines = vert && n.name.length > 12 && n.name.includes(of) ? [n.name.slice(0, n.name.indexOf(of)), n.name.slice(n.name.indexOf(of) + 1)] : [n.name];
      const fs = vert ? (n.root ? 19 : 16.5) : 0;
      const est = vert ? Math.max(...lines.map((l) => l.length)) * fs * .78 : 0;
      let shift = 0;
      if (vert && n.x - est / 2 < 6) shift = 6 - (n.x - est / 2);
      if (vert && n.x + est / 2 > W - 6) shift = W - 6 - (n.x + est / 2);
      const bg = el("rect", { class: "label-bg", rx: 10, filter: "url(#chain-haze)" }, g);
      const nm = el("text", { y: r + (vert ? 21 : 26), x: shift, class: "name" }, g);
      lines.forEach((l, k) => { const ts = el("tspan", { x: shift, dy: k ? (vert ? 19 : 18) : 0 }, nm); ts.textContent = l; });
      const dt = el("text", { y: r + (vert ? 39 : 47) + (lines.length - 1) * 19, x: shift, class: "date" }, g); dt.textContent = n.date;
      labels.push([bg, nm, dt]);
      n.g_el = g;
      g.addEventListener("click", (ev) => { ev.stopPropagation(); if (touchFirst("n" + n.id, n.name, () => focusLineage(n.id), () => openNode(n.id))) return; openNode(n.id); });
      g.addEventListener("mouseenter", () => { if (!locked) focusLineage(n.id); });
      g.addEventListener("mouseleave", () => { if (!locked) unfocus(); });
    });
    pulses = el("g", {}, svg);
    // Size each label's soft backing to its text once the fonts are in, so threads pass behind the names.
    const fit = () => labels.forEach(([bg, nm, dt]) => {
      const a = nm.getBBox(), b = dt.getBBox();
      const x = Math.min(a.x, b.x) - 8, y = a.y - 4, w = Math.max(a.x + a.width, b.x + b.width) - x + 8, h = b.y + b.height - y + 4;
      bg.setAttribute("x", x); bg.setAttribute("y", y); bg.setAttribute("width", w); bg.setAttribute("height", h);
    });
    fit();
    document.fonts?.ready.then(fit);
  }

  let pulses = null;
  function focus(nodes, edges) {
    svg.classList.add("focus");
    Object.values(N).forEach((n) => n.g_el.classList.toggle("on", nodes.has(n.id)));
    E.forEach((e, i) => e.g_el.classList.toggle("on", edges.has(i)));
    pulses.innerHTML = "";
    edges.forEach((i) => {
      const c = el("circle", { r: mq.matches ? 3 : 3.6, class: "pulse" }, pulses);
      const m = el("animateMotion", { dur: "2.4s", repeatCount: "indefinite", begin: (Math.random() * 1.2).toFixed(2) + "s" }, c);
      el("mpath", { href: "#chain-p" + i }, m);
    });
  }
  function unfocus() {
    svg.classList.remove("focus"); pulses.innerHTML = "";
    Object.values(N).forEach((n) => n.g_el.classList.remove("on", "sel"));
    E.forEach((e) => e.g_el.classList.remove("on", "sel"));
  }
  function focusLineage(id) {
    const nodes = new Set([id]), edges = new Set();
    const walk = (cur, dir) => E.forEach((e, i) => {
      if (e.met) { if (e.a === id || e.b === id) { edges.add(i); nodes.add(e.a); nodes.add(e.b); } return; }
      const from = dir > 0 ? e.a : e.b, to = dir > 0 ? e.b : e.a;
      if (from === cur && !edges.has(i)) { edges.add(i); nodes.add(to); walk(to, dir); }
    });
    walk(id, 1); walk(id, -1);
    focus(nodes, edges);
  }
  const chainBtns = () => view.querySelectorAll(".chain-chains button");
  function reset() { drawer.classList.remove("open"); hidePeek(); locked = false; unfocus(); chainBtns().forEach((x) => x.classList.remove("on")); }
  function openEdge(i) {
    const e = E[i], A = N[e.a], B = N[e.b];
    locked = true; focus(new Set([e.a, e.b]), new Set([i])); e.g_el.classList.add("sel");
    dbody.innerHTML = `
      <div class="d-kick">${S(e.met ? "They met" : "Passed on")}</div>
      <div class="d-title">${A.name}<span class="arr">${e.met ? "&amp;" : "→"}</span>${B.name}</div>
      <span class="grade g${e.g}"><i></i>${GR[e.g]}</span>
      <blockquote>“${e.quote}”<cite>${e.cite}</cite></blockquote>
      <p>${e.text}</p>
      ${e.note ? `<p class="note">${e.note}</p>` : ""}
      ${(() => { const s = sourceOf(e.citeEn || e.cite); const ppl = [personLink(e.a), personLink(e.b)].filter(Boolean);
        return (s ? `<a class="d-src" href="#/doc/${s[0]}">${S("Read it in")} ${s[1]}<span aria-hidden="true"> →</span></a>` : "")
          + (ppl.length ? `<div class="d-people"><span>${S("About them")}</span>${ppl.join("")}</div>` : ""); })()}`;
    drawer.scrollTop = 0;
    drawer.classList.add("open");
  }
  function openNode(id) {
    const n = N[id];
    locked = true; focusLineage(id); n.g_el.classList.add("sel");
    const rel = E.map((e, i) => [e, i]).filter(([e]) => e.a === id || e.b === id);
    dbody.innerHTML = `
      <div class="d-kick">${S("Witness")}</div>
      ${n.img ? `<img class="portrait" src="art/sm/${n.img}.webp" alt="">` : ""}
      <div class="d-title">${n.name}</div>
      <em class="d-date">${n.date}</em>
      <p>${n.bio}</p>
      ${PAGE_OF[id] ? `<a class="d-src" href="#/p/${PAGE_OF[id]}">${S("Everything on")} ${n.name}<span aria-hidden="true"> →</span></a>` : ""}
      <ul class="links">${rel.map(([e, i]) => { const o = N[e.a === id ? e.b : e.a]; return `<li><button type="button" data-i="${i}"><span>${e.a === id ? "→ " : "← "}${o.name}</span><small>${GR[e.g]}</small></button></li>`; }).join("")}</ul>`;
    dbody.querySelectorAll("[data-i]").forEach((b) => b.addEventListener("click", () => openEdge(+b.dataset.i)));
    drawer.scrollTop = 0;
    drawer.classList.add("open");
  }

  draw();
  chainBtns().forEach((b) => b.addEventListener("click", (ev) => {
    ev.stopPropagation();
    const was = b.classList.contains("on");
    reset();
    if (was) return;
    b.classList.add("on");
    const ids = new Set(b.dataset.chain.split(","));
    const edges = new Set(); E.forEach((e, i) => { if (ids.has(e.a) && ids.has(e.b)) edges.add(i); });
    locked = true; focus(ids, edges);
  }));
  drawer.querySelector(".x").addEventListener("click", reset);
  drawer.addEventListener("click", (ev) => ev.stopPropagation());
  on(document, "click", (ev) => { if (locked && !ev.target.closest?.(".chain-chains")) reset(); });
  on(document, "keydown", (ev) => { if (ev.key === "Escape" && locked) reset(); });
  on(mq, "change", () => { reset(); draw(); });

  // ?focus=<people slug> opens the chart on that person.
  const want = PEOPLE[params.get("focus")] || (N[params.get("focus")] ? params.get("focus") : null);
  let t = null;
  if (want) t = setTimeout(() => { openNode(want); N[want].g_el.closest("g").parentNode && view.querySelector(".chain-stage")?.scrollIntoView({ block: "center", behavior: "smooth" }); }, 1100);

  onCleanup(() => { clearTimeout(t); offs.forEach((f) => f()); drawer.remove(); peek.remove(); });
}

LUX.chain = { render, PEOPLE };
})();
