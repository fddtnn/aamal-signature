/* Aamal Al Arab — customer FAQ assistant (client-side, AR/EN)
   Answers only from the facts below; anything else is handed to WhatsApp.
   Optional: set window.AA_CHAT_ENDPOINT to a backend URL (e.g. a Cloudflare Worker
   calling an LLM) and unmatched questions are sent there first. */
(function () {
  "use strict";
  var WA = "966596475546";
  var root = document.documentElement;
  var lang = function () { return root.lang === "en" ? "en" : "ar"; };

  /* ---------- knowledge base ---------- */
  // each intent: keywords (normalised, any language), answer {ar,en}, optional actions
  var A = {
    services: { ar: "خدماتنا", en: "Our services", href: "#book" },
    book: { ar: "احجز استشارة مجانية", en: "Book a free consultation", href: "#contact" },
    work: { ar: "شاهد أعمالنا", en: "See our work", href: "#projects" },
    products: { ar: "منتجاتنا", en: "Our products", href: "#book" },
    contact: { ar: "صفحة التواصل", en: "Contact page", href: "#contact" },
    call: { ar: "اتصل بنا", en: "Call us", href: "tel:+966596475546" },
    wa: { ar: "كلّمنا واتساب", en: "WhatsApp us", wa: true },
    design: { ar: "التصميم الداخلي", en: "Interior design", href: "#book" },
    bespoke: { ar: "التفصيل", en: "Bespoke", href: "#book" },
    care: { ar: "الصيانة", en: "Care", href: "#book" },
    map: { ar: "افتح الخريطة", en: "Open map", href: "https://www.openstreetmap.org/?mlat=24.695&mlon=46.68#map=15/24.695/46.68", ext: true }
  };

  var KB = [
    { id: "greet", k: ["مرحبا", "السلام", "هلا", "اهلا", "صباح", "مساء", "hi", "hello", "hey", "salam"],
      ar: "هلا والله! أنا مساعد أعمال العرب. أقدر أجاوبك عن خدماتنا، الاستشارة المجانية، الستائر والأثاث، الصيانة، والتواصل. وش حاب تعرف؟",
      en: "Hello! I'm the Aamal Al Arab assistant. I can help with our services, the free consultation, curtains and furniture, care and contact details. What would you like to know?",
      chips: ["services", "consult", "price", "contact"] },
    { id: "services", k: ["خدمات", "خدماتكم", "وش تسوون", "تقدمون", "وش عندكم", "services", "offer", "what do you do"],
      ar: "نقدّم أربع خدمات تشتغل مع بعض:\n• التصميم الداخلي: مخططات وتصاميم ثلاثية الأبعاد ومقترحات مواد.\n• تفصيل الأثاث والستائر على المقاس في مشاغلنا.\n• الصيانة والعناية: تنجيد وتنظيف وإصلاح.\n• الاستشارات، وأول استشارة مجانية.\nتقدر تطلب خدمة وحدة أو نتولى المشروع كامل.",
      en: "We offer four services that work together:\n• Interior design: drawings, 3D visuals and material proposals.\n• Bespoke furniture and curtains, made to measure in our workshops.\n• Care and maintenance: reupholstery, cleaning and repair.\n• Consultation — the first one is free.\nTake one service or let us run the whole project.",
      actions: ["services", "book"] },
    { id: "design", k: ["تصميم", "ديكور", "مخطط", "ثلاثي", "3d", "ثري دي", "مهندس", "design", "decor", "render", "layout"],
      ar: "في التصميم الداخلي نسوي لك مخططات تنفيذية وتوزيع أثاث، وتصاميم ثلاثية الأبعاد تشوف فيها بيتك قبل التنفيذ، ولوحات مواد وألوان وإضاءة، ونشرف على التنفيذ.",
      en: "Our interior design covers working drawings and furniture layouts, photoreal 3D visuals so you see the room before it's built, material, colour and lighting boards, and site supervision.",
      actions: ["design", "book"] },
    { id: "curtains", k: ["ستاره", "ستائر", "ستارة", "برادي", "بلاك", "بلاك اوت", "شيفون", "كتان", "مخمل", "سكك", "محرك", "كهربائ", "curtain", "drape", "blind", "blackout", "sheer", "motor"],
      ar: "نفصّل الستائر على مقاس نوافذك: كتان، مخمل، شيفون، وبلاك أوت، مع سكك وتشغيل كهربائي أو ذكي. ونجيب لك العينات للبيت تختار منها.",
      en: "We make curtains to your exact window size: linen, velvet, sheer and blackout, with tracks and motorised or smart-home control. We bring the samples to your home so you can choose.",
      actions: ["bespoke", "book"] },
    { id: "furniture", k: ["اثاث", "كنب", "كنبه", "مجلس", "مجالس", "جلسه", "جلسات", "طاوله", "سرير", "خزانه", "خزائن", "تفصيل", "furniture", "sofa", "majlis", "table", "bed", "wardrobe", "bespoke", "custom"],
      ar: "نفصّل الأثاث على مقاس مساحتك في مشاغلنا: كنب بإطارات خشب صلب وتنجيد يدوي، مجالس عربية وجلسات أرضية ومساند، طاولات طعام (جوز، رخام، نحاس)، وأسرّة منجّدة وخزائن مدمجة.",
      en: "We build furniture to fit your space in our workshops: solid-wood sofas with hand upholstery, Arabic majlis and floor seating, dining tables (walnut, marble, brass), upholstered beds and built-in wardrobes.",
      actions: ["products", "book"] },
    { id: "care", p: 2, k: ["اصلح", "يصلح", "تصلحون", "صيانه", "صيانة", "تنجيد", "تنظيف", "غسيل", "اصلاح", "تصليح", "خربان", "قديم", "تجديد", "maintenance", "repair", "clean", "reupholster", "fix", "restore"],
      ar: "نسوي صيانة للأثاث والستائر والمفروشات الكبيرة، حتى لو ما صنعناها نحن: إعادة تنجيد وتغيير أقمشة، تنظيف عميق للستائر والكنب، إصلاح الإطارات والسكك والمحركات، وعقود صيانة دورية.",
      en: "We maintain furniture, curtains and large furnishings — even pieces we didn't make: reupholstery and re-covering, deep cleaning, frame, track and motor repair, and scheduled care contracts.",
      actions: ["care", "wa"] },
    { id: "consult", p: 1, k: ["تقيسون", "تقيس", "يقيس", "تجون", "استشاره", "استشارة", "زياره", "زيارة", "مجان", "ببلاش", "معاينه", "معاينة", "قياس", "مقاس", "consult", "free", "visit", "measure", "inspection"],
      ar: "أول استشارة مجانية. يزورك مهندس تصميم، يقيس المساحة، يساعدك تختار المواد والأقمشة والألوان، ويعطيك خطة وميزانية تقريبية وجدول زمني. ونقدر نسويها عن بُعد بالفيديو بعد.",
      en: "Your first consultation is free. A design engineer visits, measures the space, helps you choose materials, fabrics and colours, and gives you a plan with a budget outline and timeline. We can also do it by video call.",
      actions: ["book", "wa"] },
    { id: "price", p: 2, k: ["سعر", "اسعار", "أسعار", "كم", "تكلفه", "تكلفة", "بكم", "ميزانيه", "ميزانية", "غالي", "رخيص", "عرض سعر", "price", "cost", "how much", "budget", "quote", "expensive"],
      ar: "السعر يعتمد على المساحة والخامات ونوع الشغل، عشان كذا ما نحط أسعار ثابتة. في الاستشارة المجانية نقيس ونعطيك تصور أولي للتكلفة قبل ما تلتزم بشي.",
      en: "Pricing depends on the space, materials and type of work, so we don't publish fixed prices. In the free consultation we measure and give you a first cost outline before you commit to anything.",
      actions: ["book", "wa"] },
    { id: "time", p: 1, k: ["مده", "مدة", "متى", "كم ياخذ", "كم يوم", "اسبوع", "اسابيع", "وقت", "يخلص", "تسليم", "how long", "time", "timeline", "duration", "deliver", "weeks"],
      ar: "المدة تختلف حسب حجم المشروع ونوعه. في الاستشارة نعطيك جدول زمني واضح لمشروعك.",
      en: "It depends on the size and type of project. In the consultation we give you a clear timeline for your project.",
      actions: ["book"] },
    { id: "process", k: ["خطوات", "طريقه", "طريقة", "كيف تشتغلون", "كيف اطلب", "مراحل", "process", "steps", "how does it work", "how do you work"],
      ar: "نشتغل بأربع خطوات وجهة تواصل وحدة:\n١. الاستشارة: نزورك ونقيس.\n٢. التصميم: مخططات وعينات بين يديك.\n٣. التفصيل: في مشاغلنا بإشراف مهندسينا.\n٤. التركيب والعناية: تركيب نظيف وصيانة بعد التسليم.",
      en: "Four steps, one point of contact:\n1. Consult: we visit and measure.\n2. Design: plans and samples in your hands.\n3. Make: in our workshops, by our engineers.\n4. Install & care: clean installation and aftercare.",
      actions: ["book"] },
    { id: "samples", k: ["عينه", "عينات", "عينة", "اقمشه", "أقمشة", "قماش", "معرض", "sample", "fabric", "showroom", "swatch"],
      ar: "نجيب لك عينات الأقمشة والخامات للبيت تختار منها براحتك، وتقدر بعد تزورنا في العليا وتشوفها على الطبيعة.",
      en: "We bring fabric and material samples to your home, and you're also welcome to see them in person at our place in Al Olaya.",
      actions: ["book", "map"] },
    { id: "location", k: ["وين", "موقع", "عنوان", "مكان", "العليا", "فرع", "location", "address", "where", "branch", "olaya"],
      ar: "موقعنا: ٤٠٣٤ حي العليا، الرياض — ص.ب ٦٦٨٠، الرياض ١١٤٥٢.",
      en: "We're at 4034 Al Olaya, Riyadh — P.O. Box 6680, Riyadh 11452.",
      actions: ["map", "wa"] },
    { id: "area", k: ["مدينه", "مدينة", "جده", "جدة", "الدمام", "الخبر", "مكه", "المدينه", "خارج الرياض", "تخدمون", "مناطق", "city", "jeddah", "dammam", "outside riyadh", "areas", "serve"],
      ar: "مقرنا في الرياض ونخدم الرياض وما حولها (اشتغلنا مثلاً في الدرعية). إذا مشروعك في مدينة ثانية كلّمنا واتساب ونشوف معك.",
      en: "We're based in Riyadh and serve Riyadh and its surroundings (Diriyah, for example). If your project is in another city, message us on WhatsApp and we'll see what we can do.",
      actions: ["wa"] },
    { id: "contact", k: ["تواصل", "اتصال", "رقم", "جوال", "هاتف", "واتس", "واتساب", "فاكس", "كلم", "contact", "phone", "number", "whatsapp", "call", "fax", "reach"],
      ar: "تقدر توصل لنا على:\n• جوال / واتساب: 0596475546\n• هاتف: 0112164422\n• فاكس: 0114625058\n• العنوان: ٤٠٣٤ حي العليا، الرياض",
      en: "You can reach us on:\n• Mobile / WhatsApp: +966 59 647 5546\n• Phone: +966 11 216 4422\n• Fax: +966 11 462 5058\n• Address: 4034 Al Olaya, Riyadh",
      actions: ["wa", "call"] },
    { id: "sectors", k: ["فيلا", "فلل", "بيت", "شقه", "شقة", "مكتب", "مكاتب", "فندق", "فنادق", "مطعم", "شركه", "شركة", "قصر", "villa", "home", "apartment", "office", "hotel", "restaurant", "company", "palace"],
      ar: "نشتغل على فلل وبيوت، مجالس وقصور، مكاتب تنفيذية، وفنادق ومطاعم. تقدر تشوف نماذج من شغلنا في صفحة أعمالنا.",
      en: "We work on villas and homes, majlis and palaces, executive offices, and hotels and restaurants. See examples on our work page.",
      actions: ["work", "book"] },
    { id: "work", p: 1, k: ["اشوف شغل", "شغل", "اعمال", "أعمال", "مشاريع", "صور", "نماذج", "شغلكم", "بورتفوليو", "portfolio", "projects", "work", "examples", "photos"],
      ar: "من مشاريعنا: فيلا الملقا، مجلس حطين، مكتب العليا التنفيذي، جناح النخيل، وبهو فندق في الدرعية. كلها معروضة في صفحة أعمالنا.",
      en: "Some of our projects: Al Malqa Villa, Hittin Majlis, the Olaya executive office, Al Nakheel suite and a hotel lobby in Diriyah — all on our work page.",
      actions: ["work"] },
    { id: "unknown_policy", p: 3, k: ["تفتحون", "تقفلون", "ضمان", "كفاله", "كفالة", "دفع", "تقسيط", "تابي", "تمارا", "دفعه", "دفعة", "عربون", "دوام", "ساعات", "تفتحون", "مفتوح", "warranty", "guarantee", "payment", "installment", "deposit", "hours", "open"],
      ar: "هذي التفاصيل يأكدها لك فريقنا مباشرة عشان تكون دقيقة. كلّمنا واتساب ونرد عليك.",
      en: "Our team will confirm that for you directly so it's accurate. Message us on WhatsApp and we'll get back to you.",
      actions: ["wa", "call"] },
    { id: "book", p: 1, k: ["احجز", "حجز", "موعد", "ابغى ابدا", "ابي ابدا", "طلب", "book", "appointment", "start", "order"],
      ar: "حيّاك! احجز استشارتك المجانية من صفحة التواصل، أو كلّمنا واتساب مباشرة.",
      en: "Great! Book your free consultation on the contact page, or message us on WhatsApp.",
      actions: ["book", "wa"] },
    { id: "thanks", k: ["شكرا", "مشكور", "يعطيك العافيه", "تسلم", "thanks", "thank you", "thx"],
      ar: "العفو! إذا احتجت أي شي ثاني أنا موجود.", en: "You're welcome! I'm here if you need anything else.",
      chips: ["services", "consult", "contact"] }
  ];
  var CHIP_LABEL = {
    services: { ar: "وش خدماتكم؟", en: "Your services?" },
    consult: { ar: "الاستشارة المجانية", en: "Free consultation" },
    price: { ar: "كم الأسعار؟", en: "Prices?" },
    curtains: { ar: "الستائر", en: "Curtains" },
    care: { ar: "الصيانة", en: "Maintenance" },
    location: { ar: "وين موقعكم؟", en: "Where are you?" },
    contact: { ar: "أرقام التواصل", en: "Contact numbers" },
    time: { ar: "كم مدة التنفيذ؟", en: "How long?" }
  };

  /* ---------- matching ---------- */
  function norm(s) {
    return (s || "").toLowerCase()
      .replace(/[ً-ٰٟـ]/g, "")   // tashkeel + tatweel
      .replace(/[إأآا]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي")
      .replace(/[^؀-ۿa-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  }
  KB.forEach(function (it) { it.nk = it.k.map(norm).filter(function (k, i, a) { return a.indexOf(k) === i; }); }); // dedupe after normalising
  function match(q) {
    var n = " " + norm(q) + " ";
    var best = null, bestScore = 0;
    KB.forEach(function (it) {
      var score = 0;
      it.nk.forEach(function (k) {
        if (!k) return;
        var w = k.split(" ").length;                                  // longer phrases beat single words
        if (n.indexOf(" " + k + " ") > -1) score += 2 + w;            // whole word / phrase
        else if (k.length > 2 && n.indexOf(k) > -1) score += 1 + w;   // stem / part of word
      });
      if (score && it.p) score += it.p;                           // intent (price, repair…) beats topic (curtains…)
      if (it.id === "greet" && score) score -= 1;               // prefer a real question over a greeting
      if (score > bestScore) { bestScore = score; best = it; }
    });
    return bestScore >= 2 ? best : null;
  }

  /* ---------- UI ---------- */
  function t(o) { return o[lang()]; }
  var launcher = document.createElement("button");
  launcher.className = "chat-launch";
  launcher.type = "button";
  launcher.setAttribute("aria-expanded", "false");
  launcher.setAttribute("aria-controls", "aa-chat");
  launcher.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg>' +
    '<span class="chat-launch__label"><span data-l="ar">اسألنا</span><span data-l="en">Ask us</span></span>';

  var panel = document.createElement("section");
  panel.className = "chat";
  panel.id = "aa-chat";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.hidden = true;
  panel.innerHTML =
    '<header class="chat__head">' +
      '<span class="chat__avatar"><img src="assets/brand/logo-mark-color.png" alt=""></span>' +
      '<div><b><span data-l="ar">مساعد أعمال العرب</span><span data-l="en">Aamal Al Arab assistant</span></b>' +
      '<small><i></i><span data-l="ar">يرد فوراً · فريقنا على الواتساب</span><span data-l="en">Instant answers · our team on WhatsApp</span></small></div>' +
      '<button class="chat__close" type="button" data-ar-aria="إغلاق المحادثة" data-en-aria="Close chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
    "</header>" +
    '<div class="chat__log" role="log" aria-live="polite" data-lenis-prevent></div>' +
    '<div class="chat__chips"></div>' +
    '<form class="chat__form" autocomplete="off">' +
      '<label class="sr-only" for="aa-chat-in"><span data-l="ar">اكتب سؤالك</span><span data-l="en">Type your question</span></label>' +
      '<input id="aa-chat-in" type="text" maxlength="300" data-ar-ph="اكتب سؤالك…" data-en-ph="Type your question…" placeholder="اكتب سؤالك…">' +
      '<button type="submit" data-ar-aria="إرسال" data-en-aria="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>' +
    "</form>";
  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  var log = panel.querySelector(".chat__log");
  var chipsBox = panel.querySelector(".chat__chips");
  var input = panel.querySelector("input");
  var lastQ = "";

  function syncLangAttrs() {
    var l = lang();
    panel.querySelectorAll("[data-ar-aria]").forEach(function (el) { el.setAttribute("aria-label", el.getAttribute("data-" + l + "-aria")); });
    input.placeholder = input.getAttribute("data-" + l + "-ph");
    panel.setAttribute("aria-label", l === "ar" ? "مساعد أعمال العرب" : "Aamal Al Arab assistant");
    launcher.setAttribute("aria-label", l === "ar" ? "افتح مساعد الأسئلة" : "Open the help assistant");
  }
  new MutationObserver(syncLangAttrs).observe(root, { attributes: true, attributeFilter: ["lang"] });
  syncLangAttrs();

  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function waHref(q) {
    var msg = lang() === "ar" ? "السلام عليكم، عندي استفسار" + (q ? ": " + q : "") : "Hello, I have a question" + (q ? ": " + q : "");
    return "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg);
  }
  function bubble(who, html) {
    var b = document.createElement("div");
    b.className = "msg msg--" + who;
    b.innerHTML = html;
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
    return b;
  }
  function both(ar, en) { return '<span data-l="ar">' + ar + '</span><span data-l="en">' + en + "</span>"; }
  function actionsHtml(list) {
    if (!list || !list.length) return "";
    return '<div class="msg__acts">' + list.map(function (key) {
      var a = A[key];
      var href = a.wa ? waHref(lastQ) : a.href;
      var ext = a.wa || a.ext ? ' target="_blank" rel="noopener"' : "";
      return '<a class="msg__act' + (a.wa ? " msg__act--wa" : "") + '" href="' + href + '"' + ext + ">" + both(a.ar, a.en) + "</a>";
    }).join("") + "</div>";
  }
  function setChips(ids) {
    chipsBox.innerHTML = (ids || []).map(function (id) {
      return '<button type="button" data-q="' + id + '">' + both(CHIP_LABEL[id].ar, CHIP_LABEL[id].en) + "</button>";
    }).join("");
  }
  function answer(it) {
    var text = function (s) { return esc(s).replace(/\n/g, "<br>"); };
    var typing = bubble("bot", '<span class="dots"><i></i><i></i><i></i></span>');
    setTimeout(function () {
      typing.innerHTML = both(text(it.ar), text(it.en)) + actionsHtml(it.actions);
      log.scrollTop = log.scrollHeight;
      setChips(it.chips || ["consult", "price", "contact"].filter(function (c) { return c !== it.id; }));
    }, 450 + Math.min(700, it.ar.length * 3));
  }
  function fallback() {
    answer({ id: "fallback",
      ar: "ما قدرت أفهم سؤالك تماماً. فريقنا يقدر يجاوبك مباشرة على الواتساب، أو اختر من المواضيع تحت.",
      en: "I couldn't quite understand that. Our team can answer you directly on WhatsApp, or pick a topic below.",
      actions: ["wa", "call"], chips: ["services", "consult", "price", "location"] });
  }
  function ask(q) {
    q = (q || "").trim();
    if (!q) return;
    lastQ = q;
    bubble("me", esc(q));
    var it = match(q);
    if (it) return answer(it);
    if (window.AA_CHAT_ENDPOINT) {
      var typing = bubble("bot", '<span class="dots"><i></i><i></i><i></i></span>');
      fetch(window.AA_CHAT_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: q, lang: lang() }) })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function (d) { typing.remove(); answer({ id: "ai", ar: d.answer, en: d.answer, actions: ["book", "wa"] }); })
        .catch(function () { typing.remove(); fallback(); });
      return;
    }
    fallback();
  }

  var greeted = false;
  function open() {
    panel.hidden = false;
    requestAnimationFrame(function () { panel.classList.add("is-open"); });
    launcher.setAttribute("aria-expanded", "true");
    launcher.classList.add("is-hidden");
    if (!greeted) { greeted = true; answer(KB[0]); }
    setTimeout(function () { input.focus({ preventScroll: true }); }, 250);
  }
  function close() {
    panel.classList.remove("is-open");
    launcher.setAttribute("aria-expanded", "false");
    launcher.classList.remove("is-hidden");
    setTimeout(function () { panel.hidden = true; }, 260);
    launcher.focus({ preventScroll: true });
  }
  launcher.addEventListener("click", open);
  panel.querySelector(".chat__close").addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) close(); });
  panel.querySelector(".chat__form").addEventListener("submit", function (e) { e.preventDefault(); var v = input.value; input.value = ""; ask(v); });
  chipsBox.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-q]");
    if (!b) return;
    ask(CHIP_LABEL[b.getAttribute("data-q")][lang()]);
  });

  // expose for testing
  window.AA_CHAT = { match: function (q) { var m = match(q); return m ? m.id : null; }, open: open, ask: ask };
})();
