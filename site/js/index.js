/**
 * Home — hero banners (autoplay), carrusel destacados + sectores
 * Solo se carga desde index.html.
 */
(function () {
  "use strict";

  var HERO_DEFAULT_INTERVAL = 5000;

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getScroller() {
    var track = $("featuredProductsTrack");
    if (!track) return null;
    var wrapper = track.closest(".products-carousel-wrapper");
    return wrapper || track;
  }

  function updateButtons(scroller, prev, next) {
    if (!scroller || !prev || !next) return;
    var max = Math.max(0, scroller.scrollWidth - scroller.clientWidth - 2);
    prev.disabled = scroller.scrollLeft <= 2;
    next.disabled = scroller.scrollLeft >= max;
  }

  function cardStep(scroller) {
    var track = $("featuredProductsTrack");
    var card = track && track.querySelector(".product-card, article");
    if (!card) return Math.max(240, Math.floor(scroller.clientWidth * 0.85));
    var gap = 20;
    if (track) {
      var style = window.getComputedStyle(track);
      gap = parseFloat(style.columnGap || style.gap || "20") || 20;
    }
    return card.getBoundingClientRect().width + gap;
  }

  function initFeaturedCarousel() {
    var track = $("featuredProductsTrack");
    var prev = $("featuredPrev");
    var next = $("featuredNext");
    var scroller = getScroller();
    if (!track || !prev || !next || !scroller) return;

    function refresh() {
      updateButtons(scroller, prev, next);
    }

    prev.addEventListener("click", function () {
      scroller.scrollBy({ left: -cardStep(scroller), behavior: "smooth" });
    });
    next.addEventListener("click", function () {
      scroller.scrollBy({ left: cardStep(scroller), behavior: "smooth" });
    });

    scroller.addEventListener("scroll", refresh, { passive: true });
    window.addEventListener("resize", refresh);

    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next.click();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev.click();
      }
    });

    window.__lpaezFeaturedCarouselRefresh = refresh;
    refresh();
  }

  function normalizeAssetUrl(url) {
    var u = String(url || "").trim();
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    u = u.replace(/^\/+/, "");
    return u;
  }

  function preferWebp(url) {
    var u = normalizeAssetUrl(url);
    if (/\.(jpe?g|png)$/i.test(u)) return u.replace(/\.(jpe?g|png)$/i, ".webp");
    return "";
  }

  function applyHeroCopy(banner) {
    var title = $("heroTitle");
    var lead = $("heroLead");
    var btn1 = $("heroBtn1");
    var btn2 = $("heroBtn2");
    if (!banner) return;

    if (title && banner.titulo) title.textContent = banner.titulo;
    if (lead && banner.subtitulo) lead.textContent = banner.subtitulo;

    if (btn1) {
      var t1 = String(banner.texto_btn_1 || "").trim();
      var l1 = String(banner.link_btn_1 || "").trim();
      if (t1 && l1) {
        btn1.textContent = t1;
        btn1.href = l1;
        btn1.hidden = false;
      } else {
        btn1.hidden = true;
      }
    }
    if (btn2) {
      var t2 = String(banner.texto_btn_2 || "").trim();
      var l2 = String(banner.link_btn_2 || "").trim();
      if (t2 && l2) {
        btn2.textContent = t2;
        btn2.href = l2;
        btn2.hidden = false;
      } else {
        btn2.hidden = true;
      }
    }
  }

  function buildHeroSlides(media, banners) {
    media.innerHTML = banners
      .map(function (banner, i) {
        var imgUrl = normalizeAssetUrl(banner.imagen_url) || "img/hero/line.jpg";
        var webp = preferWebp(imgUrl);
        var active = i === 0 ? " is-active" : "";
        var source = webp
          ? '<source type="image/webp" srcset="' + escapeHtml(webp) + '">'
          : "";
        return (
          '<picture class="hero-media__slide' +
          active +
          '" data-hero-slide="' +
          i +
          '">' +
          source +
          '<img src="' +
          escapeHtml(imgUrl) +
          '" alt="" width="1920" height="800" loading="' +
          (i === 0 ? "eager" : "lazy") +
          '" decoding="async">' +
          "</picture>"
        );
      })
      .join("");
  }

  function readHeroInterval(hero) {
    var raw =
      (hero &&
        (hero.getAttribute("data-hero-interval") ||
          hero.getAttribute("data-bs-interval"))) ||
      "";
    var n = parseInt(raw, 10);
    if (!n || n < 1500) return HERO_DEFAULT_INTERVAL;
    return n;
  }

  function initHeroSlider(banners) {
    var hero = $("homeHero") || document.querySelector(".prop-hero.hero-banner");
    var media = $("heroMedia") || (hero && hero.querySelector(".hero-media"));
    var nav = $("heroSliderNav");
    var dots = $("heroDots");
    var prev = $("heroPrev");
    var next = $("heroNext");
    if (!hero || !media || !banners || !banners.length) return;

    window.__lpaezHeroManaged = true;
    hero.classList.add("hero--managed");
    hero.setAttribute("data-hero-ride", "carousel");
    if (!hero.getAttribute("data-hero-interval")) {
      hero.setAttribute("data-hero-interval", String(HERO_DEFAULT_INTERVAL));
    }

    var index = 0;
    var timer = null;
    var intervalMs = readHeroInterval(hero);

    buildHeroSlides(media, banners);
    applyHeroCopy(banners[0]);

    function goTo(i) {
      index = ((i % banners.length) + banners.length) % banners.length;
      var slides = media.querySelectorAll(".hero-media__slide");
      slides.forEach(function (el, di) {
        el.classList.toggle("is-active", di === index);
      });
      applyHeroCopy(banners[index]);
      if (dots) {
        dots.querySelectorAll(".hero-dot").forEach(function (dot, di) {
          dot.classList.toggle("is-active", di === index);
          dot.setAttribute("aria-selected", di === index ? "true" : "false");
        });
      }
    }

    function startAuto() {
      stopAuto();
      if (banners.length < 2) return;
      var ride =
        hero.getAttribute("data-hero-ride") ||
        hero.getAttribute("data-bs-ride") ||
        "carousel";
      if (ride === "false" || ride === "0") return;
      timer = window.setInterval(function () {
        goTo(index + 1);
      }, intervalMs);
    }

    function stopAuto() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (banners.length === 1) {
      if (nav) nav.hidden = true;
      return;
    }

    if (nav) nav.hidden = false;
    if (dots) {
      dots.innerHTML = banners
        .map(function (_b, i) {
          return (
            '<button type="button" class="hero-dot' +
            (i === 0 ? " is-active" : "") +
            '" role="tab" aria-selected="' +
            (i === 0 ? "true" : "false") +
            '" aria-label="Slide ' +
            (i + 1) +
            '" data-hero-dot="' +
            i +
            '"></button>'
          );
        })
        .join("");
      dots.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-hero-dot]");
        if (!btn) return;
        goTo(parseInt(btn.getAttribute("data-hero-dot"), 10) || 0);
        startAuto();
      });
    }
    if (prev) {
      prev.addEventListener("click", function () {
        goTo(index - 1);
        startAuto();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        goTo(index + 1);
        startAuto();
      });
    }

    hero.addEventListener("mouseenter", stopAuto);
    hero.addEventListener("mouseleave", startAuto);
    hero.addEventListener("focusin", stopAuto);
    hero.addEventListener("focusout", function (e) {
      if (!hero.contains(e.relatedTarget)) startAuto();
    });

    goTo(0);
    startAuto();
  }

  function initStaticHeroFallback() {
    if (window.__lpaezHeroManaged) return;
    var hero =
      $("homeHero") || document.querySelector(".prop-hero.hero-banner");
    var slides = document.querySelectorAll(".prop-hero .hero-media__slide");
    if (!hero || slides.length < 2) return;
    var i = 0;
    var intervalMs = readHeroInterval(hero);
    hero.setAttribute("data-hero-ride", "carousel");
    if (!hero.getAttribute("data-hero-interval")) {
      hero.setAttribute("data-hero-interval", String(intervalMs));
    }
    window.setInterval(function () {
      if (window.__lpaezHeroManaged) return;
      slides[i].classList.remove("is-active");
      i = (i + 1) % slides.length;
      slides[i].classList.add("is-active");
    }, intervalMs);
  }

  async function loadBanners() {
    try {
      var res = await fetch("api/banners.php?_=" + Date.now(), {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      var banners = await res.json();
      if (!Array.isArray(banners) || !banners.length) {
        initStaticHeroFallback();
        return;
      }
      initHeroSlider(banners);
    } catch (err) {
      console.error("Error cargando banners:", err);
      initStaticHeroFallback();
    }
  }

  async function loadSectores() {
    var grid = $("sectoresGrid");
    if (!grid) return;
    try {
      var res = await fetch("api/sectores.php?_=" + Date.now());
      if (!res.ok) throw new Error("HTTP " + res.status);
      var sectores = await res.json();
      if (!Array.isArray(sectores) || !sectores.length) return;

      grid.innerHTML = sectores
        .map(function (sec) {
          var nombre = escapeHtml(sec.nombre || "");
          var href = escapeHtml(sec.link_url || "catalogo.html");
          var img = escapeHtml(
            normalizeAssetUrl(sec.imagen_url) || "img/hero/plant.jpg"
          );
          return (
            '<a class="industry-tile" role="listitem" href="' +
            href +
            '" aria-label="' +
            nombre +
            '">' +
            '<span class="industry-tile-media" aria-hidden="true">' +
            '<img src="' +
            img +
            '" alt="" title="' +
            nombre +
            '" loading="lazy" decoding="async">' +
            "</span>" +
            "<h3>" +
            nombre +
            "</h3>" +
            "</a>"
          );
        })
        .join("");
    } catch (err) {
      console.error("Error cargando sectores:", err);
    }
  }

  function boot() {
    loadBanners();
    initFeaturedCarousel();
    loadSectores();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
