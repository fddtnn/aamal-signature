/* Aamal Al Arab — Signature: projects (featured reveal, gallery filter, lightbox) */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var L = function () { return root.lang === "en" ? "en" : "ar"; };

  var frames = $$(".feat__frame"), n = frames.length;
  var countEl = $(".feat__count b"), capEl = $(".feat__cap"), dots = $$(".feat__dots i");
  function frameCap(i) { var c = $('figcaption [data-l="' + L() + '"]', frames[i]); return c ? c.textContent : ""; }
  var curFrame = -1;
  function setFrame(i) {
    if (i === curFrame) return; curFrame = i;
    countEl.textContent = String(i + 1).padStart(2, "0");
    capEl.textContent = frameCap(i);
    dots.forEach(function (d, k) { d.classList.toggle("is-on", k === i); });
  }
  setFrame(0);

  /* ---------- lightbox ---------- */
  var lb = $(".lb"), lbImg = $(".lb__fig img"), lbCap = $(".lb__cap"), lbN = $(".lb__n");
  var list = [], idx = 0, lastFocus = null;
  function show(i) {
    idx = (i + list.length) % list.length;
    var it = list[idx];
    lbImg.classList.add("is-swap");
    var img = new Image();
    img.onload = img.onerror = function () { lbImg.src = it.src; lbImg.alt = it.cap(); lbImg.classList.remove("is-swap"); };
    img.src = it.src;
    lbCap.textContent = it.cap();
    lbN.textContent = String(idx + 1).padStart(2, "0") + " / " + String(list.length).padStart(2, "0");
  }
  function open(items, i) {
    list = items; lastFocus = document.activeElement;
    lb.hidden = false; requestAnimationFrame(function () { lb.classList.add("is-open"); });
    if (window.__lenis) window.__lenis.stop();
    document.body.style.overflow = "hidden";
    show(i); $(".lb__close").focus();
  }
  function close() {
    lb.classList.remove("is-open");
    setTimeout(function () { lb.hidden = true; }, 300);
    if (window.__lenis) window.__lenis.start();
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  var next = function () { show(idx + 1); }, prev = function () { show(idx - 1); };
  $(".lb__close").addEventListener("click", close);
  $(".lb__next").addEventListener("click", next);
  $(".lb__prev").addEventListener("click", prev);
  lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    var rtl = root.dir === "rtl";
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") rtl ? prev() : next();
    else if (e.key === "ArrowLeft") rtl ? next() : prev();
    else if (e.key === "Tab") { // keep focus inside the dialog
      var f = $$("button", lb), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  var sx = 0;
  lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) < 50) return;
    var forward = root.dir === "rtl" ? dx > 0 : dx < 0; forward ? next() : prev();
  }, { passive: true });

  var featItems = frames.map(function (f, i) { return { src: $("img", f).getAttribute("src"), cap: function () { return frameCap(i); } }; });
  $(".feat__open").addEventListener("click", function () { open(featItems, Math.max(0, curFrame)); });
  frames.forEach(function (f, i) { f.style.cursor = "zoom-in"; f.addEventListener("click", function () { open(featItems, i); }); });

  /* ---------- gallery filter ---------- */
  var gItems = $$(".gitem");
  function galList() {
    return gItems.filter(function (g) { return !g.classList.contains("is-out"); }).map(function (g) {
      return { el: g, src: g.dataset.full, cap: function () { return g.getAttribute("data-cap-" + L()); } };
    });
  }
  gItems.forEach(function (g) {
    g.addEventListener("click", function () { var l = galList(); open(l, l.findIndex(function (x) { return x.el === g; })); });
  });
  $$(".gal__filters button").forEach(function (b) {
    b.addEventListener("click", function () {
      $$(".gal__filters button").forEach(function (x) { x.classList.toggle("is-on", x === b); x.setAttribute("aria-pressed", String(x === b)); });
      var f = b.dataset.f;
      var apply = function () { gItems.forEach(function (g) { g.classList.toggle("is-out", f !== "all" && g.dataset.cat !== f); }); if (window.ScrollTrigger) window.ScrollTrigger.refresh(); };
      if (window.gsap && !reduce) {
        window.gsap.to(gItems, { opacity: 0, y: 14, duration: 0.2, onComplete: function () {
          apply(); window.gsap.fromTo(gItems.filter(function (g) { return !g.classList.contains("is-out"); }), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.05, ease: "power3.out" });
        } });
      } else apply();
    });
  });
  $(".nav__lang").addEventListener("click", function () { var c = curFrame; curFrame = -1; setFrame(Math.max(0, c)); });

  /* ---------- mobile swipe strip: keep the counter in sync ---------- */
  var strip = $(".feat__frames");
  strip.addEventListener("scroll", function () {
    if (window.innerWidth > 960) return;
    var mid = strip.getBoundingClientRect().left + strip.clientWidth / 2, best = 0, bd = 1e9;
    frames.forEach(function (f, i) { var r = f.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid); if (d < bd) { bd = d; best = i; } });
    setFrame(best);
  }, { passive: true });

  if (reduce || !window.gsap) return;

  /* ---------- desktop: pinned stage, each photo wipes in over the last ---------- */
  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.matchMedia().add("(min-width: 961px)", function () {
    var rtl = root.dir === "rtl";
    var hidden = rtl ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)";
    frames.forEach(function (f, i) { if (i) gsap.set(f, { clipPath: hidden }); });
    var tl = gsap.timeline({ scrollTrigger: { trigger: ".feat", start: "top top", end: "bottom bottom", scrub: 0.7,
      onUpdate: function (s) { setFrame(Math.min(n - 1, Math.floor(s.progress * n * 0.999 + 0.15))); } } });
    tl.fromTo($("img", frames[0]), { scale: 1.12 }, { scale: 1, duration: 1, ease: "none" }, 0);
    for (var i = 1; i < n; i++) {
      tl.fromTo(frames[i], { clipPath: hidden }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power2.inOut" }, i - 0.6)
        .fromTo($("img", frames[i]), { scale: 1.25 }, { scale: 1, duration: 1.6, ease: "none" }, i - 0.6);
    }
    gsap.from(".feat__text > *", { y: 30, opacity: 0, duration: 1, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: ".feat", start: "top 70%" } });
    return function () { tl.kill(); frames.forEach(function (f) { f.style.clipPath = ""; }); };
  });
  gsap.from(gItems, { opacity: 0, y: 40, duration: 1, stagger: 0.07, ease: "power3.out", scrollTrigger: { trigger: ".gal__grid", start: "top 80%" } });
})();
