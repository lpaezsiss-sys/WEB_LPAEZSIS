/**
 * Home — carrusel de productos destacados
 */
(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }

  function updateButtons(track, prev, next) {
    if (!track || !prev || !next) return;
    var max = Math.max(0, track.scrollWidth - track.clientWidth - 2);
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max;
  }

  function cardStep(track) {
    var card = track.querySelector(".product-card, article");
    if (!card) return Math.max(240, Math.floor(track.clientWidth * 0.85));
    var style = window.getComputedStyle(track);
    var gap = parseFloat(style.columnGap || style.gap || "0") || 0;
    return card.getBoundingClientRect().width + gap;
  }

  function initFeaturedCarousel() {
    var track = $("featuredProductsTrack");
    var prev = $("featuredPrev");
    var next = $("featuredNext");
    if (!track || !prev || !next) return;

    function refresh() {
      updateButtons(track, prev, next);
    }

    prev.addEventListener("click", function () {
      track.scrollBy({ left: -cardStep(track), behavior: "smooth" });
    });
    next.addEventListener("click", function () {
      track.scrollBy({ left: cardStep(track), behavior: "smooth" });
    });

    track.addEventListener("scroll", refresh, { passive: true });
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

    // Expose refresh for after dynamic inject
    window.__lpaezFeaturedCarouselRefresh = refresh;
    refresh();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFeaturedCarousel);
  } else {
    initFeaturedCarousel();
  }
})();
