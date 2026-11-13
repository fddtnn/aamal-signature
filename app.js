/* Aamal Al Arab — Signature (standalone) */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var WA = "966596475546";
  var L = function () { return root.lang === "en" ? "en" : "ar"; };

  /* ---------- language ---------- */
  function setLang(lang, save) {
    root.lang = lang; root.dir = lang === "ar" ? "rtl" : "ltr";
    if (save) { try { localStorage.setItem("aa5-lang", lang); } catch (e) {} }
    var t = $("[data-ar-title]"); if (t) document.title = t.getAttribute("data-" + lang + "-title");
    $$("[data-ar-alt]").forEach(function (el) { el.alt = el.getAttribute("data-" + lang + "-alt"); });
    $$("[data-ar-aria]").forEach(function (el) { el.setAttribute("aria-label", el.getAttribute("data-" + lang + "-aria")); });
    if (window.ScrollTrigger) setTimeout(function () { window.ScrollTrigger.refresh(); }, 60);
  }
  $(".nav__lang").addEventListener("click", function () { setLang(L() === "ar" ? "en" : "ar", true); });

  /* ---------- nav ---------- */
  var nav = $(".nav");
  function onScroll() { nav.classList.toggle("is-solid", window.scrollY > window.innerHeight * 1.6); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href"), el = id === "#top" ? document.body : $(id);
      if (!el) return; e.preventDefault();
      if (window.__lenis) window.__lenis.scrollTo(el === document.body ? 0 : el, { offset: 0 });
      else window.scrollTo({ top: el === document.body ? 0 : el.getBoundingClientRect().top + scrollY, behavior: reduce ? "auto" : "smooth" });
    });
  });

  /* ---------- contact -> WhatsApp ---------- */
  var form = $(".contact form");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var first = null, ar = L() === "ar";
    $$("[required]", form).forEach(function (el) {
      var v = el.value.trim(), bad = !v || (el.type === "tel" && v.replace(/\D/g, "").length < 9);
      el.setAttribute("aria-invalid", String(bad));
      var er = el.parentElement.querySelector(".err"); if (er) er.textContent = bad ? (ar ? "هذا الحقل مطلوب بشكل صحيح" : "Please complete this field correctly") : "";
      if (bad && !first) first = el;
    });
    if (first) { first.focus(); return; }
    var f = form.elements;
    var rows = ar
      ? ["السلام عليكم، طلب استشارة من موقع أعمال العرب:", "", "الاسم: " + f.name.value.trim(), "الجوال: " + f.phone.value.trim(), "", "المشروع:", f.message.value.trim()]
      : ["Hello, a consultation request from the Aamal Al Arab website:", "", "Name: " + f.name.value.trim(), "Mobile: " + f.phone.value.trim(), "", "Project:", f.message.value.trim()];
    var url = "https://wa.me/" + WA + "?text=" + encodeURIComponent(rows.join("\n"));
    if (window.matchMedia("(pointer: coarse)").matches) location.href = url; else window.open(url, "_blank", "noopener");
    $(".ok", form).classList.add("is-on");
    window.AA_LAST_WA = url;
  });

  setLang(L(), false);

  if (reduce || !window.gsap) {
    // still version: a single-screen keyhole that is already open
    var kh = $(".kh"); kh.style.height = "100svh";
    $(".kh__full").style.opacity = 1; $(".kh__shade").style.opacity = 1; $(".kh__after").style.opacity = 1;
    $(".kh__brand").style.display = "none"; $(".kh__hint").style.display = "none";
    return;
  }

  /* ---------- motion ---------- */
  root.classList.add("js");
  var gsap = window.gsap; gsap.registerPlugin(window.ScrollTrigger); var ST = window.ScrollTrigger;
  if (window.Lenis) {
    var lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
    window.__lenis = lenis; lenis.on("scroll", ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); }); gsap.ticker.lagSmoothing(0);
  }

  // 1) keyhole: intro, then on scroll it grows, the reeded glass clears and the view opens
  var mask = $(".kh__mask");
  var startSize = function () { return Math.min(window.innerHeight * 0.3, 210); };
  gsap.timeline({ defaults: { ease: "power3.out" } })
    .from(mask, { opacity: 0, scale: 0.9, duration: 1.6 })
    .from(".kh__brand > *", { y: 20, opacity: 0, duration: 1, stagger: 0.15 }, 0.5)
    .from(".nav", { opacity: 0, y: -16, duration: 1 }, 0.8)
    .from(".kh__hint", { opacity: 0, duration: 1 }, 1.2);
  var kt = gsap.timeline({ scrollTrigger: { trigger: ".kh", start: "top top", end: "bottom bottom", scrub: 0.6 } });
  kt.to(".kh__brand, .kh__hint", { opacity: 0, y: -20, duration: 0.12, ease: "none" }, 0)
    .fromTo(mask, { "--ks": startSize() + "px" }, { "--ks": Math.max(window.innerWidth, window.innerHeight) * 7 + "px", duration: 0.7, ease: "power2.in" }, 0.05)
    .to(".kh__mask .kh__flute", { opacity: 0, duration: 0.35, ease: "none" }, 0.3)
    .to(".kh__full", { opacity: 1, duration: 0.15, ease: "none" }, 0.62)
    .to(".kh__shade", { opacity: 1, duration: 0.2, ease: "none" }, 0.7)
    .fromTo(".kh__after", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }, 0.78);

  // 2) the book: folded pages open flat while the strip slides across
  var mmq = gsap.matchMedia();
  mmq.add("(min-width: 961px)", function () {
    var strip = $(".book__strip"), leaves = $$(".leaf", strip), n = leaves.length;
    var countEl = $(".book__count b"), barEl = $(".book__bar i");
    var state = { p: 0 };
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    function render() {
      var p = state.p;
      // phase 1 (0 → 0.3): the pages unfold in place, all of them still on screen
      var unfold = clamp(p / 0.3, 0, 1), ang = 72 * (1 - unfold), rad = ang * Math.PI / 180;
      var w = leaves[0].offsetWidth, pw = w * Math.cos(rad), shrink = w - pw;
      leaves.forEach(function (lf, i) {
        var dir = i % 2 === 0 ? -1 : 1;
        lf.style.transform = "translateX(" + (-shrink * i) + "px) rotateY(" + (dir * ang) + "deg)";
      });
      // phase 2 (0.2 → 1): the page being read is kept in the middle of the screen, first to last,
      // and the strip never slides past its own ends, so every page is fully seen at some point
      var vw = window.innerWidth, pad = parseFloat(getComputedStyle(strip).paddingLeft) || 0, margin = vw * 0.05;
      var total = n * pw;
      var pan = clamp((p - 0.2) / 0.8, 0, 1);
      var focus = 0.5 + pan * (n - 1);
      var x;
      if (total <= vw - margin * 2) x = (vw - total) / 2 - pad;
      else x = clamp(vw / 2 - (pad + focus * pw), vw - margin - (pad + total), margin - pad);
      strip.style.transform = "translateX(" + x + "px)";
      var cur = clamp(Math.round(focus - 0.5), 0, n - 1);
      if (countEl) countEl.textContent = String(cur + 1).padStart(2, "0");
      if (barEl) barEl.style.transform = "scaleX(" + p + ")";
      leaves.forEach(function (lf, i) { lf.classList.toggle("is-focus", unfold === 1 && i === cur); });
    }
    render();
    var tw = gsap.to(state, { p: 1, ease: "none", onUpdate: render, scrollTrigger: { trigger: ".book", start: "top top", end: "bottom bottom", scrub: 0.8 } });
    window.addEventListener("resize", render);
    return function () { tw.kill(); window.removeEventListener("resize", render); leaves.forEach(function (lf) { lf.style.transform = ""; }); strip.style.transform = ""; };
  });

  // 3) timeline line fills as you read
  gsap.fromTo(".tl__fill", { height: 0 }, { height: "calc(100% - 16px)", ease: "none", scrollTrigger: { trigger: ".tl", start: "top 70%", end: "bottom 70%", scrub: true } });

  // 4) reveals + counters + poster parallax
  $$("[data-up]").forEach(function (el) { gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } }); });
  $$("[data-count]").forEach(function (el) {
    var o = { v: 0 }, end = +el.dataset.count;
    gsap.to(o, { v: end, duration: 1.4, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 90%" }, onUpdate: function () { el.textContent = Math.round(o.v); } });
  });
  $$(".proj__img img, .about__img img").forEach(function (img) {
    gsap.fromTo(img, { yPercent: -5, scale: 1.1 }, { yPercent: 5, scale: 1.1, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
  });
})();
