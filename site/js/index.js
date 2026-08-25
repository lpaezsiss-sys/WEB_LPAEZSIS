/**
 * Home — carrusel destacados + sectores dinámicos
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
    initFeaturedCarousel();
    loadSectores();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
