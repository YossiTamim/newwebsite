(function () {
  // Single switch for the lecturers block and its nav link. Keep false until real photos exist.
  var SHOW_LECTURERS = false;

  var reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mobileNavMq = window.matchMedia("(max-width: 720px)");
  var header = document.querySelector("header.nav");
  var menu = document.getElementById("site-menu");
  var toggle = document.querySelector(".nav-toggle");
  var main = document.querySelector("main");
  var footer = document.querySelector("footer");
  var team = document.getElementById("team");
  var teamLink = document.querySelector("[data-nav-team]");
  var signupUrl = document.body.getAttribute("data-signup-url") || "#signup";
  var signupLinks = document.querySelectorAll("[data-signup]");
  for (var s = 0; s < signupLinks.length; s++) {
    signupLinks[s].setAttribute("href", signupUrl);
    if (/^https?:\/\//i.test(signupUrl)) signupLinks[s].setAttribute("rel", "noopener");
  }
  if (team) team.hidden = !SHOW_LECTURERS;
  if (teamLink) teamLink.hidden = !SHOW_LECTURERS;

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  // --- menu (works without GSAP; stagger uses GSAP when motion is allowed) ---
  function menuLinks() {
    return Array.prototype.filter.call(menu.querySelectorAll("a"), function (el) { return !el.hidden; });
  }
  function syncMenuA11y() {
    var open = menu.classList.contains("is-open");
    if (!mobileNavMq.matches) menu.removeAttribute("aria-hidden");
    else menu.setAttribute("aria-hidden", open ? "false" : "true");
  }
  function setPageInert(on) {
    main.inert = on;
    footer.inert = on;
  }
  function closeMenu(restoreFocus) {
    var wasOpen = menu.classList.contains("is-open");
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "פתיחת תפריט");
    document.documentElement.classList.remove("nav-open");
    setPageInert(false);
    if (window.gsap) window.gsap.set(menu.querySelectorAll("a"), { clearProps: "opacity,transform" });
    syncMenuA11y();
    if (wasOpen && restoreFocus) toggle.focus();
  }
  function openMenu() {
    if (!mobileNavMq.matches) return;
    menu.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "סגירת תפריט");
    document.documentElement.classList.add("nav-open");
    setPageInert(true);
    syncMenuA11y();
    var links = menuLinks();
    if (!reduceMq.matches && window.gsap && links.length) {
      window.gsap.fromTo(links, { opacity: 0, y: 14 }, {
        opacity: 1, y: 0, duration: 0.45, stagger: 0.07, ease: "power2.out", overwrite: "auto"
      });
    }
    requestAnimationFrame(function () {
      var first = menuLinks()[0];
      if (first && menu.classList.contains("is-open")) first.focus({ preventScroll: true });
    });
  }
  toggle.addEventListener("click", function () {
    if (menu.classList.contains("is-open")) closeMenu(false);
    else openMenu();
  });
  menu.addEventListener("click", function (e) {
    if (e.target.closest("a")) closeMenu(false);
  });
  header.addEventListener("click", function (e) {
    if (e.target.closest("a") && menu.classList.contains("is-open")) closeMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (!menu.classList.contains("is-open")) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu(true);
      return;
    }
    if (e.key !== "Tab") return;
    var nodes = header.querySelectorAll("a, button");
    var list = [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.hidden || (el.closest("[hidden]") && el.closest("[hidden]") !== header)) continue;
      var st = getComputedStyle(el);
      if (st.display === "none" || st.visibility === "hidden") continue;
      list.push(el);
    }
    if (!list.length) return;
    var first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  function onNavMq() { if (!mobileNavMq.matches) closeMenu(false); else syncMenuA11y(); }
  if (mobileNavMq.addEventListener) mobileNavMq.addEventListener("change", onNavMq);
  syncMenuA11y();

  // --- hero network + console (paused offscreen) ---
  var hero = document.querySelector(".hero");
  var cv = hero.querySelector("canvas");
  var ctx = cv.getContext("2d");
  var nodes = [["Planner", .06, .14], ["Researcher", .26, .1], ["Coder", .3, .9], ["Tester", .1, .86], ["Deployer", .45, .84]];
  var edges = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 2], [1, 4], [4, 0]];
  var packets = [], pulses = [], W = 0, H = 0, last = 0, heroRaf = 0, lit = 0, lightTimer = 0;
  var heroOn = false, heroSeen = false;
  var accent = cssVar("--accent", "#6ea8ff");
  var accent2 = cssVar("--accent-2", "#a78bfa");
  var cols = [accent, accent2];
  var pos = function (n) { return [nodes[n][1] * W, nodes[n][2] * H]; };

  function resizeCanvas(canvas, context) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (w < 2 || h < 2) return null;
    var bw = Math.round(w * dpr), bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: w, h: h };
  }
  function canvasActive() { return cv.clientWidth > 2 && cv.clientHeight > 2; }
  function spawn(from) {
    var out = edges.map(function (e, i) { return from == null || e[0] === from ? i : -1; }).filter(function (i) { return i >= 0; });
    packets.push({ e: out[Math.random() * out.length | 0], t: 0, c: cols[Math.random() * 2 | 0] });
  }
  function resizeHero() {
    var size = resizeCanvas(cv, ctx);
    if (!size) { W = 0; H = 0; return; }
    W = size.w; H = size.h;
    if (!heroRaf) drawHero();
  }
  function drawHero() {
    if (!W || !H) return;
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    ctx.strokeStyle = cssVar("--border", "#24304f");
    edges.forEach(function (e) {
      if (e[0] >= lit || e[1] >= lit) return;
      var a = pos(e[0]), b = pos(e[1]);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    });
    ctx.globalAlpha = 1;
    pulses.forEach(function (p) {
      if (p.n >= lit) return;
      var c = pos(p.n); ctx.globalAlpha = 1 - p.t;
      ctx.strokeStyle = cols[0]; ctx.beginPath(); ctx.arc(c[0], c[1], 8 + p.t * 28, 0, 7); ctx.stroke();
    });
    ctx.globalAlpha = 1; ctx.font = "12px ui-monospace, Menlo, monospace"; ctx.textAlign = "center";
    nodes.forEach(function (n, i) {
      if (i >= lit) return;
      var c = pos(i);
      ctx.fillStyle = cssVar("--surface", "#131a2e"); ctx.strokeStyle = cols[1];
      ctx.beginPath(); ctx.arc(c[0], c[1], 8, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = cssVar("--muted", "#a3adc6"); ctx.fillText(n[0], c[0], c[1] + 26);
    });
    if (lit < nodes.length) return;
    packets.forEach(function (p) {
      var a = pos(edges[p.e][0]), b = pos(edges[p.e][1]);
      ctx.shadowColor = p.c; ctx.shadowBlur = 12; ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(a[0] + (b[0] - a[0]) * p.t, a[1] + (b[1] - a[1]) * p.t, 3.5, 0, 7); ctx.fill();
    });
    ctx.shadowBlur = 0;
  }
  function tick(now) {
    if (!heroOn) { heroRaf = 0; return; }
    var dt = Math.min(now - last, 50); last = now;
    packets.slice().forEach(function (p) {
      p.t += dt / 1800;
      if (p.t >= 1) {
        var n = edges[p.e][1];
        packets.splice(packets.indexOf(p), 1);
        pulses.push({ n: n, t: 0 });
        spawn(n);
      }
    });
    if (packets.length < 4) spawn();
    if (packets.length < 8 && Math.random() < .004) spawn();
    pulses.forEach(function (p) { p.t += dt / 900; });
    pulses = pulses.filter(function (p) { return p.t < 1; });
    drawHero();
    heroRaf = requestAnimationFrame(tick);
  }
  function lightStep() {
    lightTimer = 0;
    if (!heroOn || reduceMq.matches) return;
    if (lit < nodes.length) lit += 1;
    drawHero();
    if (lit < nodes.length) lightTimer = setTimeout(lightStep, 260);
    else {
      for (var i = 0; i < 4; i++) spawn();
      last = performance.now();
      heroRaf = requestAnimationFrame(tick);
      ensureTyping();
    }
  }

  var bodyEl = hero.querySelector(".console-body");
  var lines = [
    ["planner", "tag-accent", "מפרק את המשימה ל-4 שלבים…"],
    ["researcher", "tag-accent-2", "שולף 12 מסמכים רלוונטיים (RAG)"],
    ["coder", "tag-coder", "כותב את שכבת ה-API…"],
    ["tester", "tag-tester", "✓ 24 בדיקות עברו"],
    ["deployer", "tag-deployer", "🚀 הגרסה עלתה לאוויר"]
  ];
  function row(l) {
    var d = document.createElement("div"), t = document.createElement("span"), m = document.createElement("span");
    d.dir = "rtl"; t.className = "tag " + l[1]; t.textContent = "[" + l[0] + "]";
    d.append(t, m); bodyEl.append(d);
    return [d, m];
  }
  var typeState = { active: false, paused: false, timer: 0, line: 0, char: 0, phase: "type", row: null, msg: null };
  var consoleStatic = false;
  function showConsoleFinal() {
    if (consoleStatic) return;
    consoleStatic = true;
    clearTimeout(typeState.timer);
    typeState.active = false;
    bodyEl.textContent = "";
    lines.forEach(function (l) { row(l)[1].textContent = l[2]; });
  }
  function arm(ms) {
    clearTimeout(typeState.timer);
    if (!typeState.active || typeState.paused || !heroOn) return;
    typeState.timer = setTimeout(typeStep, ms);
  }
  function openLine() {
    var made = row(lines[typeState.line]);
    typeState.row = made[0];
    typeState.msg = made[1];
    typeState.row.classList.add("cursor");
    typeState.char = 0;
  }
  function typeStep() {
    typeState.timer = 0;
    if (!typeState.active || typeState.paused || !heroOn) return;
    if (typeState.phase === "hold") {
      bodyEl.textContent = "";
      typeState.line = 0;
      typeState.phase = "type";
      openLine();
      arm(40);
      return;
    }
    if (typeState.phase === "gap") {
      if (typeState.row) typeState.row.classList.remove("cursor");
      typeState.line += 1;
      if (typeState.line >= lines.length) { typeState.phase = "hold"; arm(2500); return; }
      typeState.phase = "type";
      openLine();
      arm(40);
      return;
    }
    var text = lines[typeState.line][2];
    typeState.char += 1;
    typeState.msg.textContent = text.slice(0, typeState.char);
    if (typeState.char < text.length) arm(40);
    else { typeState.phase = "gap"; arm(500); }
  }
  function pauseTyping() {
    typeState.paused = true;
    clearTimeout(typeState.timer);
  }
  function startTyping() {
    if (typeState.active || reduceMq.matches || consoleStatic) return;
    typeState.active = true;
    typeState.paused = !heroOn;
    typeState.line = 0;
    typeState.char = 0;
    typeState.phase = "type";
    bodyEl.textContent = "";
    openLine();
    if (heroOn) arm(40);
  }
  function resumeTyping() {
    if (!typeState.active || reduceMq.matches) return;
    typeState.paused = false;
    if (heroOn && !typeState.timer) arm(40);
  }
  function ensureTyping() {
    if (reduceMq.matches) { showConsoleFinal(); return; }
    if (!typeState.active) startTyping();
    else resumeTyping();
  }
  function setHeroRunning(on) {
    heroOn = !!on && !document.hidden;
    if (!heroOn) {
      clearTimeout(lightTimer); lightTimer = 0;
      cancelAnimationFrame(heroRaf); heroRaf = 0;
      pauseTyping();
      return;
    }
    if (reduceMq.matches) {
      lit = nodes.length;
      showConsoleFinal();
      resizeHero();
      drawHero();
      return;
    }
    if (!canvasActive()) { ensureTyping(); return; }
    if (lit < nodes.length) {
      if (!lightTimer) lightTimer = setTimeout(lightStep, lit === 0 ? 180 : 260);
      return;
    }
    if (!heroRaf) { last = performance.now(); heroRaf = requestAnimationFrame(tick); }
    ensureTyping();
  }

  // --- signup network: lines converge on the finale button ---
  var signupCanvas = document.querySelector(".signup-net");
  var sCtx = signupCanvas.getContext("2d");
  var sNodes = [[.08, .22], [.92, .18], [.06, .78], [.94, .74], [.5, .08], [.5, .94]];
  var sPhase = 0, sRaf = 0, sOn = false, signupSeen = false;
  function drawSignup(moving) {
    var size = resizeCanvas(signupCanvas, sCtx);
    if (!size) return;
    var sw = size.w, sh = size.h;
    var btn = document.querySelector(".finale-btn");
    var rect = signupCanvas.getBoundingClientRect();
    var b = btn.getBoundingClientRect();
    var tx = b.left + b.width / 2 - rect.left;
    var ty = b.top + b.height / 2 - rect.top;
    sCtx.clearRect(0, 0, sw, sh);
    sCtx.lineWidth = 1.25;
    sNodes.forEach(function (n, i) {
      var x = n[0] * sw, y = n[1] * sh;
      sCtx.globalAlpha = 0.45;
      sCtx.strokeStyle = i % 2 ? accent2 : accent;
      sCtx.beginPath(); sCtx.moveTo(x, y); sCtx.lineTo(tx, ty); sCtx.stroke();
      sCtx.globalAlpha = 1;
      sCtx.fillStyle = cssVar("--surface", "#131a2e");
      sCtx.strokeStyle = accent2;
      sCtx.beginPath(); sCtx.arc(x, y, 5, 0, Math.PI * 2); sCtx.fill(); sCtx.stroke();
      if (!moving) return;
      var p = (sPhase + i * 0.16) % 1;
      sCtx.shadowColor = accent; sCtx.shadowBlur = 10; sCtx.fillStyle = accent;
      sCtx.beginPath(); sCtx.arc(x + (tx - x) * p, y + (ty - y) * p, 3, 0, Math.PI * 2); sCtx.fill();
      sCtx.shadowBlur = 0;
    });
    sCtx.globalAlpha = 1;
  }
  function sTick() {
    if (!sOn) { sRaf = 0; return; }
    sPhase = (sPhase + 0.007) % 1;
    drawSignup(true);
    sRaf = requestAnimationFrame(sTick);
  }
  function setSignupRunning(on) {
    sOn = !!on && !document.hidden && !reduceMq.matches;
    cancelAnimationFrame(sRaf); sRaf = 0;
    if (reduceMq.matches) { drawSignup(false); return; }
    if (sOn) sRaf = requestAnimationFrame(sTick);
  }

  new IntersectionObserver(function (entries) {
    heroSeen = entries[0].isIntersecting;
    if (!document.hidden) setHeroRunning(heroSeen);
  }, { threshold: 0.05 }).observe(hero);
  new IntersectionObserver(function (entries) {
    header.classList.toggle("is-compact", !entries[0].isIntersecting);
  }, { rootMargin: "-72px 0px 0px 0px", threshold: 0 }).observe(hero);
  new IntersectionObserver(function (entries) {
    signupSeen = entries[0].isIntersecting;
    if (!document.hidden) setSignupRunning(signupSeen);
  }, { threshold: 0.12 }).observe(document.querySelector(".finale"));
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { setHeroRunning(false); setSignupRunning(false); return; }
    if (heroSeen) setHeroRunning(true);
    if (signupSeen) setSignupRunning(true);
  });
  window.addEventListener("resize", function () {
    resizeHero();
    if (!sOn) drawSignup(false);
  });
  if (reduceMq.matches) {
    lit = nodes.length;
    showConsoleFinal();
    resizeHero();
    drawHero();
    drawSignup(false);
  }

  // FAQ answers: opacity only, and only when motion is allowed.
  document.querySelectorAll("#faq details").forEach(function (d) {
    var p = d.querySelector("p");
    d.addEventListener("toggle", function () {
      if (!d.open || reduceMq.matches || !window.gsap || !p) return;
      window.gsap.fromTo(p, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power1.out", overwrite: "auto" });
    });
  });

  var motionReady = false;
  function bootMotion() {
    if (motionReady || !window.gsap || !window.ScrollTrigger) return;
    motionReady = true;
    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    if (!reduceMq.matches) {
      var runSweep = function () {
        gsap.fromTo(".sweep", { xPercent: -160 }, {
          xPercent: 340, duration: 1.15, ease: "power2.inOut", overwrite: "auto",
          onComplete: function () { gsap.set(".sweep", { xPercent: -160 }); }
        });
      };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(runSweep);
      else runSweep();
    }

    var mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", function () {
      gsap.from(".mid-cta .wrap", {
        opacity: 0, y: 16, duration: 0.6, ease: "power2.out",
        scrollTrigger: { trigger: ".mid-cta", start: "top 86%" }
      });
      gsap.from(".finale .wrap", {
        opacity: 0, y: 18, duration: 0.7, ease: "power2.out",
        scrollTrigger: { trigger: ".finale", start: "top 82%" }
      });
      gsap.fromTo(".signup-dim", { opacity: 0 }, {
        opacity: 1, ease: "none",
        scrollTrigger: { trigger: ".finale", start: "top 85%", end: "top 40%", scrub: true }
      });
      if (team && !team.hidden) {
        gsap.from(team.querySelectorAll(".person"), {
          opacity: 0, scale: 0.96, y: 16, stagger: 0.12, duration: 0.8, ease: "power2.out",
          scrollTrigger: { trigger: team, start: "top 80%" }
        });
      }
    });

    mm.add("(min-width: 720px) and (prefers-reduced-motion: no-preference)", function () {
      document.documentElement.classList.add("is-overlap");
      var heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".hero",
          start: "top 64px",
          end: "+=34%",
          pin: true,
          scrub: 0.4,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
      heroTl.to(".hero-text", { scale: 0.9, opacity: 0, ease: "none", duration: 0.62 }, 0);
      heroTl.to(".console", { scale: 0.94, opacity: 0, ease: "none", duration: 0.62 }, 0);
      heroTl.to(".hero-bg", { scale: 1.4, opacity: 0, ease: "none", duration: 0.78 }, 0.05);
      heroTl.to(".hero-stage", { opacity: 0, ease: "none", duration: 0.7 }, 0.32);
      heroTl.fromTo(".what-head", { y: 36, opacity: 0 }, { y: 0, opacity: 1, ease: "none", duration: 0.55 }, 0.46);

      var cards = gsap.utils.toArray("#what .card");
      var spot = document.querySelector(".spot");
      var centers = [];
      function measureCards() {
        centers = cards.map(function (card) {
          return {
            x: card.offsetLeft + card.offsetWidth / 2,
            y: card.offsetTop + card.offsetHeight / 2
          };
        });
      }
      function applyWhat(progress) {
        if (!centers.length) measureCards();
        var exact = progress * (cards.length - 1);
        var i0 = Math.min(cards.length - 1, Math.floor(exact));
        var i1 = Math.min(cards.length - 1, i0 + 1);
        var t = i0 === i1 ? 0 : exact - i0;
        var a = centers[i0], b = centers[i1];
        gsap.set(spot, {
          xPercent: -50, yPercent: -50, opacity: 1,
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t
        });
        cards.forEach(function (card, i) {
          var influence = Math.max(0, 1 - Math.abs(exact - i));
          gsap.set(card, { scale: 0.96 + 0.1 * influence });
        });
      }
      function resetWhat() {
        gsap.set(cards, { scale: 1 });
        gsap.set(spot, { opacity: 0, x: 0, y: 0, xPercent: 0, yPercent: 0 });
      }
      measureCards();
      gsap.set(spot, { opacity: 0 });
      ScrollTrigger.create({
        trigger: "#what",
        start: "top 64px",
        end: "+=220%",
        pin: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        snap: cards.length > 1 ? {
          snapTo: 1 / (cards.length - 1),
          duration: 0.25,
          delay: 0.06,
          ease: "power1.inOut"
        } : false,
        onRefresh: function (self) { measureCards(); if (self.isActive) applyWhat(self.progress); },
        onUpdate: function (self) { applyWhat(self.progress); },
        onLeave: resetWhat,
        onLeaveBack: resetWhat
      });

      var items = gsap.utils.toArray("#syllabus .modules li");
      var glows = gsap.utils.toArray("#syllabus .mod-glow");
      var bar = document.querySelector(".timeline-progress");
      var track = document.querySelector(".timeline-track");
      var marks = [];
      function measureLine() {
        var tr = track.getBoundingClientRect();
        var h = tr.height || 1;
        marks = items.map(function (li) {
          var r = li.getBoundingClientRect();
          return Math.min(1, Math.max(0, (r.top + 22 - tr.top) / h));
        });
      }
      measureLine();
      gsap.set(bar, { scaleY: 0 });
      gsap.set(glows, { opacity: 0 });
      ScrollTrigger.create({
        trigger: "#syllabus .timeline",
        start: "top 72%",
        end: "bottom 58%",
        scrub: 0.35,
        onRefresh: function (self) {
          measureLine();
          if (self.progress) {
            gsap.set(bar, { scaleY: self.progress });
          }
        },
        onUpdate: function (self) {
          var p = self.progress;
          gsap.set(bar, { scaleY: p });
          glows.forEach(function (glow, i) {
            gsap.set(glow, { opacity: p + 0.03 >= marks[i] ? 1 : 0 });
          });
        }
      });

      return function () {
        document.documentElement.classList.remove("is-overlap");
        gsap.set([".hero-text", ".console", ".hero-bg", ".hero-stage", ".what-head", "#what .card", ".spot", ".timeline-progress", ".mod-glow"], { clearProps: "all" });
      };
    });

    mm.add("(max-width: 719px) and (prefers-reduced-motion: no-preference)", function () {
      gsap.from("#what .card", {
        opacity: 0, y: 18, stagger: 0.08, duration: 0.55, ease: "power2.out",
        scrollTrigger: { trigger: "#what", start: "top 86%" }
      });
      gsap.from("#syllabus .modules li", {
        opacity: 0, y: 16, stagger: 0.06, duration: 0.5, ease: "power2.out",
        scrollTrigger: { trigger: "#syllabus", start: "top 86%" }
      });
    });

    mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", function () {
      var btn = document.querySelector(".finale-btn");
      if (!btn) return;
      var qx = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3.out" });
      var qy = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3.out" });
      function onMove(e) {
        if (e.pointerType && e.pointerType !== "mouse") return;
        var r = btn.getBoundingClientRect();
        var x = Number(gsap.getProperty(btn, "x")) || 0;
        var y = Number(gsap.getProperty(btn, "y")) || 0;
        var cx = r.left + r.width / 2 - x;
        var cy = r.top + r.height / 2 - y;
        var dx = e.clientX - cx;
        var dy = e.clientY - cy;
        var dist = Math.hypot(dx, dy) || 1;
        var radius = 150;
        if (dist > radius) { qx(0); qy(0); return; }
        var pull = (1 - dist / radius) * 16;
        qx(dx / dist * pull);
        qy(dy / dist * pull);
      }
      function onLeave() { qx(0); qy(0); }
      document.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      return function () {
        document.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        gsap.set(btn, { clearProps: "transform" });
      };
    });

    function refresh() {
      resizeHero();
      if (!sOn) drawSignup(false);
      ScrollTrigger.refresh();
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    window.addEventListener("load", refresh);
  }
  bootMotion();
  window.addEventListener("DOMContentLoaded", bootMotion);
})();
