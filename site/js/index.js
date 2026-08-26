/**
 * Home — hero banners, carrusel destacados + sectores dinámicos
 */
(function () {
  "use strict";

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
    if (/^https?:\/\//i.test(u) || u.charAt(0) === "/") return u;
    return u;
  }

  function applyHeroSlide(banner) {
    var title = $("heroTitle");
    var lead = $("heroLead");
    var btn1 = $("heroBtn1");
    var btn2 = $("heroBtn2");
    var media = $("heroMedia");
    if (!banner) return;

    if (title) title.textContent = banner.titulo || "";
    if (lead) lead.textContent = banner.subtitulo || "";

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

    if (media) {
      var imgUrl = normalizeAssetUrl(banner.imagen_url) || "img/hero/line.jpg";
      media.innerHTML =
        '<img class="hero-media__slide is-active" src="' +
        escapeHtml(imgUrl) +
        '" alt="" width="1920" height="800" loading="eager" decoding="async">';
    }
  }

  function initHeroSlider(banners) {
    var hero = $("homeHero");
    var nav = $("heroSliderNav");
    var dots = $("heroDots");
    var prev = $("heroPrev");
    var next = $("heroNext");
    if (!hero || !banners || !banners.length) return;

    hero.classList.add("hero--managed");
    var index = 0;
    var timer = null;

    function goTo(i) {
      index = ((i % banners.length) + banners.length) % banners.length;
      applyHeroSlide(banners[index]);
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
      timer = window.setInterval(function () {
        goTo(index + 1);
      }, 7000);
    }

    function stopAuto() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (banners.length === 1) {
      applyHeroSlide(banners[0]);
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
    goTo(0);
    startAuto();
  }

  async function loadBanners() {
    try {
      var res = await fetch("api/banners.php?_=" + Date.now());
      if (!res.ok) throw new Error("HTTP " + res.status);
      var banners = await res.json();
      if (!Array.isArray(banners) || !banners.length) return;
      initHeroSlider(banners);
    } catch (err) {
      console.error("Error cargando banners:", err);
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
          var img = escapeHtml(normalizeAssetUrl(sec.imagen_url) || "img/hero/plant.jpg");
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
