(function () {
  "use strict";

  var CFG = window.SITE_CONFIG;
  var DATA = window.SITE_CONTENT;
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = reduceMQ.matches;

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var SPARK = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2c1.4 6.6 4.4 9.6 14 14-9.6 4.4-12.6 7.4-14 14-1.4-6.6-4.4-9.6-14-14 9.6-4.4 12.6-7.4 14-14z"/></svg>';

  var isOwnerPreview = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === "file:" || /[?&]preview=1/.test(location.search);

  /* ---------- Brand, year, contacts ---------- */
  $$("[data-brand-name]").forEach(function (el) { el.textContent = CFG.brand.name; });
  $$("[data-brand-tag]").forEach(function (el) { el.textContent = CFG.brand.tag; });
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  function wireCta(el) {
    var href = CFG.primaryHref();
    el.setAttribute("href", href);
    if (/^https?:/.test(href)) { el.target = "_blank"; el.rel = "noopener"; }
  }
  $$("[data-cta]").forEach(wireCta);

  var contactBox = $("[data-contact-actions]");
  if (CFG.isConfigured()) {
    var buttons = CFG.contactLinks.filter(function (l) { return l.type !== "phone"; });
    var phone = CFG.contactLinks.filter(function (l) { return l.type === "phone"; })[0];
    contactBox.innerHTML = buttons.map(function (l, i) {
      var ext = /^https?:/.test(l.href) ? ' target="_blank" rel="noopener"' : "";
      return '<a class="btn ' + (i === 0 ? "btn--ink btn--big" : "btn--ghost btn--big") + '" href="' + esc(l.href) + '"' + ext + ">" + esc(l.label) + "</a>";
    }).join("");
    var extra = [];
    if (phone) extra.push('<a href="' + esc(phone.href) + '">' + esc(CFG.phoneDisplay) + "</a>");
    if (CFG.contact.maxPhone && !CFG.contact.maxUrl) extra.push("<span>MAX: " + esc(CFG.phoneDisplay) + "</span>");
    if (extra.length) contactBox.insertAdjacentHTML("afterend", '<p class="final__extra">' + extra.join('<span aria-hidden="true"> · </span>') + "</p>");
  } else {
    contactBox.innerHTML = '<p class="final__pending">Способ связи скоро появится на этой странице</p>';
    if (isOwnerPreview) $("[data-owner-note]").hidden = false;
  }

  /* ---------- Header + mobile menu ---------- */
  var header = $("[data-header]");
  var burger = $("[data-burger]");
  var menu = $("[data-mobile-menu]");

  function setMenu(open) {
    burger.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    menu.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    if (open) { var first = $("a", menu); if (first) first.focus(); }
  }
  burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !menu.hidden) { setMenu(false); burger.focus(); }
  });
  window.matchMedia("(min-width: 1021px)").addEventListener("change", function (e) { if (e.matches) setMenu(false); });

  /* ---------- Scenarios (hero) ---------- */
  var scenarios = DATA.scenarios;
  var hero = $("[data-hero]");
  var chipsBox = $("[data-chips]");
  var miniBox = $("[data-mini-chips]");
  var wordsBox = $("[data-words]");
  var stackWrap = $("[data-stack-wrap]");
  var blobA = $("[data-blob-a]");
  var blobB = $("[data-blob-b]");
  var progress = $("[data-progress]");
  var count = $("[data-count]");
  var afterList = $("[data-after-list]");
  var current = -1;

  var BLOBS = [
    { a: "58% 42% 46% 54% / 46% 58% 42% 54%", t: "rotate(0deg)", b: "translate(0,0) scale(1)" },
    { a: "40% 60% 62% 38% / 55% 38% 62% 45%", t: "rotate(-8deg)", b: "translate(240%, -250%) scale(.55)" },
    { a: "62% 38% 34% 66% / 38% 62% 38% 62%", t: "rotate(6deg)", b: "translate(210%, 10%) scale(.8)" },
    { a: "48% 52% 58% 42% / 62% 44% 56% 38%", t: "rotate(-3deg)", b: "translate(20%, -230%) scale(.65)" },
  ];
  var ACCENT_VAR = { coral: "var(--apricot)", violet: "var(--lavender)", mint: "var(--sage)", sun: "var(--gold)" };

  scenarios.forEach(function (s, i) {
    chipsBox.insertAdjacentHTML("beforeend",
      '<button class="chip" type="button" role="tab" id="tab-' + s.id + '" aria-selected="false" aria-controls="scene" tabindex="-1">' +
      '<span class="chip__swatch" style="background:' + ACCENT_VAR[s.accent] + '"></span>' + esc(s.chip) +
      '<span class="chip__timer" aria-hidden="true"><i></i></span></button>');
    miniBox.insertAdjacentHTML("beforeend",
      '<button class="chip" type="button" aria-pressed="false">' + esc(s.chip) + "</button>");
    wordsBox.insertAdjacentHTML("beforeend", "<span>" + esc(s.word) + "</span>");
  });
  $("[data-scene]").id = "scene";
  $("[data-scene]").setAttribute("role", "tabpanel");

  var tabs = $$(".chip", chipsBox);
  var minis = $$(".chip", miniBox);
  var words = $$("span", wordsBox);

  function stackHTML(s) {
    return '<div class="stack is-entering">' +
      '<div class="card card--project" style="--i:0"><p class="card__kicker"><span class="card__folder"></span>Проект</p><p class="card__title">' + esc(s.project) + "</p></div>" +
      '<div class="card card--knows" style="--i:1"><p class="card__kicker">Claude уже знает</p><ul>' +
      s.knows.map(function (k) { return "<li>" + esc(k) + "</li>"; }).join("") + "</ul></div>" +
      '<div class="card card--chat" style="--i:2"><p class="bubble bubble--me">' + esc(s.ask) + '</p><p class="bubble bubble--ai">' + SPARK + "<span>" + esc(s.reply) + "</span></p></div>" +
      "</div>";
  }

  function afterItems(s) {
    return [
      "Отдельный проект «" + s.project + "»",
      "Claude учитывает " + s.knows[0],
      "Инструкция, как пользоваться, — на одной странице",
      "Промпты под ваши задачи — в подарок",
      "Подключено только то, что помогает вашей работе",
    ];
  }

  function setScenario(i, opts) {
    opts = opts || {};
    if (i === current) return;
    var prev = current;
    current = i;
    var s = scenarios[i];
    document.body.dataset.accent = s.accent;

    tabs.forEach(function (t, k) {
      var on = k === i;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    minis.forEach(function (m, k) { m.setAttribute("aria-pressed", String(k === i)); });
    $("#scene").setAttribute("aria-labelledby", "tab-" + s.id);

    words.forEach(function (w, k) {
      w.classList.toggle("is-current", k === i);
      w.classList.toggle("is-past", k !== i && (k === prev));
      if (k !== i && k !== prev) w.classList.remove("is-past");
    });
    // the past word must start from the bottom next time
    if (prev > -1) setTimeout(function () {
      var w = words[prev];
      if (current === prev) return;
      w.style.transition = "none";
      w.classList.remove("is-past");
      void w.offsetWidth;
      w.style.transition = "";
    }, 1050);

    var b = BLOBS[i % BLOBS.length];
    blobA.style.borderRadius = b.a;
    blobA.style.transform = b.t;
    blobB.style.transform = b.b;
    progress.style.transform = "scaleX(" + (i + 1) / scenarios.length + ")";
    count.textContent = "0" + (i + 1) + " / 0" + scenarios.length;

    var old = $(".stack", stackWrap);
    if (old && !reduced) {
      old.classList.remove("is-entering");
      old.classList.add("is-leaving");
      setTimeout(function () { old.remove(); }, 650);
      setTimeout(function () { if (current === i) stackWrap.insertAdjacentHTML("beforeend", stackHTML(s)); }, prev > -1 ? 260 : 0);
    } else {
      if (old) old.remove();
      stackWrap.insertAdjacentHTML("beforeend", stackHTML(s));
    }

    // continuation in "what changes" and process
    var items = afterItems(s);
    if (!afterList.children.length) {
      afterList.innerHTML = items.map(function (t) { return '<li><span class="swap">' + esc(t) + "</span></li>"; }).join("");
    } else {
      $$(".swap", afterList).forEach(function (el, k) {
        if (el.textContent === items[k]) return;
        el.classList.add("is-swapping");
        setTimeout(function () { el.textContent = items[k]; el.classList.remove("is-swapping"); }, reduced ? 0 : 260);
      });
    }
    var hl = $("[data-step-project]");
    if (hl) hl.textContent = "проект «" + s.project + "»";

    if (opts.user) stopAuto();
    else restartTimer();
  }

  /* Auto-advance: only while the hero is visible, not hovered/focused, motion allowed */
  var AUTO_MS = 6500;
  var autoTimer = null;
  var autoOn = !reduced;
  var heroVisible = true;
  var paused = false;
  hero.style.setProperty("--auto-ms", AUTO_MS + "ms");

  function restartTimer() {
    clearTimeout(autoTimer);
    hero.classList.remove("is-auto");
    if (!autoOn) return;
    void hero.offsetWidth;
    hero.classList.add("is-auto");
    schedule(AUTO_MS);
  }
  var startedAt = 0, remaining = AUTO_MS;
  function schedule(ms) {
    clearTimeout(autoTimer);
    startedAt = Date.now(); remaining = ms;
    if (paused || !heroVisible) return;
    autoTimer = setTimeout(function () { setScenario((current + 1) % scenarios.length); }, ms);
  }
  function pause() {
    if (!autoOn || paused) return;
    paused = true; hero.classList.add("is-paused");
    clearTimeout(autoTimer);
    remaining = Math.max(400, remaining - (Date.now() - startedAt));
  }
  function resume() {
    if (!autoOn || !paused || !heroVisible) return;
    paused = false; hero.classList.remove("is-paused");
    schedule(remaining);
  }
  function stopAuto() {
    autoOn = false; clearTimeout(autoTimer);
    hero.classList.remove("is-auto", "is-paused");
  }

  var sceneAndSwitch = [$("[data-scene]"), $("[data-switch]")];
  sceneAndSwitch.forEach(function (el) {
    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", function () { if (!el.contains(document.activeElement)) resume(); });
    el.addEventListener("focusin", pause);
    el.addEventListener("focusout", function () { if (!el.matches(":hover")) resume(); });
  });
  document.addEventListener("visibilitychange", function () { document.hidden ? pause() : resume(); });

  tabs.forEach(function (t, k) {
    t.addEventListener("click", function () { setScenario(k, { user: true }); });
    t.addEventListener("keydown", function (e) {
      var n = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (k + 1) % tabs.length;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (k - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") n = 0;
      if (e.key === "End") n = tabs.length - 1;
      if (n === null) return;
      e.preventDefault();
      tabs[n].focus();
      setScenario(n, { user: true });
    });
  });
  minis.forEach(function (m, k) { m.addEventListener("click", function () { setScenario(k, { user: true }); }); });

  /* ---------- "Before" notes ---------- */
  var notesBox = $("[data-notes]");
  var CHAOS = [
    [-120, -200, -7], [120, -125, 6], [-140, -50, 4], [130, 25, -5], [-110, 100, -3], [120, 180, 7],
  ];
  DATA.before.forEach(function (t, i) {
    var c = CHAOS[i % CHAOS.length];
    notesBox.insertAdjacentHTML("beforeend", '<span class="note" data-cx="' + c[0] + '" data-cy="' + c[1] + '" data-cr="' + c[2] + '">' + esc(t) + "</span>");
  });
  $("[data-before-sr]").innerHTML = DATA.before.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
  var notes = $$(".note", notesBox);
  var afterCard = $("[data-after-card]");
  var stage = $("[data-change-stage]");

  /* ---------- Steps / route ---------- */
  var STEP_TAGS = [
    ["без аккаунта — нормально", "рассказ о работе"],
    ["аккаунт", '<span class="hl" data-step-project>проект</span>', "инструкции", "инструменты — по ситуации"],
    ["показ вживую", "простая инструкция", "промпты в подарок"],
  ];
  $("[data-steps]").innerHTML = DATA.steps.map(function (s, i) {
    return '<li class="step"><span class="step__marker" aria-hidden="true">' + (i + 1) + '</span><div class="step__body"><h3><span class="sr-only">Шаг ' + (i + 1) + ". </span>" + esc(s.title) + "</h3><p>" + esc(s.text) + '</p><p class="step__art">' +
      STEP_TAGS[i].map(function (t) { return /^</.test(t) ? t : "<span>" + esc(t) + "</span>"; }).join("") + "</p></div></li>";
  }).join("");
  $("[data-hood]").innerHTML = DATA.underTheHood.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");

  var route = $("[data-route]");
  var svg = $("[data-route-svg]");
  var track = $("[data-route-track]");
  var line = $("[data-route-line]");
  var spark = $("[data-route-spark]");
  var steps = $$(".step", route);
  var routeLen = 0, stepAt = [];

  function buildRoute() {
    var r = route.getBoundingClientRect();
    var pts = steps.map(function (s) {
      var m = $(".step__marker", s).getBoundingClientRect();
      return { x: m.left - r.left + m.width / 2, y: m.top - r.top + m.height / 2 };
    });
    svg.setAttribute("viewBox", "0 0 " + r.width + " " + r.height);
    var start = { x: pts[0].x, y: Math.max(0, pts[0].y - 70) };
    var d = "M" + start.x + " " + start.y + " L" + pts[0].x + " " + pts[0].y;
    var prefixes = [d];
    // Route runs down the marker column, crosses over in the gap between steps,
    // then drops into the next marker, so it never cuts through text.
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      var dx = b.x - a.x, dir = dx > 0 ? 1 : -1;
      var prevBox = steps[i - 1].getBoundingClientRect(), nextBox = steps[i].getBoundingClientRect();
      var gapY = (prevBox.bottom + nextBox.top) / 2 - r.top;
      var R = Math.min(48, Math.abs(dx) / 2, (gapY - a.y) / 2, (b.y - gapY) / 2);
      if (Math.abs(dx) < 4 || R < 4) {
        d += " L" + b.x + " " + b.y;
      } else {
        d += " L" + a.x + " " + (gapY - R) +
          " Q" + a.x + " " + gapY + " " + (a.x + dir * R) + " " + gapY +
          " L" + (b.x - dir * R) + " " + gapY +
          " Q" + b.x + " " + gapY + " " + b.x + " " + (gapY + R) +
          " L" + b.x + " " + b.y;
      }
      prefixes.push(d);
    }
    var last = pts[pts.length - 1];
    d += " L" + last.x + " " + (last.y + 60);
    track.setAttribute("d", d);
    line.setAttribute("d", d);
    routeLen = line.getTotalLength();
    var tmp = document.createElementNS("http://www.w3.org/2000/svg", "path");
    svg.appendChild(tmp);
    stepAt = prefixes.map(function (p) { tmp.setAttribute("d", p); return tmp.getTotalLength() / routeLen; });
    tmp.remove();
    line.style.strokeDasharray = routeLen + " " + routeLen;
  }

  /* ---------- Products ---------- */
  $("[data-products]").innerHTML = DATA.products.map(function (p) {
    var inc = "";
    if (p.includes) {
      inc = '<div class="product__includes"><h4>' + esc(p.includesTitle) + "</h4><ul>" +
        p.includes.map(function (t, i) { return '<li' + (i === p.includes.length - 1 ? ' class="is-gift"' : "") + ">" + esc(t) + "</li>"; }).join("") +
        "</ul>" + (p.includesNote ? "<p>" + esc(p.includesNote) + "</p>" : "") + "</div>";
    }
    return '<article class="product' + (p.id === "main" ? " product--main" : "") + '" data-accent="' + p.accent + '">' +
      '<span class="product__badge">' + esc(p.badge) + "</span>" +
      '<h3 class="product__title">' + esc(p.title) + "</h3>" +
      '<p class="product__when">' + esc(p.when) + "</p>" +
      '<p class="product__benefit">' + esc(p.benefit) + "</p>" +
      (p.note ? '<p class="product__note">' + esc(p.note) + "</p>" : "") +
      inc +
      '<a class="btn btn--ink" href="#contact" data-cta>' + esc(p.cta) + "</a>" +
      "</article>";
  }).join("");
  $$("[data-products] [data-cta]").forEach(wireCta);

  /* ---------- Examples / cases ---------- */
  var hasCases = DATA.cases && DATA.cases.length > 0;
  var areaColor = { basis: "var(--ink)", texts: "var(--apricot)", clients: "var(--lavender)", docs: "var(--sage)", plans: "var(--gold)", custom: "#7C8DB5" };
  var exBox = $("[data-examples]");
  if (hasCases) {
    $("[data-examples-eyebrow]").textContent = "Кейсы";
    $("[data-examples-title]").textContent = "Что уже настроено";
    $("[data-examples-lead]").textContent = "Истории опубликованы с разрешения клиентов.";
    exBox.innerHTML = DATA.cases.map(function (c) {
      return '<li class="example" data-area="' + esc(c.area || "custom") + '"><span class="example__bar" style="background:' + (areaColor[c.area] || areaColor.custom) + '"></span>' +
        (c.image ? '<img src="' + esc(c.image) + '" alt="' + esc(c.name) + '" loading="lazy" style="border-radius:14px">' : "") +
        '<p class="example__who">' + esc(c.name) + '</p><p class="example__task">' + esc(c.task) + "</p>" +
        '<p class="example__setup"><b>Что настроили</b>' + esc(c.setup) + "</p>" +
        '<p class="example__result">' + esc(c.result) + "</p>" +
        (c.permission ? '<p class="example__who">' + esc(c.permission) + "</p>" : "") + "</li>";
    }).join("");
  } else {
    exBox.innerHTML = DATA.examples.map(function (e) {
      return '<li class="example" data-area="' + e.area + '"><span class="example__bar" style="background:' + areaColor[e.area] + '"></span>' +
        '<span class="example__tag">направление</span>' +
        '<p class="example__who">' + esc(e.who) + '</p><p class="example__task">' + esc(e.task) + "</p>" +
        '<p class="example__setup"><b>Что можно настроить</b>' + esc(e.setup) + "</p>" +
        (e.text ? '<p class="example__text">' + esc(e.text) + "</p>" : "") + "</li>";
    }).join("");
  }
  var filterBox = $("[data-filter]");
  var filterPill = $("[data-filter-pill]");
  var exItems = $$(".example", exBox);
  exItems.forEach(function (el) { el.style.setProperty("--c", areaColor[el.dataset.area] || areaColor.custom); });
  var presentAreas = exItems.map(function (el) { return el.dataset.area; });
  var shownAreas = DATA.areas.filter(function (a) { return a.id === "all" || presentAreas.indexOf(a.id) > -1; });
  filterBox.insertAdjacentHTML("beforeend", shownAreas.map(function (a, i) {
    return '<button class="chip" type="button" aria-pressed="' + (i === 0) + '" data-area="' + a.id + '">' + esc(a.label) + "</button>";
  }).join(""));

  function movePill() {
    var btn = $('button[aria-pressed="true"]', filterBox);
    if (!btn || !filterPill) return;
    filterPill.style.width = btn.offsetWidth + "px";
    filterPill.style.height = btn.offsetHeight + "px";
    filterPill.style.transform = "translate(" + btn.offsetLeft + "px," + btn.offsetTop + "px)";
  }

  // Spotlight that follows the cursor across a card
  exItems.forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  filterBox.addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (!btn) return;
    $$("button", filterBox).forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
    movePill();
    var k = 0;
    exItems.forEach(function (el) {
      var show = btn.dataset.area === "all" || el.dataset.area === btn.dataset.area;
      el.classList.toggle("is-hidden", !show);
      el.classList.remove("is-in");
      if (show && !reduced) { void el.offsetWidth; el.style.setProperty("--i", k++); el.classList.add("is-in"); }
      else if (show) k++;
    });
    orbitFocus(btn.dataset.area, k);
  });

  /* ---------- Orbitals: each task area is a planet ---------- */
  var orbitals = $("[data-orbitals]");
  var orbSvg = $("[data-orbitals-svg]");
  var orbNum = $("[data-orbitals-num]");
  var orbWord = $("[data-orbitals-word]");
  var SVGNS = "http://www.w3.org/2000/svg";
  var RINGS = [170, 126, 84];
  var TILT = -16 * Math.PI / 180;
  var planets = [];
  var orbActive = "all";
  var orbBoost = 1;
  var orbVisible = false;

  function plural(n) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return "направление";
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "направления";
    return "направлений";
  }
  function svgEl(tag, attrs) {
    var el = document.createElementNS(SVGNS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  var ringEls = RINGS.map(function (rx) {
    var ring = svgEl("ellipse", { cx: 200, cy: 200, rx: rx, ry: rx * 0.42, transform: "rotate(-16 200 200)", "class": "orbitals__ring" });
    orbSvg.appendChild(ring);
    return ring;
  });
  orbSvg.appendChild(svgEl("path", { "class": "orbitals__core", d: "M200 178c2 10 6 14 22 22-16 8-20 12-22 22-2-10-6-14-22-22 16-8 20-12 22-22z" }));
  var planetLayer = svgEl("g", {});
  orbSvg.appendChild(planetLayer);

  shownAreas.filter(function (a) { return a.id !== "all"; }).forEach(function (a, i, arr) {
    var ring = i % RINGS.length;
    var g = svgEl("g", { "class": "orbitals__planet" });
    var color = areaColor[a.id] || areaColor.custom;
    var halo = svgEl("circle", { "class": "halo", r: 18, fill: color });
    var body = svgEl("circle", { "class": "body", r: 7, fill: color });
    var label = svgEl("text", {});
    label.textContent = a.label;
    g.appendChild(halo); g.appendChild(body); g.appendChild(label);
    planetLayer.appendChild(g);
    planets.push({
      id: a.id, g: g, body: body, halo: halo, label: label, ring: ring,
      angle: (i / arr.length) * Math.PI * 2 + ring * 0.7,
      speed: [0.00011, 0.00015, 0.0002][ring],
      big: a.id === "basis" ? 9 : 7,
    });
  });

  function placePlanets(dt) {
    planets.forEach(function (p) {
      if (orbActive === p.id) {
        // glide the chosen planet to the front of its orbit
        var target = Math.PI / 2 + 0.25;
        var diff = Math.atan2(Math.sin(target - p.angle), Math.cos(target - p.angle));
        p.angle += diff * Math.min(1, dt * 0.004);
      } else {
        p.angle += p.speed * dt * orbBoost;
      }
      var rx = RINGS[p.ring], ry = rx * 0.42;
      var x0 = rx * Math.cos(p.angle), y0 = ry * Math.sin(p.angle);
      var x = 200 + x0 * Math.cos(TILT) - y0 * Math.sin(TILT);
      var y = 200 + x0 * Math.sin(TILT) + y0 * Math.cos(TILT);
      p.depth = Math.sin(p.angle);
      var scale = 0.7 + 0.4 * (p.depth + 1) / 2;
      var on = orbActive === p.id;
      p.body.setAttribute("cx", x.toFixed(1)); p.body.setAttribute("cy", y.toFixed(1));
      p.body.setAttribute("r", (p.big * scale * (on ? 1.5 : 1)).toFixed(2));
      p.halo.setAttribute("cx", x.toFixed(1)); p.halo.setAttribute("cy", y.toFixed(1));
      p.halo.setAttribute("r", (on ? 26 : 18) * scale);
      var flip = x > 260;
      p.label.setAttribute("x", (flip ? x - 20 : x + 20).toFixed(1));
      p.label.setAttribute("y", (y + 4).toFixed(1));
      p.label.setAttribute("text-anchor", flip ? "end" : "start");
    });
    planets.slice().sort(function (a, b) { return a.depth - b.depth; }).forEach(function (p) { planetLayer.appendChild(p.g); });
  }

  function orbitFocus(area, count) {
    orbActive = area;
    orbitals.classList.toggle("is-all", area === "all");
    planets.forEach(function (p) {
      p.g.classList.toggle("is-on", p.id === area);
      p.g.classList.toggle("is-off", area !== "all" && p.id !== area);
    });
    var active = planets.filter(function (p) { return p.id === area; })[0];
    ringEls.forEach(function (r, i) { r.classList.toggle("is-on", !!active && active.ring === i); });
    orbNum.textContent = count;
    orbWord.textContent = plural(count);
    orbNum.classList.remove("tick"); void orbNum.offsetWidth; orbNum.classList.add("tick");
    orbBoost = 9; // a short whirl on every change
    if (reduced) placePlanets(1000);
  }

  var orbLast = 0;
  function orbLoop(t) {
    var dt = orbLast ? Math.min(64, t - orbLast) : 16;
    orbLast = t;
    orbBoost += (1 - orbBoost) * Math.min(1, dt * 0.003);
    placePlanets(dt);
    if (orbVisible && !reduced) requestAnimationFrame(orbLoop);
    else orbLast = 0;
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      var was = orbVisible;
      orbVisible = entries[0].isIntersecting;
      if (orbVisible && !was && !reduced) requestAnimationFrame(orbLoop);
    }).observe(orbitals);
  }
  orbitFocus("all", exItems.length);
  orbBoost = 1;
  placePlanets(0);

  /* ---------- FAQ ---------- */
  $("[data-faq]").innerHTML = DATA.faq.map(function (f) {
    return '<details class="qa"><summary>' + esc(f.q) + '<span class="hood__icon" aria-hidden="true"></span></summary><p>' + esc(f.a) + "</p></details>";
  }).join("");

  /* ---------- "Show on page" ---------- */
  $$("[data-point]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = $$(btn.dataset.point).filter(function (el) { return el.offsetParent !== null || getComputedStyle(el).position === "fixed"; })[0];
      if (!target) return;
      var fixed = getComputedStyle(target).position === "fixed" || target.closest(".header");
      if (!fixed) target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      target.classList.remove("is-pointed");
      setTimeout(function () { void target.offsetWidth; target.classList.add("is-pointed"); }, fixed ? 0 : 450);
      setTimeout(function () { target.classList.remove("is-pointed"); }, 3200);
    });
  });

  /* ---------- Reveal + active nav ---------- */
  function revealAll() { $$("[data-reveal], .products__grid .product").forEach(function (el) { el.classList.add("is-in"); }); }
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var sibs = el.parentElement ? $$(":scope > [data-reveal], :scope > .product", el.parentElement) : [];
        var idx = Math.max(0, sibs.indexOf(el));
        el.style.transitionDelay = Math.min(idx, 4) * 90 + "ms";
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    $$("[data-reveal], .products__grid .product").forEach(function (el) { io.observe(el); });

    var heroIO = new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      if (heroVisible) resume(); else { pause(); }
    }, { threshold: 0.25 });
    heroIO.observe(hero);
  } else {
    revealAll();
  }

  var navLinks = $$(".nav__list a");
  if ("IntersectionObserver" in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var href = "#" + en.target.id;
        navLinks.forEach(function (a) {
          if (en.isIntersecting) {
            if (a.getAttribute("href") === href) a.setAttribute("aria-current", "true");
            else a.removeAttribute("aria-current");
          } else if (a.getAttribute("href") === href) {
            a.removeAttribute("aria-current");
          }
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["products", "process", "examples", "faq"].forEach(function (id) { var el = document.getElementById(id); if (el) navIO.observe(el); });
  }

  /* ---------- Scroll-driven scenes ---------- */
  var wordsItems = $$("[data-words-list] li");
  var wordsSec = $(".words");
  var constellation = $("[data-constellation]");
  var shooting = $("[data-shooting]");
  var constLines = [];
  var finalBlob = $(".final__blob");
  var finalSec = $(".final");
  var ticking = false;

  function progressOf(el, startAt, endAt) {
    var r = el.getBoundingClientRect(), vh = window.innerHeight;
    return clamp((vh * startAt - r.top) / (vh * (startAt - endAt)), 0, 1);
  }

  function render() {
    ticking = false;
    var vh = window.innerHeight;
    header.classList.toggle("is-scrolled", window.scrollY > 20);

    if (reduced) return;

    // before -> after
    var p = progressOf(stage, 0.72, 0.18);
    var n = clamp(p / 0.7, 0, 1), ne = n * n;
    var a = clamp((p - 0.5) / 0.45, 0, 1), ae = 1 - Math.pow(1 - a, 3);
    var sc = clamp((stage.offsetWidth - 240) / 300, 0.3, 1);
    notes.forEach(function (el, i) {
      var x = +el.dataset.cx * sc * (1 - ne), y = +el.dataset.cy * (1 - ne), r = +el.dataset.cr * (1 - ne);
      el.style.setProperty("--x", x + "px");
      el.style.setProperty("--y", y + "px");
      el.style.setProperty("--r", r + "deg");
      el.style.opacity = String(1 - clamp((n - 0.55 - i * 0.04) / 0.3, 0, 1));
    });
    afterCard.style.setProperty("--s", String(0.75 + 0.25 * ae));
    afterCard.style.setProperty("--o", String(ae));

    // stacked words light up as stars and join into a constellation
    var lit = 0;
    wordsItems.forEach(function (li) {
      var on = li.getBoundingClientRect().top < vh * 0.66;
      li.classList.toggle("is-lit", on);
      if (on) lit++;
    });
    constLines.forEach(function (path, i) { path.classList.toggle("on", lit >= i + 2); });
    if (lit === wordsItems.length && !shootingDone) { shootingDone = true; shoot(); }

    // route
    if (routeLen) {
      var rp = progressOf(route, 0.62, 0.62 - route.offsetHeight / vh);
      line.style.strokeDashoffset = String(routeLen * (1 - rp));
      var pt = line.getPointAtLength(routeLen * rp);
      spark.style.transform = "translate(" + pt.x + "px," + pt.y + "px) rotate(" + rp * 360 + "deg)";
      steps.forEach(function (s, i) { s.classList.toggle("is-active", rp >= stepAt[i] - 0.02); });
    }

    // final blob grows
    var fp = progressOf(finalSec, 1, 0.2);
    finalBlob.style.setProperty("--grow", String(0.55 + fp * 0.55));
    finalBlob.style.setProperty("--turn", (fp * 14 - 7) + "deg");
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(render); } }

  /* ---------- Constellation + shooting star ---------- */
  var shootingDone = false;
  function shoot() {
    if (reduced || !shooting) return;
    shooting.classList.remove("go");
    void shooting.offsetWidth;
    shooting.style.top = (8 + Math.random() * 22) + "%";
    shooting.classList.add("go");
  }
  function buildConstellation() {
    var base = wordsSec.getBoundingClientRect();
    var pts = wordsItems.map(function (li) {
      var r = $(".cstar", li).getBoundingClientRect();
      return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 };
    });
    constellation.setAttribute("viewBox", "0 0 " + base.width + " " + base.height);
    var wasOn = constLines.map(function (p) { return p.classList.contains("on"); });
    constellation.innerHTML = "";
    constLines = [];
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      // a gentle bow between stars, like a hand-drawn constellation
      var mx = (a.x + b.x) / 2 + (i % 2 ? 40 : -40), my = (a.y + b.y) / 2;
      path.setAttribute("d", "M" + a.x + " " + a.y + " Q" + mx + " " + my + " " + b.x + " " + b.y);
      path.setAttribute("pathLength", "1");
      if (wasOn[i - 1] || reduced) path.classList.add("on");
      constellation.appendChild(path);
      constLines.push(path);
    }
  }

  /* ---------- Starry sky (canvas) ---------- */
  var skies = $$("canvas[data-sky]").map(function (canvas) {
    var deep = canvas.dataset.sky === "deep";
    return { canvas: canvas, ctx: canvas.getContext("2d"), deep: deep, host: canvas.parentElement, stars: [], w: 0, h: 0, visible: false };
  });
  var STAR_TINTS = ["255,248,236", "255,248,236", "255,248,236", "214,224,255", "255,226,196"];

  function seedSky(sky) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = sky.host.offsetWidth, h = sky.host.offsetHeight;
    if (!w || !h) return;
    sky.w = w; sky.h = h; sky.dpr = dpr;
    sky.canvas.width = Math.round(w * dpr);
    sky.canvas.height = Math.round(h * dpr);
    var count = Math.round(w * h * (sky.deep ? 0.00032 : 0.00009));
    count = Math.min(count, sky.deep ? 520 : 200);
    sky.stars = [];
    for (var i = 0; i < count; i++) {
      var depth = Math.pow(Math.random(), 1.6); // most stars are far away
      var bright = Math.random() < (sky.deep ? 0.05 : 0.035);
      sky.stars.push({
        x: Math.random(), y: Math.random(), d: depth,
        r: bright ? 1.1 + Math.random() * 0.9 : 0.35 + depth * 0.9,
        a: bright ? 0.9 : 0.25 + depth * 0.55,
        tw: 0.6 + Math.random() * 1.8, ph: Math.random() * 6.28,
        tint: STAR_TINTS[(Math.random() * STAR_TINTS.length) | 0], bright: bright,
      });
    }
  }

  function drawSky(sky, t) {
    var ctx = sky.ctx, w = sky.w, h = sky.h;
    if (!w) return;
    ctx.setTransform(sky.dpr, 0, 0, sky.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    // parallax: near stars drift faster than far ones as the section scrolls past
    var top = sky.host.getBoundingClientRect().top;
    var shift = reduced ? 0 : -top * (sky.deep ? 0.32 : 0.12);
    for (var i = 0; i < sky.stars.length; i++) {
      var s = sky.stars[i];
      var y = s.y * h + shift * (0.25 + s.d);
      y = ((y % h) + h) % h;
      var x = s.x * w;
      var alpha = reduced ? s.a : s.a * (0.65 + 0.35 * Math.sin(t * 0.001 * s.tw + s.ph));
      ctx.fillStyle = "rgba(" + s.tint + "," + alpha.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, 6.2832);
      ctx.fill();
      if (s.bright) {
        ctx.fillStyle = "rgba(" + s.tint + "," + (alpha * 0.18).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(x, y, s.r * 4, 0, 6.2832);
        ctx.fill();
        ctx.fillStyle = "rgba(" + s.tint + "," + (alpha * 0.5).toFixed(3) + ")";
        ctx.fillRect(x - s.r * 5, y - 0.4, s.r * 10, 0.8);
        ctx.fillRect(x - 0.4, y - s.r * 5, 0.8, s.r * 10);
      }
    }
  }

  var skyRunning = false;
  function skyLoop(t) {
    var any = false;
    skies.forEach(function (sky) { if (sky.visible) { any = true; drawSky(sky, t); } });
    if (any && !reduced) requestAnimationFrame(skyLoop);
    else skyRunning = false;
  }
  function startSky() {
    if (reduced) { skies.forEach(function (sky) { drawSky(sky, 0); }); return; }
    if (!skyRunning) { skyRunning = true; requestAnimationFrame(skyLoop); }
  }
  if ("IntersectionObserver" in window) {
    var skyIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var sky = skies.filter(function (s) { return s.host === en.target; })[0];
        if (sky) sky.visible = en.isIntersecting;
      });
      startSky();
    });
    skies.forEach(function (sky) { skyIO.observe(sky.host); });
  } else {
    skies.forEach(function (sky) { sky.visible = true; });
  }
  // an occasional shooting star while the night section is on screen
  setInterval(function () {
    var sky = skies.filter(function (s) { return s.deep; })[0];
    if (sky && sky.visible && shootingDone && !document.hidden) shoot();
  }, 11000);

  function applyReduced() {
    reduced = reduceMQ.matches;
    document.documentElement.classList.toggle("reduced", reduced);
    if (reduced) {
      stopAuto();
      revealAll();
      notes.forEach(function (el) { el.style.opacity = "0"; });
      afterCard.style.setProperty("--s", "1");
      afterCard.style.setProperty("--o", "1");
      wordsItems.forEach(function (li) { li.classList.add("is-lit"); });
      constLines.forEach(function (p) { p.classList.add("on"); });
      steps.forEach(function (s) { s.classList.add("is-active"); });
      if (routeLen) line.style.strokeDashoffset = "0";
      finalBlob.style.setProperty("--grow", "1");
    }
    render();
    startSky();
  }

  var lastW = 0;
  function onResize() {
    try { buildRoute(); } catch (e) { route.classList.add("no-route"); }
    buildConstellation();
    movePill();
    // mobile browsers fire resize when the toolbar hides; only reseed stars on width change
    if (window.innerWidth !== lastW || !skies.length || !skies[0].w) {
      lastW = window.innerWidth;
      skies.forEach(seedSky);
    } else {
      skies.forEach(function (sky) {
        if (sky.host.offsetHeight !== sky.h) seedSky(sky);
      });
    }
    if (reduced) startSky();
    onScroll();
  }

  /* ---------- Init ---------- */
  setScenario(0);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  reduceMQ.addEventListener("change", applyReduced);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
  window.addEventListener("load", onResize);
  onResize();
  applyReduced();
})();
